import React, { useState } from 'react';
import { User, FoodCategory, SafeTemperature } from '../types';
import { 
  PlusCircle, 
  X, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  UtensilsCrossed, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface PostListingModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const PostListingModal: React.FC<PostListingModalProps> = ({
  currentUser,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('BAKERY');
  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState('portions');
  const [portionEstimate, setPortionEstimate] = useState<number>(20);
  const [safeTemperature, setSafeTemperature] = useState<SafeTemperature>('ROOM');
  const [packagingType, setPackagingType] = useState('BAKERY_BOXES');
  const [allergenInfo, setAllergenInfo] = useState('');
  const [dietaryFlags, setDietaryFlags] = useState<string[]>(['Vegetarian']);
  const [address, setAddress] = useState(currentUser?.address || '42 Artisanal Way, Indiranagar');
  const [latitude, setLatitude] = useState(currentUser?.latitude || 12.9796);
  const [longitude, setLongitude] = useState(currentUser?.longitude || 77.6066);
  const [hoursAhead, setHoursAhead] = useState(3.0);
  const [notes, setNotes] = useState('');
  const [acknowledgedSafety, setAcknowledgedSafety] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDietary = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'];

  const toggleDietary = (flag: string) => {
    if (dietaryFlags.includes(flag)) {
      setDietaryFlags(dietaryFlags.filter((f) => f !== flag));
    } else {
      setDietaryFlags([...dietaryFlags, flag]);
    }
  };

  const handlePresetHours = (hours: number) => {
    setHoursAhead(hours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgedSafety) {
      setError('Please acknowledge food preparation and safe-consumption accuracy.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const now = new Date();
      const deadline = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();

      await onSubmit({
        title,
        description,
        category,
        quantity: Number(quantity),
        unit,
        portion_estimate: Number(portionEstimate),
        dietary_flags: dietaryFlags,
        safe_temperature: safeTemperature,
        packaging_type: packagingType,
        allergen_info: allergenInfo || 'None specified',
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        pickup_start: now.toISOString(),
        pickup_deadline: deadline,
        notes,
        food_safety_acknowledged: true,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post surplus batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-elevation border border-[#E8E5DC] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E5DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FBE9E0] text-[#C94D28] flex items-center justify-center font-bold">
              📦
            </div>
            <div>
              <h3 className="font-serifDisplay font-bold text-base text-[#1B332C]">
                Publish Surplus Food Batch
              </h3>
              <p className="text-[11px] text-[#726B5A]">
                Post edible surplus for registered NGOs and community kitchens
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">
                Surplus Batch Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sourdough Boules, Baguettes & Herb Focaccia"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">
                Detailed Description & Condition
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Freshly baked at 6 AM, surplus from lunch service. Fully cooled and placed in clean bakery crates."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>
          </div>

          {/* Category & Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Food Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D7D2C3] bg-white focus:outline-none focus:border-[#1B332C]"
              >
                <option value="BAKERY">Bakery & Bread</option>
                <option value="COOKED_MEALS">Cooked Meals</option>
                <option value="PRODUCE">Fresh Produce / Fruit</option>
                <option value="DAIRY">Dairy & Chilled</option>
                <option value="PACKAGED">Packaged / Pantry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value));
                    setPortionEstimate(Number(e.target.value));
                  }}
                  className="w-20 px-3 py-2 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs rounded-xl border border-[#D7D2C3] bg-white focus:outline-none focus:border-[#1B332C]"
                >
                  <option value="portions">Portions</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="boxes">Boxes</option>
                  <option value="trays">Trays</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Portion Estimate (Meals)</label>
              <input
                type="number"
                min="1"
                required
                value={portionEstimate}
                onChange={(e) => setPortionEstimate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>
          </div>

          {/* Safety & Preservation Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DC]">
            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Safe Temperature State</label>
              <select
                value={safeTemperature}
                onChange={(e) => setSafeTemperature(e.target.value as SafeTemperature)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] bg-white focus:outline-none focus:border-[#1B332C]"
              >
                <option value="ROOM">Room Temperature (Bakery / Produce)</option>
                <option value="REFRIGERATED">Chilled / Cold-Chain (&lt; 4°C)</option>
                <option value="HEATED">Heated Hold (&gt; 65°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Packaging Form</label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] bg-white focus:outline-none focus:border-[#1B332C]"
              >
                <option value="BAKERY_BOXES">Bakery Kraft Boxes / Paper Bags</option>
                <option value="SEALED_CONTAINERS">Compostable Sealed Containers</option>
                <option value="FOIL_TRAYS">Heavy Catering Foil Trays</option>
                <option value="WOODEN_CRATES">Ventilated Produce Crates</option>
              </select>
            </div>
          </div>

          {/* Dietary & Allergen checklist */}
          <div>
            <label className="block text-xs font-semibold text-[#1B332C] mb-1.5">Dietary Suitability</label>
            <div className="flex flex-wrap gap-1.5">
              {availableDietary.map((flag) => {
                const isSelected = dietaryFlags.includes(flag);
                return (
                  <button
                    key={flag}
                    type="button"
                    onClick={() => toggleDietary(flag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1B332C] text-white shadow-soft-sm'
                        : 'bg-[#F4F2EC] text-[#5C564A] hover:bg-[#E8E5DC]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {flag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B332C] mb-1">
              Allergen Information (if applicable)
            </label>
            <input
              type="text"
              value={allergenInfo}
              onChange={(e) => setAllergenInfo(e.target.value)}
              placeholder="e.g. Contains wheat gluten and dairy. Prepared in a facility handling walnuts."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
            />
          </div>

          {/* Pickup Deadline Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1B332C]">
              Latest Collection Deadline (Safe Window)
            </label>
            <div className="flex items-center gap-2">
              {[1.5, 3.0, 5.0, 8.0].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handlePresetHours(h)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    hoursAhead === h
                      ? 'bg-[#DC653A] text-white shadow-soft-sm'
                      : 'bg-[#F4F2EC] text-[#5C564A] hover:bg-[#E8E5DC]'
                  }`}
                >
                  +{h} Hours
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#726B5A]">
              Deadline will be set to{' '}
              <strong className="text-[#1B332C]">
                {new Date(Date.now() + hoursAhead * 3600 * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>{' '}
              today. Listings past this time will automatically expire.
            </p>
          </div>

          {/* Address & Pickup Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Pickup Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1B332C] mb-1">Collection Instructions</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ring side bakery door; staff will assist loading."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
              />
            </div>
          </div>

          {/* Food Safety Vendor Acknowledgment per Synopsis Section 2 */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DC]">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedSafety}
                onChange={(e) => setAcknowledgedSafety(e.target.checked)}
                className="mt-0.5 rounded border-[#BFB8A4] text-[#1B332C] focus:ring-[#1B332C]"
              />
              <span className="text-xs text-[#1B332C]">
                <strong>Vendor Food-Safety Responsibility:</strong> I verify that this surplus batch was prepared hygienically, stored at appropriate temperatures, and accurately described with its safe-consumption window.
              </span>
            </label>
          </div>

          {/* Footer */}
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
              disabled={isSubmitting || !acknowledgedSafety}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#DC653A] text-white hover:bg-[#C94D28] disabled:opacity-50 transition-all shadow-soft-sm active:scale-95"
            >
              {isSubmitting ? (
                <span>Broadcasting Batch...</span>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publish Surplus Batch</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

