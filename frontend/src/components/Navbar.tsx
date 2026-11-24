import React, { useState } from 'react';
import { User, Role } from '../types';
import { 
  MapPin, 
  PlusCircle, 
  ShoppingBag, 
  BarChart3, 
  Bell, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserCircle2, 
  Sparkles,
  Radio,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'matcher' | 'my-claims' | 'vendor-listings' | 'admin';
  setCurrentView: (view: 'matcher' | 'my-claims' | 'vendor-listings' | 'admin') => void;
  onOpenPostModal: () => void;
  onOpenAuthModal: () => void;
  onSwitchDemoRole: (identifier: string, role: Role) => void;
  onLogout: () => void;
  socketConnected: boolean;
  notifications: Array<{ id: string; title: string; message: string; timestamp: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  setCurrentView,
  onOpenPostModal,
  onOpenAuthModal,
  onSwitchDemoRole,
  onLogout,
  socketConnected,
  notifications,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const demoPersonas: { id: string; role: Role; name: string; org: string; label: string; icon: string }[] = [
    {
      id: 'usr_vendor_1',
      role: 'VENDOR',
      name: 'Devansh Tomar',
      org: 'The Sourdough Loft',
      label: 'Chef / Bakery Vendor',
      icon: '🥖',
    },
    {
      id: 'usr_recipient_1',
      role: 'RECIPIENT',
      name: 'Kamakshi Singh',
      org: 'Second Harvest Kitchen',
      label: 'Kitchen Lead / NGO',
      icon: '🍲',
    },
    {
      id: 'usr_recipient_3',
      role: 'RECIPIENT',
      name: 'Sagnik Goswami',
      org: 'Student Food Rescue',
      label: 'Volunteer Courier',
      icon: '🚲',
    },
    {
      id: 'usr_admin_1',
      role: 'ADMIN',
      name: 'Hritik',
      org: 'Food Coalition Central',
      label: 'System Admin',
      icon: '⚖️',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('matcher')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1B332C] text-[#FAF9F6] flex items-center justify-center font-serifDisplay text-xl font-bold shadow-soft-sm group-hover:bg-[#2D5A4C] transition-colors">
                🌾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serifDisplay font-semibold text-lg text-[#1B332C] tracking-tight">
                    HarvestRelay
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E1EFE8] text-[#26483E] border border-[#C4DFD3]">
                    SDG 12.3
                  </span>
                </div>
                <p className="text-[11px] text-[#726B5A] hidden sm:block">
                  Surplus Food Redistribution Matcher
                </p>
              </div>
            </button>

            {/* Live Socket indicator */}
            <div className="hidden md:flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full text-[11px] font-mono bg-white border border-[#E8E5DC]">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[#5C564A]">
                {socketConnected ? 'Live Real-time' : 'Connecting'}
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('matcher')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'matcher'
                  ? 'bg-[#1B332C] text-[#FAF9F6] shadow-soft-sm'
                  : 'text-[#5C564A] hover:bg-[#F4F2EC] hover:text-[#1B332C]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map & Live Batches</span>
            </button>

            {currentUser?.role === 'VENDOR' && (
              <button
                onClick={() => setCurrentView('vendor-listings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'vendor-listings'
                    ? 'bg-[#1B332C] text-[#FAF9F6] shadow-soft-sm'
                    : 'text-[#5C564A] hover:bg-[#F4F2EC] hover:text-[#1B332C]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Listings & Handovers</span>
              </button>
            )}

            {(currentUser?.role === 'RECIPIENT' || !currentUser) && (
              <button
                onClick={() => setCurrentView('my-claims')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'my-claims'
                    ? 'bg-[#1B332C] text-[#FAF9F6] shadow-soft-sm'
                    : 'text-[#5C564A] hover:bg-[#F4F2EC] hover:text-[#1B332C]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Claims & Pickups</span>
              </button>
            )}

            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-[#1B332C] text-[#FAF9F6] shadow-soft-sm'
                  : 'text-[#5C564A] hover:bg-[#F4F2EC] hover:text-[#1B332C]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SDG 12 Impact Hub</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Post Surplus Button for Vendors */}
            {currentUser?.role === 'VENDOR' ? (
              <button
                onClick={onOpenPostModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#DC653A] text-white hover:bg-[#C94D28] shadow-soft-sm transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Surplus Batch</span>
              </button>
            ) : null}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-[#5C564A] hover:bg-[#F4F2EC] transition-colors"
                title="Activity notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC653A] ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-elevation border border-[#E8E5DC] py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#F4F2EC] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B332C]">Live Activity Feed</span>
                    <span className="text-[10px] font-mono text-[#726B5A]">{notifications.length} alerts</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#F4F2EC]">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[#8F8671]">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-[#FAF9F6] transition-colors">
                          <p className="text-xs font-semibold text-[#1B332C]">{n.title}</p>
                          <p className="text-[11px] text-[#5C564A] mt-0.5">{n.message}</p>
                          <span className="text-[9px] font-mono text-[#8F8671] mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Demo Persona Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D7D2C3] bg-white text-xs font-medium hover:border-[#1B332C] transition-all shadow-soft-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DC653A]" />
                <span className="hidden sm:inline font-mono text-[11px] text-[#5C564A]">Demo Persona:</span>
                <span className="font-semibold text-[#1B332C]">
                  {currentUser?.name?.includes('Sagnik')
                    ? '🚲 Courier (Sagnik)'
                    : currentUser?.name?.includes('Kamakshi')
                    ? '🍲 Kitchen (Kamakshi)'
                    : currentUser?.role === 'VENDOR' || currentUser?.name?.includes('Devansh')
                    ? '🥖 Chef (Devansh)'
                    : currentUser?.role === 'ADMIN' || currentUser?.name?.includes('Hritik')
                    ? '⚖️ Admin (Hritik)'
                    : '🍲 NGO'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#726B5A]" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-elevation border border-[#E8E5DC] py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-mono text-[#726B5A] uppercase tracking-wider border-b border-[#F4F2EC]">
                    Switch Evaluator Role
                  </div>
                  {demoPersonas.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        onSwitchDemoRole(p.id, p.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-[#F4F2EC] transition-colors ${
                        currentUser?.name === p.name ? 'bg-[#F2F8F5]' : ''
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#1B332C] truncate">{p.name}</p>
                          <span className="text-[10px] font-mono text-[#DC653A] font-semibold">{p.label}</span>
                        </div>
                        <p className="text-[11px] text-[#726B5A] truncate">{p.org}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1 pl-2 border-l border-[#E8E5DC]">
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-bold text-[#1B332C] leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-[#726B5A] mt-0.5">{currentUser.org_name || currentUser.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-[#726B5A] hover:text-[#DC653A] hover:bg-[#F4F2EC] rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1B332C] text-white hover:bg-[#2D5A4C] shadow-soft-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

