import React, { useState } from 'react';
import { Listing, User } from '../types';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  X, 
  Check, 
  Truck, 
  Phone, 
  User as UserIcon,
  FileCheck2
} from 'lucide-react';

interface ClaimModalProps {
  listing: Listing | null;
  currentUser: User | null;
  onClose: () => void;
  onSubmitClaim: (listingId: string, data: {
    recipient_notes: string;
    volunteer_name: string;
    volunteer_phone: string;
    declaration_accepted: boolean;
  }) => Promise<void>;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  listing,
  currentUser,
  onClose,
  onSubmitClaim,
}) => {
  if (!listing) return null;

  const [volunteerName, setVolunteerName] = useState(currentUser?.name || '');
  const [volunteerPhone, setVolunteerPhone] = useState(currentUser?.phone || '');
  const [transportType, setTransportType] = useState('INSULATED_COOLER');
  const [notes, setNotes] = useState('');
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedDeclaration) {
      setError('Please accept the food safety & responsible pickup declaration.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitClaim(listing.id, {
        volunteer_name: volunteerName,
        volunteer_phone: volunteerPhone,
        recipient_notes: `Transport: ${transportType}. ${notes}`.trim(),
        declaration_accepted: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to claim batch. It may have already been claimed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlineFormatted = new Date(listing.pickup_deadline).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-elevation border border-[#E8E5DC] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E5DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E1EFE8] text-[#26483E] flex items-center justify-center font-bold">
              🤝
            </div>
            <div>
              <h3 className="font-serifDisplay font-bold text-base text-[#1B332C]">
                Confirm Surplus Batch Claim
              </h3>
              <p className="text-[11px] text-[#726B5A]">
                Reserve for NGO / Community Redistribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#726B5A] hover:bg-[#F4F2EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Batch Summary Card */}
          <div className="p-4 rounded-2xl bg-[#F4F2EC]/70 border border-[#E8E5DC] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-[#DC653A]">
                {listing.category}
              </span>
              <span className="text-xs font-mono font-bold text-[#1B332C] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#726B5A]" />
                Must collect before {deadlineFormatted}
              </span>
            </div>
            <h4 className="font-serifDisplay font-bold text-sm text-[#1B332C] leading-tight">
              {listing.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-[#5C564A] pt-1 border-t border-[#E8E5DC]/60">
              <span>Vendor: <strong>{listing.vendor_org_name || listing.vendor_name}</strong></span>
              <span>Quantity: <strong>~{listing.portion_estimate} Meals ({listing.quantity} {listing.unit})</strong></span>
            </div>
            <div className="text-[11px] text-[#726B5A] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#2D5A4C] shrink-0" />
              <span className="truncate">{listing.address}</span>
            </div>
          </div>

          {/* Volunteer & Runner Details */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[#726B5A] font-bold">
              Pickup Coordinator / Runner Details
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1B332C] mb-1">Volunteer / Runner Name</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8F8671]" />
                  <input
                    type="text"
                    required
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    placeholder="e.g. Sagnik Goswami"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1B332C] mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8F8671]" />
                  <input
                    type="tel"
                    required
                    value={volunteerPhone}
                    onChange={(e) => setVolunteerPhone(e.target.value)}
                    placeholder="+91 98860 33003"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1B332C] mb-1">Transport & Storage Method</label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] bg-white focus:outline-none focus:border-[#1B332C]"
              >
                <option value="INSULATED_COOLER">Insulated Thermal Cooler / Cold Bag (Maintains Cold Chain)</option>
                <option value="THERMAL_CAMBRO">Hot-Hold Cambro / Thermal Box (Maintains 60°C+)</option>
                <option value="CARGO_BIKE">Clean Cargo Bike / Dispatch Box</option>
                <option value="DEDICATED_VAN">Dedicated Food Redistribution Vehicle / Van</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1B332C] mb-1">Notes / ETA for Vendor</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Arriving in 20 minutes; vehicle reg KA-01-AB-1234"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>
          </div>

          {/* Food Safety & Responsibility Declaration (Section 2 & 7 requirement) */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DC] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B332C]">
              <ShieldCheck className="w-4 h-4 text-[#2D5A4C]" />
              <span>Food Safety & Community Care Declaration</span>
            </div>
            <p className="text-[11px] text-[#5C564A] leading-relaxed">
              Per platform protocols: Vendors supply accurate safe-consumption information; as recipient, our organisation assumes responsibility for timely hygienic collection, temperature control during transport, and inspecting food safety prior to community distribution.
            </p>
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedDeclaration}
                onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                className="mt-0.5 rounded border-[#BFB8A4] text-[#1B332C] focus:ring-[#1B332C]"
              />
              <span className="text-xs font-medium text-[#1B332C]">
                I acknowledge the safe consumption window and confirm our team will collect before {deadlineFormatted}.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F4F2EC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5C564A] hover:bg-[#F4F2EC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !acceptedDeclaration}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#1B332C] text-[#FAF9F6] hover:bg-[#2D5A4C] disabled:opacity-50 transition-all shadow-soft-sm active:scale-95"
            >
              {isSubmitting ? (
                <span>Locking Reservation...</span>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Confirm Claim & Lock Batch</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

