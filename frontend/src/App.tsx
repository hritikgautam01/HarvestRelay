import React, { useState, useEffect, useCallback } from 'react';
import { Listing, Claim, User, Role, FoodCategory, SDGMetrics, AuditLog, NotificationItem } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';
import { Navbar } from './components/Navbar';
import { MapMatcher } from './components/MapMatcher';
import { ListingCard } from './components/ListingCard';
import { ClaimModal } from './components/ClaimModal';
import { PostListingModal } from './components/PostListingModal';
import { HandoverModal } from './components/HandoverModal';
import { MyClaimsView } from './components/MyClaimsView';
import { VendorDashboardView } from './components/VendorDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Layers,
  Leaf,
  Clock,
  Compass
} from 'lucide-react';

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'matcher' | 'my-claims' | 'vendor-listings' | 'admin'>('matcher');
  
  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [vendorClaims, setVendorClaims] = useState<Claim[]>([]);
  const [vendorListings, setVendorListings] = useState<Listing[]>([]);
  const [sdgMetrics, setSdgMetrics] = useState<SDGMetrics | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Geospatial & Filter State
  const [userLat, setUserLat] = useState(12.9716);
  const [userLng, setUserLng] = useState(77.5946);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Map Sync
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  // Modals & Toasts
  const [claimModalListing, setClaimModalListing] = useState<Listing | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [handoverModalClaim, setHandoverModalClaim] = useState<Claim | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [liveToast, setLiveToast] = useState<{ id: string; title: string; message: string } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // 1. Initial Load & Demo User Initialization
  useEffect(() => {
    const initApp = async () => {
      try {
        // Try getting logged in user or log in with default demo persona (Sister Clara - NGO)
        const demoAuth = await api.demoLogin('RECIPIENT');
        setCurrentUser(demoAuth.user);
        if (demoAuth.user.latitude && demoAuth.user.longitude) {
          setUserLat(demoAuth.user.latitude);
          setUserLng(demoAuth.user.longitude);
        }
      } catch (err) {
        console.warn('Initial demo login fallback');
      }
    };
    initApp();
  }, []);

  // 2. Fetch Listings
  const fetchListings = useCallback(async () => {
    try {
      const data = await api.getListings({
        lat: userLat,
        lng: userLng,
        radiusKm: radiusKm > 0 ? radiusKm : undefined,
        category: selectedCategory,
        dietary: selectedDietary,
        search: searchQuery || undefined,
      });
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    }
  }, [userLat, userLng, radiusKm, selectedCategory, selectedDietary, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // 3. Fetch Claims & Admin Data based on active view
  const fetchUserClaims = useCallback(async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'RECIPIENT' || currentUser.role === 'ADMIN') {
        const myClaims = await api.getMyClaims();
        setClaims(myClaims);
      }
      if (currentUser.role === 'VENDOR' || currentUser.role === 'ADMIN') {
        const [vClaims, vListings] = await Promise.all([
          api.getVendorClaims(),
          api.getListings({ vendorId: currentUser.role === 'ADMIN' ? undefined : currentUser.id }),
        ]);
        setVendorClaims(vClaims);
        setVendorListings(vListings);
      }
    } catch (err) {
      console.error('Failed to load claims', err);
    }
  }, [currentUser]);

  const fetchAdminData = useCallback(async () => {
    try {
      const [m, u, l] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminLogs(),
      ]);
      setSdgMetrics(m);
      setAdminUsers(u);
      setAdminLogs(l);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'my-claims' || currentView === 'vendor-listings') {
      fetchUserClaims();
    }
    if (currentView === 'admin') {
      fetchAdminData();
    }
  }, [currentView, fetchUserClaims, fetchAdminData]);

  // 4. Socket.IO Real-Time Event Handlers
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('listing:created', (newListing: Listing) => {
      setListings((prev) => [newListing, ...prev]);
      const notif: NotificationItem = {
        id: String(Date.now()),
        title: 'New Surplus Batch Published!',
        message: `${newListing.vendor_org_name || newListing.vendor_name} posted ${newListing.title}.`,
        type: 'LISTING_NEW',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications((prev) => [notif, ...prev]);
      setLiveToast({ id: notif.id, title: notif.title, message: notif.message });
    });

    socket.on('listing:claimed', (payload: { listingId: string; listing: Listing; claim: Claim }) => {
      setListings((prev) =>
        prev.map((l) => (l.id === payload.listingId ? { ...l, status: 'CLAIMED' } : l))
      );
      const notif: NotificationItem = {
        id: String(Date.now()),
        title: 'Batch Reserved for Pickup',
        message: `A community organization just claimed "${payload.listing.title}".`,
        type: 'CLAIMED',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications((prev) => [notif, ...prev]);
      setLiveToast({ id: notif.id, title: notif.title, message: notif.message });
      fetchUserClaims();
    });

    socket.on('listing:collected', (payload: { listingId: string; listing: Listing }) => {
      setListings((prev) =>
        prev.map((l) => (l.id === payload.listingId ? { ...l, status: 'COLLECTED' } : l))
      );
      const notif: NotificationItem = {
        id: String(Date.now()),
        title: 'Batch Safely Delivered! 🌱',
        message: `Handover confirmed for "${payload.listing.title}". Food rescued!`,
        type: 'COLLECTED',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications((prev) => [notif, ...prev]);
      setLiveToast({ id: notif.id, title: notif.title, message: notif.message });
      fetchUserClaims();
      fetchAdminData();
    });

    socket.on('listing:expired', (payload: { listingId: string }) => {
      setListings((prev) =>
        prev.map((l) => (l.id === payload.listingId ? { ...l, status: 'EXPIRED' } : l))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('listing:created');
      socket.off('listing:claimed');
      socket.off('listing:collected');
      socket.off('listing:expired');
    };
  }, [fetchUserClaims, fetchAdminData]);

  // Demo Role / Persona Switcher
  const handleSwitchDemoRole = async (identifier: string, role?: Role) => {
    try {
      const res = await api.demoLogin(identifier);
      setCurrentUser(res.user);
      if (res.user.latitude && res.user.longitude) {
        setUserLat(res.user.latitude);
        setUserLng(res.user.longitude);
      }
      if (res.user.role === 'VENDOR') {
        setCurrentView('vendor-listings');
      } else if (res.user.role === 'ADMIN') {
        setCurrentView('admin');
      } else {
        setCurrentView('matcher');
      }
      fetchListings();
      fetchUserClaims();
    } catch (err) {
      console.error(err);
    }
  };

  // Claim Handler
  const handleClaimSubmit = async (listingId: string, data: any) => {
    const res = await api.claimListing(listingId, data);
    fetchListings();
    fetchUserClaims();
    setCurrentView('my-claims');
  };

  // Post Listing Handler
  const handlePostSubmit = async (data: any) => {
    await api.createListing(data);
    fetchListings();
    setCurrentView('vendor-listings');
  };

  // Handover Confirmation
  const handleConfirmHandover = async (claimId: string, pin: string) => {
    const res = await api.confirmHandover(claimId, pin);
    fetchListings();
    fetchUserClaims();
    fetchAdminData();
    return res;
  };

  // Cancel Claim
  const handleCancelClaim = async (claimId: string) => {
    await api.cancelClaim(claimId);
    fetchListings();
    fetchUserClaims();
  };

  // Close Listing
  const handleCloseListing = async (listingId: string) => {
    if (!window.confirm('Close this surplus batch? It will no longer be visible to NGOs.')) return;
    await api.closeListing(listingId);
    fetchListings();
  };

  // Category Options
  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'ALL', label: 'All Surplus', icon: '✨' },
    { id: 'COOKED_MEALS', label: 'Cooked Meals', icon: '🍲' },
    { id: 'BAKERY', label: 'Bakery', icon: '🥖' },
    { id: 'PRODUCE', label: 'Produce', icon: '🥦' },
    { id: 'DAIRY', label: 'Dairy & Chilled', icon: '🥛' },
    { id: 'PACKAGED', label: 'Pantry', icon: '🥫' },
  ];

  const radii = [
    { value: 1, label: '1 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 0, label: 'All Locality' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1B332C] flex flex-col font-sans">
      
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenPostModal={() => setShowPostModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSwitchDemoRole={handleSwitchDemoRole}
        onLogout={() => {
          localStorage.removeItem('harvest_token');
          setCurrentUser(null);
        }}
        socketConnected={socketConnected}
        notifications={notifications}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Interactive Matcher & Map View */}
        {currentView === 'matcher' && (
          <div className="space-y-6">
            
            {/* Editorial Hero Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#1B332C] text-[#FAF9F6] relative overflow-hidden shadow-soft-lg">
              <div className="absolute right-0 top-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(220,101,58,0.25),transparent_70%)] pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#26483E] text-[#9BC6B5] border border-[#38705E]">
                    Real-Time Civic Matching
                  </span>
                  <span className="text-xs font-mono text-[#D7D2C3]">
                    {listings.filter((l) => l.status === 'AVAILABLE').length} batches ready for pickup
                  </span>
                </div>
                <h1 className="font-serifDisplay text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Connect surplus food with local tables before time runs out.
                </h1>
                <p className="text-xs sm:text-sm text-[#C4DFD3] mt-2 leading-relaxed">
                  Bakeries, cafeterias, and kitchens publish freshly prepared surplus batches. Community pantries and authorized couriers claim and collect within certified safe-consumption windows.
                </p>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E5DC] shadow-soft-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#8F8671]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by food item, bakery, or street..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#D7D2C3] focus:outline-none focus:border-[#1B332C]"
                  />
                </div>

                {/* Radius Distance Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[11px] font-mono text-[#726B5A] whitespace-nowrap pl-1 pr-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    Radius:
                  </span>
                  {radii.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRadiusKm(r.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all ${
                        radiusKm === r.value
                          ? 'bg-[#1B332C] text-white shadow-soft-sm'
                          : 'bg-[#F4F2EC] text-[#5C564A] hover:bg-[#E8E5DC]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Location Hub Presets for Live Testing the Distance Engine */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#F4F2EC] text-xs">
                <span className="text-[11px] font-mono text-[#726B5A] whitespace-nowrap flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2D5A4C]" />
                  Hub Center:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {[
                    { name: 'City Center (MG Rd)', lat: 12.9716, lng: 77.5946 },
                    { name: 'Indiranagar Hub', lat: 12.9784, lng: 77.6408 },
                    { name: 'Koramangala Station', lat: 12.9352, lng: 77.6146 },
                    { name: 'University Campus', lat: 12.9650, lng: 77.5800 },
                  ].map((loc) => {
                    const isCurrent = Math.abs(userLat - loc.lat) < 0.005 && Math.abs(userLng - loc.lng) < 0.005;
                    return (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setUserLat(loc.lat);
                          setUserLng(loc.lng);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          isCurrent
                            ? 'bg-[#E1EFE8] text-[#26483E] font-bold border border-[#C4DFD3]'
                            : 'bg-[#FAF9F6] text-[#5C564A] hover:bg-[#F4F2EC] border border-[#E8E5DC]'
                        }`}
                      >
                        📍 {loc.name}
                      </button>
                    );
                  })}
                  <span className="text-[10px] font-mono text-[#8F8671] hidden xl:inline">
                    (or click / drag pin on map)
                  </span>
                </div>
              </div>

              {/* Category Pills & Dietary Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F4F2EC]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === c.id
                          ? 'bg-[#E1EFE8] text-[#26483E] border border-[#C4DFD3]'
                          : 'text-[#5C564A] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <span className="mr-1.5">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Dietary Filter & Reset Timers Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#726B5A]">Diet:</span>
                    <select
                      value={selectedDietary}
                      onChange={(e) => setSelectedDietary(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-[#D7D2C3] bg-white text-[#1B332C] focus:outline-none focus:border-[#1B332C]"
                    >
                      <option value="ALL">All Diets</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Halal">Halal</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      await api.resetTimers();
                      fetchListings();
                      setLiveToast({
                        id: String(Date.now()),
                        title: 'Timers Refreshed! ⏱',
                        message: 'All 14 food batch deadlines have been reset fresh relative to now.',
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-[#FAF9F6] hover:bg-[#F4F2EC] border border-[#D7D2C3] text-[#1B332C] shadow-soft-sm transition-all active:scale-95"
                    title="Reset all food batch countdown clocks fresh for demonstration"
                  >
                    <span>🔄</span>
                    <span className="hidden sm:inline">Reset Timers</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Split Screen Layout: List on Left (55%), Interactive Leaflet Map on Right (45%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Listings Feed */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#726B5A] px-1">
                  <span>Showing {listings.length} live listings sorted by urgency & distance</span>
                  <span>Center: {radiusKm > 0 ? `${radiusKm}km boundary` : 'City-wide'}</span>
                </div>

                {listings.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-white border border-[#E8E5DC] space-y-3">
                    <div className="text-3xl">🌾</div>
                    <h3 className="font-serifDisplay font-bold text-base text-[#1B332C]">
                      No active listings found in this radius
                    </h3>
                    <p className="text-xs text-[#726B5A] max-w-sm mx-auto">
                      Try expanding your radius filter to 10km or selecting 'All Surplus' to view batches across the metropolitan area.
                    </p>
                    <button
                      onClick={() => {
                        setRadiusKm(0);
                        setSelectedCategory('ALL');
                        setSelectedDietary('ALL');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1B332C] text-white hover:bg-[#2D5A4C] transition-all"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        currentUser={currentUser}
                        onClaim={(l) => setClaimModalListing(l)}
                        onSelect={(l) => setSelectedListing(l)}
                        onHover={(id) => setHoveredListingId(id)}
                        isHovered={hoveredListingId === listing.id}
                        onCloseListing={handleCloseListing}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Sticky Leaflet Map */}
              <div className="lg:col-span-5 sticky top-20 h-[620px]">
                <MapMatcher
                  listings={listings}
                  userLat={userLat}
                  userLng={userLng}
                  radiusKm={radiusKm}
                  selectedListing={selectedListing}
                  hoveredListingId={hoveredListingId}
                  onSelectListing={(l) => {
                    setSelectedListing(l);
                    setHoveredListingId(l.id);
                  }}
                  onClaimListing={(l) => setClaimModalListing(l)}
                  onLocationChange={(lat, lng) => {
                    setUserLat(lat);
                    setUserLng(lng);
                  }}
                  canClaim={currentUser?.role === 'RECIPIENT' || !currentUser}
                />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: My Claims View (for NGOs / Couriers) */}
        {currentView === 'my-claims' && (
          <MyClaimsView
            claims={claims}
            currentUser={currentUser}
            onOpenHandoverModal={(claim) => setHandoverModalClaim(claim)}
            onCancelClaim={handleCancelClaim}
          />
        )}

        {/* VIEW 3: Vendor Listings & Handover View */}
        {currentView === 'vendor-listings' && (
          <VendorDashboardView
            listings={vendorListings.length > 0 ? vendorListings : listings.filter((l) => l.vendor_id === currentUser?.id || currentUser?.role === 'ADMIN')}
            vendorClaims={vendorClaims}
            currentUser={currentUser}
            onOpenPostModal={() => setShowPostModal(true)}
            onCloseListing={handleCloseListing}
            onOpenHandoverModal={(claim) => setHandoverModalClaim(claim)}
          />
        )}

        {/* VIEW 4: Admin & SDG 12 Analytics View */}
        {currentView === 'admin' && (
          <AdminDashboardView
            metrics={sdgMetrics}
            users={adminUsers}
            logs={adminLogs}
            onToggleVerification={async (userId) => {
              await api.toggleUserVerification(userId);
              fetchAdminData();
            }}
            onRefresh={fetchAdminData}
          />
        )}

      </main>

      {/* Modals */}
      <ClaimModal
        listing={claimModalListing}
        currentUser={currentUser}
        onClose={() => setClaimModalListing(null)}
        onSubmitClaim={handleClaimSubmit}
      />

      {showPostModal && (
        <PostListingModal
          currentUser={currentUser}
          onClose={() => setShowPostModal(false)}
          onSubmit={handlePostSubmit}
        />
      )}

      <HandoverModal
        claim={handoverModalClaim}
        onClose={() => setHandoverModalClaim(null)}
        onConfirm={handleConfirmHandover}
      />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            const res = await api.login(email, password);
            setCurrentUser(res.user);
            fetchListings();
          }}
          onRegister={async (data) => {
            const res = await api.register(data);
            setCurrentUser(res.user);
            fetchListings();
          }}
        />
      )}

      {/* Floating Real-time Notification Toast */}
      <NotificationToast
        toast={liveToast}
        onDismiss={() => setLiveToast(null)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-[#E8E5DC] bg-white py-6 text-xs text-[#726B5A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serifDisplay font-bold text-[#1B332C]">HarvestRelay</span>
            <span>—</span>
            <span>Surplus Food Redistribution Matcher for Local Eateries</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Leaflet + OpenStreetMap</span>
            <span>•</span>
            <span>PostGIS / Spatial Query Engine</span>
            <span>•</span>
            <span>Socket.IO Real-Time Gateway</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

