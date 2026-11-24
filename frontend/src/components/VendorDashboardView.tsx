import React, { useState } from 'react';
import { Listing, Claim, User } from '../types';
import { 
  PlusCircle, 
  KeyRound, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  User as UserIcon,
  Phone,
  Copy,
  Check,
  PackageCheck,
  ShieldAlert
} from 'lucide-react';

interface VendorDashboardViewProps {
  listings: Listing[];
  vendorClaims: Claim[];
  currentUser: User | null;
  onOpenPostModal: () => void;
  onCloseListing: (id: string) => void;
  onOpenHandoverModal: (claim: Claim) => void;
}

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({
  listings,
  vendorClaims,
  currentUser,
  onOpenPostModal,
  onCloseListing,
  onOpenHandoverModal,
}) => {
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Group listings
  const claimedListings = listings.filter((l) => l.status === 'CLAIMED');
  const activeListings = listings.filter((l) => l.status === 'AVAILABLE');
  const collectedListings = listings.filter((l) => l.status === 'COLLECTED');

  const copyToClipboard = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#E8E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-[#2D5A4C]">
            Eatery Management Portal
          </span>
          <h2 className="font-serifDisplay text-2xl font-bold text-[#1B332C] mt-1">
            {currentUser?.org_name || 'My Surplus Batches'}
          </h2>
          <p className="text-xs text-[#5C564A] mt-1">
            Manage unsold food batches, coordinate with arriving NGO couriers, and share 4-digit verification codes.
          </p>
        </div>
        <button
          onClick={onOpenPostModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#DC653A] text-white hover:bg-[#C94D28] shadow-soft-sm active:scale-95 transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Surplus Batch</span>
        </button>
      </div>

      {/* PRIORITY SECTION: Claimed Batches with Prominent Verification Code */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#DC653A] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC653A] animate-ping" />
            <span>Batches Claimed — Courier En Route ({claimedListings.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-[#726B5A]">
            Share verification code upon physical collection
          </span>
        </div>

        {claimedListings.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white border border-[#E8E5DC] text-xs text-[#726B5A]">
            No batches currently awaiting courier pickup. Newly claimed batches will appear here with their 4-digit code.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimedListings.map((listing) => {
              const matchedClaim = vendorClaims.find((c) => c.listing_id === listing.id);

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border-2 border-[#DC653A] shadow-soft-md p-5 space-y-4"
                >
                  {/* Top: Title & Category */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {listing.category}
                      </span>
                      <h4 className="font-serifDisplay text-base font-bold text-[#1B332C] mt-1.5 leading-snug">
                        {listing.title}
                      </h4>
                      <p className="text-xs text-[#5C564A] mt-0.5">
                        ~{listing.portion_estimate} Meals ({listing.quantity} {listing.unit})
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-[#DC653A] px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 shrink-0">
                      Claimed & Pending
                    </span>
                  </div>

                  {/* PROMINENT HANDOVER VERIFICATION PIN BOX */}
                  <div className="p-4 rounded-2xl bg-[#1B332C] text-white flex items-center justify-between shadow-soft-sm">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#9BC6B5] font-semibold">
                        <KeyRound className="w-4 h-4 text-[#E88965]" />
                        <span>Handover Verification Code:</span>
                      </div>
                      <p className="text-[10px] text-[#C4DFD3] mt-0.5">
                        Give this 4-digit code to the arriving courier
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 rounded-xl bg-[#26483E] border border-[#38705E] font-mono text-2xl font-black tracking-[0.3em] text-[#E88965]">
                        {listing.handover_pin}
                      </div>
                      <button
                        onClick={() => copyToClipboard(listing.handover_pin || '')}
                        className="p-2 rounded-xl bg-[#26483E] hover:bg-[#38705E] text-[#C4DFD3] hover:text-white transition-colors"
                        title="Copy PIN"
                      >
                        {copiedPin === listing.handover_pin ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Courier & NGO Info */}
                  {matchedClaim && (
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DC] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#1B332C] flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-[#2D5A4C]" />
                          <span>Recipient: {matchedClaim.recipient_org_name || matchedClaim.recipient_name}</span>
                        </p>
                        <span className="text-[10px] font-mono text-[#726B5A]">
                          Claimed at {new Date(matchedClaim.claim_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {matchedClaim.volunteer_name && (
                        <p className="text-[#5C564A]">
                          Courier: <strong>{matchedClaim.volunteer_name}</strong>
                          {matchedClaim.volunteer_phone ? ` (${matchedClaim.volunteer_phone})` : ''}
                        </p>
                      )}
                      {matchedClaim.recipient_notes && (
                        <p className="text-[11px] text-[#726B5A] italic bg-white p-2 rounded-lg border border-[#F4F2EC]">
                          "{matchedClaim.recipient_notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#F4F2EC] flex items-center justify-between text-xs">
                    <span className="font-mono text-[#726B5A] text-[11px]">
                      Pickup Deadline: {new Date(listing.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {matchedClaim && (
                      <button
                        onClick={() => onOpenHandoverModal(matchedClaim)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1B332C] text-white hover:bg-[#2D5A4C] transition-all shadow-soft-sm active:scale-95"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Confirm Handover Here</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Available Listings (Unclaimed) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#1B332C]">
          Available Surplus Batches ({activeListings.length})
        </h3>

        {activeListings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#E8E5DC] text-xs text-[#726B5A]">
            No active batches right now. Click "Post New Surplus Batch" to share today's surplus!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-[#E8E5DC] shadow-soft-sm p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-[#F4F2EC] text-[#5C564A]">
                      {listing.category}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Open for Claims
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#1B332C] leading-snug">
                    {listing.title}
                  </h4>
                  <p className="text-xs text-[#5C564A] mt-1">
                    ~{listing.portion_estimate} Meals ({listing.quantity} {listing.unit})
                  </p>

                  {/* Pre-generated Handover PIN badge */}
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-medium flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      Handover PIN:
                    </span>
                    <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-[#1B332C]">
                      {listing.handover_pin}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F4F2EC] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#726B5A]">
                    Until {new Date(listing.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onCloseListing(listing.id)}
                    className="text-[11px] text-red-700 hover:text-red-900 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Close Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Handovers History */}
      {collectedListings.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#5C564A]">
            Completed Surplus Deliveries ({collectedListings.length})
          </h3>

          <div className="bg-white rounded-2xl border border-[#E8E5DC] divide-y divide-[#F4F2EC] overflow-hidden text-xs">
            {collectedListings.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1B332C]">{l.title}</p>
                  <p className="text-[#726B5A] text-[11px] mt-0.5">
                    ~{l.portion_estimate} portions • Collected & delivered safely
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Collected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
