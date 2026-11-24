import React, { useState, useEffect } from 'react';
import { Listing, User } from '../types';
import { 
  Clock, 
  MapPin, 
  UtensilsCrossed, 
  Thermometer, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Package,
  KeyRound
} from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  currentUser: User | null;
  onClaim: (listing: Listing) => void;
  onSelect: (listing: Listing) => void;
  onHover: (id: string | null) => void;
  isHovered: boolean;
  onCloseListing?: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  currentUser,
  onClaim,
  onSelect,
  onHover,
  isHovered,
  onCloseListing,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isUrgent: boolean; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isUrgent: false,
    isExpired: false,
  });

  // Ticking countdown clock
  useEffect(() => {
    const calculateTime = () => {
      const diffMs = new Date(listing.pickup_deadline).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isUrgent: false, isExpired: true });
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const isUrgent = diffMs < 90 * 60 * 1000; // Less than 90m

      setTimeLeft({ hours, minutes, seconds, isUrgent, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [listing.pickup_deadline]);

  const isOwner = currentUser?.id === listing.vendor_id;
  const canClaim = (currentUser?.role === 'RECIPIENT' || !currentUser) && listing.status === 'AVAILABLE' && !timeLeft.isExpired;

  // Temperature display
  const tempConfig: { [key: string]: { label: string; icon: string; style: string } } = {
    ROOM: { label: 'Room Temp', icon: '🍞', style: 'bg-[#F4F2EC] text-[#5C564A]' },
    REFRIGERATED: { label: 'Chilled 4°C', icon: '❄️', style: 'bg-sky-50 text-sky-800 border-sky-200' },
    HEATED: { label: 'Hot Hold 65°C', icon: '🔥', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  };
  const tempInfo = tempConfig[listing.safe_temperature] || tempConfig.ROOM;

  return (
    <div
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative group bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isHovered
          ? 'border-[#1B332C] shadow-soft-lg translate-y-[-2px]'
          : 'border-[#E8E5DC] shadow-soft-sm hover:border-[#BFB8A4]'
      }`}
    >
      {/* Top Status Bar */}
      <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E8E5DC] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-bold text-[10px] tracking-wider px-2 py-0.5 rounded bg-white border border-[#D7D2C3] text-[#1B332C]">
            {listing.category.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tempInfo.style}`}>
            <span>{tempInfo.icon}</span>
            <span>{tempInfo.label}</span>
          </span>
        </div>

        {/* Live Countdown Clock */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className={`w-3.5 h-3.5 ${timeLeft.isUrgent ? 'text-[#DC653A] animate-pulse' : 'text-[#726B5A]'}`} />
          {timeLeft.isExpired ? (
            <span className="text-red-700 font-bold">Expired</span>
          ) : (
            <span className={`font-semibold tabular-nums ${timeLeft.isUrgent ? 'text-[#DC653A] font-bold' : 'text-[#26483E]'}`}>
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} left
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        
        {/* Title & Organization */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serifDisplay text-base sm:text-lg font-bold text-[#1B332C] group-hover:text-[#2D5A4C] transition-colors leading-snug">
              {listing.title}
            </h3>
            <p className="text-xs text-[#5C564A] mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-[#1B332C]">{listing.vendor_org_name || listing.vendor_name}</span>
              <span>•</span>
              <span className="text-[#8F8671]">{listing.vendor_org_type || 'Eatery'}</span>
            </p>
          </div>

          {/* Distance Badge & Transit Estimate */}
          {listing.distance_km !== undefined && (
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#1B332C] bg-[#E1EFE8] text-[#26483E] px-2.5 py-1 rounded-lg border border-[#C4DFD3]">
                <MapPin className="w-3 h-3 text-[#2D5A4C]" />
                {listing.distance_km} km
              </span>
              <span className="block font-mono text-[9px] text-[#726B5A] mt-0.5">
                🚲 ~{Math.max(3, Math.round(listing.distance_km * 3.5))}m courier
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[#5C564A] mt-2.5 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-xl bg-[#FAF9F6] border border-[#F4F2EC] text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#726B5A]">Available Quantity</span>
            <p className="font-bold text-[#1B332C] mt-0.5">
              ~{listing.portion_estimate} Meals <span className="font-normal text-[#726B5A]">({listing.quantity} {listing.unit})</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#726B5A]">Packaging Form</span>
            <p className="font-bold text-[#1B332C] mt-0.5 truncate">
              {listing.packaging_type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Dietary & Allergen Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {listing.dietary_flags && listing.dietary_flags.map((flag) => (
            <span key={flag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F4F2EC] text-[#5C564A] border border-[#E8E5DC]">
              ✓ {flag}
            </span>
          ))}
          {listing.allergen_info && (
            <span className="text-[10px] text-[#726B5A] italic ml-1">
              Allergens: {listing.allergen_info}
            </span>
          )}
        </div>

        {/* Pickup Location & Notes */}
        <div className="mt-3 pt-3 border-t border-[#F4F2EC] flex items-center justify-between text-[11px] text-[#726B5A]">
          <div className="flex items-center gap-1.5 truncate max-w-[280px]">
            <MapPin className="w-3 h-3 shrink-0 text-[#8F8671]" />
            <span className="truncate">{listing.address}</span>
          </div>
          <span className="text-[10px] font-mono text-[#8F8671]">
            Window ends {new Date(listing.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Status / Actions Row */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {listing.status === 'AVAILABLE' && (
            canClaim ? (
              <button
                onClick={() => onClaim(listing)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-[#1B332C] text-[#FAF9F6] hover:bg-[#2D5A4C] active:scale-[0.98] transition-all shadow-soft-sm"
              >
                <span>Claim Batch for Pickup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : isOwner ? (
              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Handover PIN: <strong>{listing.handover_pin}</strong></span>
                </div>
                {onCloseListing && (
                  <button
                    onClick={() => onCloseListing(listing.id)}
                    className="text-[11px] font-medium text-red-700 hover:text-red-900 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Close Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full text-center py-2 px-3 rounded-xl bg-[#F4F2EC] text-[#726B5A] text-xs font-semibold">
                Available • Sign in as NGO to claim
              </div>
            )
          )}

          {listing.status === 'CLAIMED' && (
            <div className="w-full flex items-center justify-between p-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-sky-700" />
                Claimed & Awaiting Pickup
              </span>
              {isOwner && (
                <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-sky-300">
                  PIN: {listing.handover_pin}
                </span>
              )}
            </div>
          )}

          {listing.status === 'COLLECTED' && (
            <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Successfully Collected & Redistributed</span>
            </div>
          )}

          {listing.status === 'EXPIRED' && (
            <div className="w-full text-center py-2 px-3 rounded-xl bg-[#F4F2EC] text-[#726B5A] text-xs font-semibold">
              Safe window expired
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

