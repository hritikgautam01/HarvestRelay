import React, { useState } from 'react';
import { Claim } from '../types';
import { KeyRound, CheckCircle2, AlertTriangle, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HandoverModalProps {
  claim: Claim | null;
  onClose: () => void;
  onConfirm: (claimId: string, pin: string) => Promise<any>;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  claim,
  onClose,
  onConfirm,
}) => {
  if (!claim) return null;

  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter the 4-digit handover code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await onConfirm(claim.id, pin.trim());
      setSuccessResult(res);

      // Trigger celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D5A4C', '#DC653A', '#EAB308'],
      });
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN. Please re-check with the food donor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevation border border-[#E8E5DC] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E5DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E1EFE8] text-[#26483E] flex items-center justify-center font-bold">
              🔑
            </div>
            <div>
              <h3 className="font-serifDisplay font-bold text-base text-[#1B332C]">
                Handover Verification
              </h3>
              <p className="text-[11px] text-[#726B5A]">
                Secure 4-Digit Pickup Confirmation
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

        {/* Content */}
        <div className="p-6">
          {successResult ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-serifDisplay font-bold text-lg text-[#1B332C]">
                Handover Successfully Verified!
              </h4>
              <p className="text-xs text-[#5C564A]">
                Food batch safely transferred to community kitchen. Impact metrics have been added to the SDG 12 dashboard.
              </p>
              <div className="p-3 rounded-2xl bg-[#F2F8F5] border border-[#C4DFD3] text-xs font-mono text-[#26483E]">
                ✓ +{claim.portion_estimate || 25} Meals Redistributed • ~{Math.round((claim.portion_estimate || 25) * 0.45)} kg Food Saved
              </div>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-[#1B332C] text-white hover:bg-[#2D5A4C] transition-all shadow-soft-sm"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DC] text-xs space-y-2">
                <p className="font-bold text-[#1B332C]">{claim.title}</p>
                <div className="flex items-center justify-between text-[#5C564A]">
                  <span>Recipient: <strong>{claim.recipient_org_name || claim.recipient_name}</strong></span>
                  <span>Donor: <strong>{claim.vendor_org_name || claim.vendor_name || 'Eatery'}</strong></span>
                </div>

                {/* PROMINENT VERIFICATION CODE HELPER BADGE */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>Vendor Verification Code:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold bg-white px-3 py-0.5 rounded-lg border border-amber-300 text-[#1B332C] tracking-widest">
                      {claim.handover_pin || 'Available on Vendor portal'}
                    </span>
                    {claim.handover_pin && (
                      <button
                        type="button"
                        onClick={() => setPin(claim.handover_pin || '')}
                        className="px-2 py-1 rounded-lg bg-[#1B332C] text-white text-[10px] font-bold hover:bg-[#2D5A4C] active:scale-95 transition-all shadow-soft-sm"
                      >
                        Autofill
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#726B5A] mb-2 text-center font-bold">
                  Enter 4-Digit Handover PIN
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-36 text-center font-mono text-2xl tracking-[0.5em] py-2 px-3 rounded-2xl border-2 border-[#D7D2C3] focus:border-[#1B332C] focus:outline-none"
                  />
                </div>
              </div>

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
                  disabled={isSubmitting || pin.length < 4}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#1B332C] text-white hover:bg-[#2D5A4C] disabled:opacity-50 transition-all shadow-soft-sm active:scale-95"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Handover'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

