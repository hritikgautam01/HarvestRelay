import React, { useState } from 'react';
import { Role } from '../types';
import { LogIn, UserPlus, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password?: string) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLogin,
  onRegister,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('VENDOR');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('RESTAURANT');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister({
          email,
          password,
          name,
          role,
          org_name: orgName || name,
          org_type: orgType,
          phone,
          address,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevation border border-[#E8E5DC] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E8E5DC] flex items-center justify-between">
          <div>
            <h3 className="font-serifDisplay font-bold text-base text-[#1B332C]">
              {tab === 'login' ? 'Sign In to HarvestRelay' : 'Register New Organisation'}
            </h3>
            <p className="text-[11px] text-[#726B5A]">
              Connect Food Donors, NGOs & Volunteer Couriers
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#726B5A] hover:bg-[#F4F2EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E8E5DC] text-xs font-semibold">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 text-center transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-[#1B332C] text-[#1B332C] bg-[#FAF9F6]'
                : 'text-[#726B5A] hover:text-[#1B332C]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 text-center transition-colors ${
              tab === 'register'
                ? 'border-b-2 border-[#1B332C] text-[#1B332C] bg-[#FAF9F6]'
                : 'text-[#726B5A] hover:text-[#1B332C]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#1B332C] mb-1">Select Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('VENDOR');
                      setOrgType('RESTAURANT');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      role === 'VENDOR'
                        ? 'border-[#1B332C] bg-[#F2F8F5] text-[#1B332C]'
                        : 'border-[#E8E5DC] text-[#726B5A]'
                    }`}
                  >
                    🥖 Food Eatery / Donor
                    <span className="block text-[10px] font-normal text-[#726B5A] mt-0.5">Bakery, Cafe, Kitchen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('RECIPIENT');
                      setOrgType('COMMUNITY_KITCHEN');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      role === 'RECIPIENT'
                        ? 'border-[#1B332C] bg-[#F2F8F5] text-[#1B332C]'
                        : 'border-[#E8E5DC] text-[#726B5A]'
                    }`}
                  >
                    🍲 NGO / Volunteer
                    <span className="block text-[10px] font-normal text-[#726B5A] mt-0.5">Kitchen, Shelter, Courier</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B332C] mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kamakshi Singh"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B332C] mb-1">Organization / Brand Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Second Harvest Community Kitchen"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1B332C] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98860 33001"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B332C] mb-1">Address / Locality</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Indiranagar, Metro Line"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1B332C] mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. director@secondharvest.org"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B332C] mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1B332C] text-white hover:bg-[#2D5A4C] transition-all shadow-soft-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing...'
                : tab === 'login'
                ? 'Sign In to Dashboard'
                : 'Create Partner Account'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

