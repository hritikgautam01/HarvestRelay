import React, { useState } from 'react';
import { Claim, User } from '../types';
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Truck,
  ExternalLink
} from 'lucide-react';

interface MyClaimsViewProps {
  claims: Claim[];
  currentUser: User | null;
  onOpenHandoverModal: (claim: Claim) => void;
  onCancelClaim: (claimId: string) => Promise<void>;
}

export const MyClaimsView: React.FC<MyClaimsViewProps> = ({
  claims,
  currentUser,
  onOpenHandoverModal,
  onCancelClaim,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const activeClaims = claims.filter((c) => c.status === 'PENDING_PICKUP');
  const pastClaims = claims.filter((c) => c.status !== 'PENDING_PICKUP');

  const handleCancel = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to release this batch back to other community groups?')) {
      return;
    }
    try {
      setCancellingId(claimId);
      await onCancelClaim(claimId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#E8E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-[#DC653A]">
            Coordination Desk
          </span>
          <h2 className="font-serifDisplay text-2xl font-bold text-[#1B332C] mt-1">
            My Claims & Pickup Runs
          </h2>
          <p className="text-xs text-[#5C564A] mt-1">
            Track active reservations, coordinate pickup transport, and confirm handovers with vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white border border-[#D7D2C3] text-center shadow-soft-sm">
            <span className="text-[10px] uppercase font-mono text-[#726B5A]">Active Pickups</span>
            <p className="text-xl font-bold text-[#1B332C] leading-none mt-1">{activeClaims.length}</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white border border-[#D7D2C3] text-center shadow-soft-sm">
            <span className="text-[10px] uppercase font-mono text-[#726B5A]">Past Redeliveries</span>
            <p className="text-xl font-bold text-[#2D5A4C] leading-none mt-1">{pastClaims.length}</p>
          </div>
        </div>
      </div>

      {/* Active Pickups Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#1B332C] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Reservations Requiring Collection</span>
        </h3>

        {activeClaims.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-[#E8E5DC] text-xs text-[#726B5A]">
            No active reservations right now. Browse the map to claim available surplus food batches!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-[#D7D2C3] shadow-soft-md p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-[#E1EFE8] text-[#26483E] border border-[#C4DFD3]">
                      {claim.category || 'SURPLUS FOOD'}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#DC653A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Must collect before {claim.pickup_deadline ? new Date(claim.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today'}
                    </span>
                  </div>

                  <h4 className="font-serifDisplay text-base font-bold text-[#1B332C]">
                    {claim.title}
                  </h4>
                  <p className="text-xs text-[#5C564A] mt-1">
                    Donor: <strong>{claim.vendor_org_name || claim.vendor_name}</strong>
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-[#FAF9F6] border border-[#F4F2EC] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#1B332C]">
                      <MapPin className="w-3.5 h-3.5 text-[#2D5A4C] shrink-0" />
                      <span className="truncate">{claim.address}</span>
                    </div>
                    {claim.vendor_phone && (
                      <div className="flex items-center gap-2 text-[#5C564A]">
                        <Phone className="w-3.5 h-3.5 text-[#8F8671] shrink-0" />
                        <span>Vendor Contact: <strong>{claim.vendor_phone}</strong></span>
                      </div>
                    )}
                    {claim.recipient_notes && (
                      <div className="text-[11px] text-[#726B5A] pt-1 border-t border-[#E8E5DC]/50">
                        {claim.recipient_notes}
                      </div>
                    )}
                    {claim.handover_pin && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                        <span className="text-amber-900 font-semibold flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          Handover Code:
                        </span>
                        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-amber-300 text-[#1B332C]">
                          {claim.handover_pin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#F4F2EC]">
                  <button
                    onClick={() => handleCancel(claim.id)}
                    disabled={cancellingId === claim.id}
                    className="text-xs text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Release Claim
                  </button>
                  <button
                    onClick={() => onOpenHandoverModal(claim)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1B332C] text-white hover:bg-[#2D5A4C] shadow-soft-sm active:scale-95 transition-all"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Enter 4-Digit Handover PIN</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Completed History */}
      {pastClaims.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#5C564A]">
            Redistribution History
          </h3>
          <div className="bg-white rounded-2xl border border-[#E8E5DC] overflow-hidden">
            <div className="divide-y divide-[#F4F2EC]">
              {pastClaims.map((claim) => (
                <div key={claim.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <h5 className="font-bold text-[#1B332C]">{claim.title}</h5>
                    <p className="text-[#726B5A] text-[11px] mt-0.5">
                      {claim.vendor_org_name || claim.vendor_name} • {claim.portion_estimate || 25} meals redistributed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      claim.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {claim.status}
                    </span>
                    <span className="block text-[10px] font-mono text-[#8F8671] mt-1">
                      {claim.pickup_time ? new Date(claim.pickup_time).toLocaleDateString() : 'Recorded'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

