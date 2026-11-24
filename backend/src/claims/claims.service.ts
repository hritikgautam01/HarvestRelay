import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClaimsService {
  constructor(
    private db: DatabaseService,
    private eventsGateway: EventsGateway
  ) {}

  /**
   * Controlled claim workflow to prevent duplicate or conflicting claims
   */
  async claimListing(recipientId: string, listingId: string, dto: {
    recipient_notes?: string;
    volunteer_name?: string;
    volunteer_phone?: string;
    declaration_accepted: boolean;
  }) {
    if (!dto.declaration_accepted) {
      throw new BadRequestException('You must accept the food safety & responsible pickup declaration.');
    }

    // Check listing availability atomically
    const listingRes = await this.db.query('SELECT * FROM listings WHERE id = ?', [listingId]);
    if (listingRes.rows.length === 0) {
      throw new NotFoundException('Listing not found');
    }

    const listing = listingRes.rows[0];

    // Check expiry
    const now = new Date();
    if (new Date(listing.pickup_deadline).getTime() < now.getTime()) {
      await this.db.query(`UPDATE listings SET status = 'EXPIRED' WHERE id = ?`, [listingId]);
      this.eventsGateway.broadcastListingExpired({ listingId });
      throw new ConflictException('This listing has expired and can no longer be claimed.');
    }

    if (listing.status !== 'AVAILABLE') {
      throw new ConflictException(`Listing is no longer available (current status: ${listing.status}).`);
    }

    const claimId = uuidv4();
    const nowIso = now.toISOString();

    // Update listing status to CLAIMED
    await this.db.query(
      `UPDATE listings SET status = 'CLAIMED', updated_at = ? WHERE id = ? AND status = 'AVAILABLE'`,
      [nowIso, listingId]
    );

    // Insert claim record
    await this.db.query(
      `INSERT INTO claims (
        id, listing_id, recipient_id, status, claim_time, recipient_notes,
        volunteer_name, volunteer_phone, declaration_accepted, created_at
      ) VALUES (?, ?, ?, 'PENDING_PICKUP', ?, ?, ?, ?, 1, ?)`,
      [
        claimId,
        listingId,
        recipientId,
        nowIso,
        dto.recipient_notes || '',
        dto.volunteer_name || '',
        dto.volunteer_phone || '',
        nowIso,
      ]
    );

    // Create Audit Log
    await this.db.query(
      `INSERT INTO audit_logs (id, event_type, actor_id, listing_id, details, timestamp)
       VALUES (?, 'LISTING_CLAIMED', ?, ?, ?, ?)`,
      [uuidv4(), recipientId, listingId, JSON.stringify({ claimId, volunteer: dto.volunteer_name }), nowIso]
    );

    // Create notification for vendor
    const notifId = uuidv4();
    await this.db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, timestamp)
       VALUES (?, ?, ?, ?, 'CLAIM_NEW', ?)`,
      [
        notifId,
        listing.vendor_id,
        'Surplus Batch Claimed!',
        `Your listing "${listing.title}" has been claimed. Pickup deadline is ${new Date(listing.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        nowIso,
      ]
    );

    // Fetch updated listing & claim details
    const updatedListingRes = await this.db.query('SELECT * FROM listings WHERE id = ?', [listingId]);
    const updatedClaimRes = await this.db.query('SELECT * FROM claims WHERE id = ?', [claimId]);

    const updatedListing = updatedListingRes.rows[0];
    const claim = updatedClaimRes.rows[0];

    // Socket.IO broadcast
    this.eventsGateway.broadcastListingClaimed({
      listingId,
      listing: updatedListing,
      claim,
    });

    this.eventsGateway.broadcastNotification({
      userId: listing.vendor_id,
      title: 'Batch Claimed',
      message: `Listing "${listing.title}" was claimed.`,
    });

    return {
      success: true,
      claim,
      listing: updatedListing,
      message: 'Batch successfully claimed! Coordinate pickup before deadline.',
    };
  }

  /**
   * Confirm handover with 4-digit PIN verification
   */
  async confirmHandover(userId: string, userRole: string, claimId: string, enteredPin: string) {
    const claimRes = await this.db.query(
      `SELECT c.*, l.handover_pin, l.vendor_id, l.title as listing_title, l.quantity, l.portion_estimate
       FROM claims c
       JOIN listings l ON c.listing_id = l.id
       WHERE c.id = ?`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      throw new NotFoundException('Claim record not found');
    }

    const claim = claimRes.rows[0];

    // Verify authorized user (vendor, recipient, or admin)
    if (userRole !== 'ADMIN' && claim.vendor_id !== userId && claim.recipient_id !== userId) {
      throw new ForbiddenException('Unauthorized to confirm this handover.');
    }

    if (claim.status === 'COMPLETED') {
      throw new BadRequestException('Handover was already completed for this batch.');
    }

    // Verify PIN
    if (claim.handover_pin !== enteredPin.trim()) {
      throw new BadRequestException('Invalid handover PIN. Please check the code provided by the vendor.');
    }

    const nowIso = new Date().toISOString();

    // Mark claim completed
    await this.db.query(
      `UPDATE claims SET status = 'COMPLETED', pickup_time = ?, handover_confirmed_at = ? WHERE id = ?`,
      [nowIso, nowIso, claimId]
    );

    // Mark listing collected
    await this.db.query(
      `UPDATE listings SET status = 'COLLECTED', updated_at = ? WHERE id = ?`,
      [nowIso, claim.listing_id]
    );

    // Audit log
    await this.db.query(
      `INSERT INTO audit_logs (id, event_type, actor_id, listing_id, details, timestamp)
       VALUES (?, 'HANDOVER_COMPLETED', ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        claim.listing_id,
        JSON.stringify({ portions: claim.portion_estimate, quantity: claim.quantity }),
        nowIso,
      ]
    );

    const updatedListingRes = await this.db.query('SELECT * FROM listings WHERE id = ?', [claim.listing_id]);
    const updatedClaimRes = await this.db.query('SELECT * FROM claims WHERE id = ?', [claimId]);

    this.eventsGateway.broadcastListingCollected({
      listingId: claim.listing_id,
      listing: updatedListingRes.rows[0],
      claim: updatedClaimRes.rows[0],
    });

    return {
      success: true,
      message: 'Handover verified successfully! Food safely redistributed.',
      listing: updatedListingRes.rows[0],
      claim: updatedClaimRes.rows[0],
    };
  }

  /**
   * Cancel an uncollected claim
   */
  async cancelClaim(userId: string, userRole: string, claimId: string, reason?: string) {
    const claimRes = await this.db.query(
      `SELECT c.*, l.vendor_id, l.pickup_deadline FROM claims c JOIN listings l ON c.listing_id = l.id WHERE c.id = ?`,
      [claimId]
    );

    if (claimRes.rows.length === 0) {
      throw new NotFoundException('Claim not found');
    }

    const claim = claimRes.rows[0];
    if (userRole !== 'ADMIN' && claim.recipient_id !== userId && claim.vendor_id !== userId) {
      throw new ForbiddenException('Not authorized to cancel this claim.');
    }

    const now = new Date();
    const isExpired = new Date(claim.pickup_deadline).getTime() < now.getTime();
    const newListingStatus = isExpired ? 'EXPIRED' : 'AVAILABLE';

    await this.db.query(`UPDATE claims SET status = 'CANCELLED' WHERE id = ?`, [claimId]);
    await this.db.query(`UPDATE listings SET status = ?, updated_at = ? WHERE id = ?`, [
      newListingStatus,
      now.toISOString(),
      claim.listing_id,
    ]);

    const updatedListingRes = await this.db.query('SELECT * FROM listings WHERE id = ?', [claim.listing_id]);

    this.eventsGateway.broadcastListingUpdated(updatedListingRes.rows[0]);

    return {
      success: true,
      message: 'Claim cancelled. Listing status returned to ' + newListingStatus,
      listing: updatedListingRes.rows[0],
    };
  }

  /**
   * Recipient active & past claims
   */
  async getMyClaims(recipientId: string) {
    const res = await this.db.query(
      `SELECT c.*, 
              l.title, l.description, l.category, l.quantity, l.unit, l.portion_estimate,
              l.address, l.latitude, l.longitude, l.pickup_start, l.pickup_deadline,
              l.safe_temperature, l.allergen_info, l.handover_pin, l.status as listing_status,
              u.name as vendor_name, u.org_name as vendor_org_name, u.phone as vendor_phone
       FROM claims c
       JOIN listings l ON c.listing_id = l.id
       JOIN users u ON l.vendor_id = u.id
       WHERE c.recipient_id = ?
       ORDER BY c.created_at DESC`,
      [recipientId]
    );
    return res.rows;
  }

  /**
   * Vendor incoming claims
   */
  async getVendorClaims(vendorId: string) {
    const res = await this.db.query(
      `SELECT c.*, 
              l.title, l.quantity, l.unit, l.portion_estimate, l.pickup_deadline,
              l.handover_pin, l.status as listing_status,
              u.name as recipient_name, u.org_name as recipient_org_name, u.phone as recipient_phone
       FROM claims c
       JOIN listings l ON c.listing_id = l.id
       JOIN users u ON c.recipient_id = u.id
       WHERE l.vendor_id = ?
       ORDER BY c.created_at DESC`,
      [vendorId]
    );
    return res.rows;
  }
}

