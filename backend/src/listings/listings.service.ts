import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuidv4 } from 'uuid';

export interface ListingFilterDto {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: string;
  status?: string;
  dietary?: string;
  search?: string;
  vendorId?: string;
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private db: DatabaseService,
    private eventsGateway: EventsGateway
  ) {}

  /**
   * Automatically updates any past-deadline AVAILABLE listing to EXPIRED
   */
  async checkAndExpireListings() {
    const now = new Date().toISOString();
    const expiredListings = await this.db.query(
      `SELECT id FROM listings WHERE status = 'AVAILABLE' AND pickup_deadline < ?`,
      [now]
    );

    if (expiredListings.rows.length > 0) {
      await this.db.query(
        `UPDATE listings SET status = 'EXPIRED', updated_at = ? WHERE status = 'AVAILABLE' AND pickup_deadline < ?`,
        [now, now]
      );
      for (const item of expiredListings.rows) {
        this.eventsGateway.broadcastListingExpired({ listingId: item.id });
      }
      this.logger.log(`Auto-expired ${expiredListings.rows.length} overdue listings.`);
    }
  }

  async createListing(vendorId: string, dto: any) {
    // Generate secure 4-digit handover PIN
    const handoverPin = Math.floor(1000 + Math.random() * 9000).toString();
    const id = uuidv4();
    const now = new Date().toISOString();

    const dietaryFlagsJson = Array.isArray(dto.dietary_flags)
      ? JSON.stringify(dto.dietary_flags)
      : dto.dietary_flags || '[]';

    await this.db.query(
      `INSERT INTO listings (
        id, vendor_id, title, description, category, quantity, unit,
        portion_estimate, dietary_flags, safe_temperature, packaging_type,
        allergen_info, address, latitude, longitude, pickup_start,
        pickup_deadline, status, handover_pin, notes, food_safety_acknowledged,
        image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, 1, ?, ?, ?)`,
      [
        id,
        vendorId,
        dto.title,
        dto.description || '',
        dto.category || 'COOKED_MEALS',
        dto.quantity || 1,
        dto.unit || 'portions',
        dto.portion_estimate || dto.quantity || 1,
        dietaryFlagsJson,
        dto.safe_temperature || 'ROOM',
        dto.packaging_type || 'SEALED_CONTAINERS',
        dto.allergen_info || 'None specified',
        dto.address,
        dto.latitude,
        dto.longitude,
        dto.pickup_start || now,
        dto.pickup_deadline,
        handoverPin,
        dto.notes || '',
        dto.image_url || '',
        now,
        now,
      ]
    );

    // Audit log
    await this.db.query(
      `INSERT INTO audit_logs (id, event_type, actor_id, listing_id, details, timestamp)
       VALUES (?, 'LISTING_CREATED', ?, ?, ?, ?)`,
      [uuidv4(), vendorId, id, JSON.stringify({ title: dto.title, quantity: dto.quantity }), now]
    );

    const fullListing = await this.getListingById(id);
    this.eventsGateway.broadcastListingCreated(fullListing);
    return fullListing;
  }

  async getAllListings(filter: ListingFilterDto) {
    await this.checkAndExpireListings();

    let query = `
      SELECT l.*, 
             u.name as vendor_name, 
             u.org_name as vendor_org_name,
             u.org_type as vendor_org_type,
             u.phone as vendor_phone
      FROM listings l
      JOIN users u ON l.vendor_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.vendorId) {
      query += ` AND l.vendor_id = ?`;
      params.push(filter.vendorId);
    }

    if (filter.status && filter.status !== 'ALL') {
      query += ` AND l.status = ?`;
      params.push(filter.status);
    } else if (!filter.vendorId && !filter.status) {
      // By default for discoverability, show active available listings first
      query += ` AND l.status IN ('AVAILABLE', 'CLAIMED')`;
    }

    if (filter.category && filter.category !== 'ALL') {
      query += ` AND l.category = ?`;
      params.push(filter.category);
    }

    if (filter.search) {
      query += ` AND (l.title LIKE ? OR l.description LIKE ? OR l.address LIKE ? OR u.org_name LIKE ?)`;
      const s = `%${filter.search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY CASE WHEN l.status = 'AVAILABLE' THEN 1 WHEN l.status = 'CLAIMED' THEN 2 ELSE 3 END, l.pickup_deadline ASC`;

    const res = await this.db.query(query, params);
    let listings = res.rows.map((row) => ({
      ...row,
      dietary_flags: typeof row.dietary_flags === 'string' ? JSON.parse(row.dietary_flags) : row.dietary_flags || [],
    }));

    // Filter dietary if requested
    if (filter.dietary && filter.dietary !== 'ALL') {
      listings = listings.filter((l) =>
        l.dietary_flags && l.dietary_flags.some((d: string) => d.toLowerCase() === filter.dietary!.toLowerCase())
      );
    }

    // Geographic filtering and distance calculation
    if (filter.lat !== undefined && filter.lng !== undefined) {
      const userLat = Number(filter.lat);
      const userLng = Number(filter.lng);
      const maxRadius = filter.radiusKm ? Number(filter.radiusKm) : 15; // default 15km

      listings = listings.map((l) => {
        const distanceKm = this.db.calculateDistanceKm(userLat, userLng, l.latitude, l.longitude);
        return { ...l, distance_km: distanceKm };
      });

      if (filter.radiusKm && filter.radiusKm > 0) {
        listings = listings.filter((l) => l.distance_km <= maxRadius);
      }

      // Sort by proximity
      listings.sort((a, b) => a.distance_km - b.distance_km);
    }

    return listings;
  }

  async getListingById(id: string) {
    await this.checkAndExpireListings();

    const res = await this.db.query(
      `SELECT l.*, 
              u.name as vendor_name, 
              u.org_name as vendor_org_name,
              u.org_type as vendor_org_type,
              u.phone as vendor_phone,
              u.email as vendor_email
       FROM listings l
       JOIN users u ON l.vendor_id = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Listing not found');
    }

    const listing = res.rows[0];
    listing.dietary_flags = typeof listing.dietary_flags === 'string' ? JSON.parse(listing.dietary_flags) : listing.dietary_flags || [];

    // Also fetch claim record if claimed
    const claimRes = await this.db.query(
      `SELECT c.*, u.name as recipient_name, u.org_name as recipient_org_name, u.phone as recipient_phone
       FROM claims c
       JOIN users u ON c.recipient_id = u.id
       WHERE c.listing_id = ? AND c.status != 'CANCELLED'
       ORDER BY c.created_at DESC LIMIT 1`,
      [id]
    );

    if (claimRes.rows.length > 0) {
      listing.claim = claimRes.rows[0];
    }

    return listing;
  }

  async updateListing(id: string, vendorId: string, dto: any) {
    const existing = await this.getListingById(id);
    if (existing.vendor_id !== vendorId) {
      throw new ForbiddenException('You can only update your own listings.');
    }
    if (existing.status !== 'AVAILABLE') {
      throw new BadRequestException('Cannot edit a listing that has already been claimed, collected or expired.');
    }

    const now = new Date().toISOString();
    const dietaryFlagsJson = Array.isArray(dto.dietary_flags)
      ? JSON.stringify(dto.dietary_flags)
      : dto.dietary_flags || JSON.stringify(existing.dietary_flags);

    await this.db.query(
      `UPDATE listings SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        quantity = COALESCE(?, quantity),
        unit = COALESCE(?, unit),
        portion_estimate = COALESCE(?, portion_estimate),
        dietary_flags = COALESCE(?, dietary_flags),
        safe_temperature = COALESCE(?, safe_temperature),
        allergen_info = COALESCE(?, allergen_info),
        pickup_deadline = COALESCE(?, pickup_deadline),
        notes = COALESCE(?, notes),
        updated_at = ?
       WHERE id = ?`,
      [
        dto.title,
        dto.description,
        dto.category,
        dto.quantity,
        dto.unit,
        dto.portion_estimate,
        dietaryFlagsJson,
        dto.safe_temperature,
        dto.allergen_info,
        dto.pickup_deadline,
        dto.notes,
        now,
        id,
      ]
    );

    const updated = await this.getListingById(id);
    this.eventsGateway.broadcastListingUpdated(updated);
    return updated;
  }

  async closeListing(id: string, userId: string, userRole: string) {
    const existing = await this.getListingById(id);
    if (userRole !== 'ADMIN' && existing.vendor_id !== userId) {
      throw new ForbiddenException('Permission denied.');
    }

    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE listings SET status = 'CANCELLED', updated_at = ? WHERE id = ?`,
      [now, id]
    );

    // If there was an active claim, cancel it too
    await this.db.query(
      `UPDATE claims SET status = 'CANCELLED' WHERE listing_id = ? AND status = 'PENDING_PICKUP'`,
      [id]
    );

    const updated = await this.getListingById(id);
    this.eventsGateway.broadcastListingUpdated(updated);
    return updated;
  }

  async resetTimers() {
    const now = new Date();
    const offsets: { [id: string]: number } = {
      list_batch_1: 2.5,
      list_batch_2: 1.2,
      list_batch_3: 3.0,
      list_batch_4: 4.0,
      list_batch_5: 5.0,
      list_batch_6: 6.5,
      list_batch_7: 1.8,
      list_batch_8: 1.1,
      list_batch_9: 2.8,
      list_batch_10: 4.5,
      list_batch_11: 1.5,
      list_batch_12: 3.2,
      list_batch_13: 2.2,
      list_batch_14: 3.8,
    };

    for (const [id, hoursAhead] of Object.entries(offsets)) {
      const deadline = new Date(now.getTime() + hoursAhead * 3600 * 1000).toISOString();
      await this.db.query(
        `UPDATE listings SET 
          pickup_start = ?, 
          pickup_deadline = ?,
          status = CASE WHEN id = 'list_batch_4' THEN 'CLAIMED' ELSE 'AVAILABLE' END,
          updated_at = ?
         WHERE id = ?`,
        [now.toISOString(), deadline, now.toISOString(), id]
      );
    }
    return { success: true, message: 'All listing countdown timers reset fresh!' };
  }
}

