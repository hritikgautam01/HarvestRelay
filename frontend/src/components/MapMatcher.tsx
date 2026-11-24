import React, { useEffect, useRef } from 'react';
import { Listing } from '../types';
import L from 'leaflet';
import { Compass, Navigation2 } from 'lucide-react';

interface MapMatcherProps {
  listings: Listing[];
  userLat: number;
  userLng: number;
  radiusKm: number;
  selectedListing: Listing | null;
  hoveredListingId: string | null;
  onSelectListing: (listing: Listing) => void;
  onClaimListing: (listing: Listing) => void;
  onLocationChange?: (lat: number, lng: number) => void;
  canClaim: boolean;
}

export const MapMatcher: React.FC<MapMatcherProps> = ({
  listings,
  userLat,
  userLng,
  radiusKm,
  selectedListing,
  hoveredListingId,
  onSelectListing,
  onClaimListing,
  onLocationChange,
  canClaim,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLat, userLng],
      zoom: 13,
      zoomControl: false,
    });

    // Official OpenStreetMap tile layer (100% free, public, NO API KEY REQUIRED)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click anywhere on map to reposition your location & recalculate all distances!
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onLocationChange) {
        onLocationChange(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Draw / update radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }

    if (radiusKm > 0) {
      circleRef.current = L.circle([userLat, userLng], {
        radius: radiusKm * 1000,
        color: '#2D5A4C',
        weight: 1.5,
        dashArray: '5, 6',
        fillColor: '#4B8C76',
        fillOpacity: 0.08,
      }).addTo(map);
    }

    // User / Station hub marker (draggable!)
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; cursor: grab;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(45, 90, 76, 0.28); animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #1B332C; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
            📍
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const userMarker = L.marker([userLat, userLng], { 
      icon: userIcon,
      draggable: true,
    }).addTo(map);

    userMarker.bindTooltip(
      '<b>Your Station Location</b><br><span style="font-size:10px;color:#726B5A;">(Click or drag to test distance engine)</span>',
      { direction: 'top', offset: [0, -12] }
    );

    userMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      if (onLocationChange) {
        onLocationChange(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
      }
    });

    userMarkerRef.current = userMarker;
  }, [userLat, userLng, radiusKm]);

  // Update Listing Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    listings.forEach((listing) => {
      const isUrgent =
        new Date(listing.pickup_deadline).getTime() - Date.now() < 90 * 60 * 1000 &&
        listing.status === 'AVAILABLE';

      const isClaimed = listing.status === 'CLAIMED';
      const isAvailable = listing.status === 'AVAILABLE';

      const pinBg = isUrgent ? '#DC653A' : isClaimed ? '#475569' : '#15803D';
      const pinIcon = isUrgent ? '⚡' : isClaimed ? '📦' : '🥗';

      const markerHtml = `
        <div style="position: relative; cursor: pointer; transition: transform 0.2s ease;">
          <div style="
            background: ${pinBg};
            color: #FFFFFF;
            width: 36px;
            height: 36px;
            border-radius: 12px 12px 12px 2px;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 14px rgba(0,0,0,0.22);
            border: 2px solid #FFFFFF;
          ">
            <span style="transform: rotate(45deg); font-size: 15px;">${pinIcon}</span>
          </div>
          ${
            listing.distance_km !== undefined
              ? `<div style="
                  position: absolute;
                  bottom: -18px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #FFFFFF;
                  border: 1px solid #E2E0D8;
                  border-radius: 6px;
                  padding: 1px 4px;
                  font-family: monospace;
                  font-size: 9px;
                  font-weight: 700;
                  color: #1B332C;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                ">${listing.distance_km} km</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: `listing-marker-${listing.id}`,
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([listing.latitude, listing.longitude], { icon: customIcon }).addTo(map);

      // Popup Content with Distance Engine Breakdown
      const timeLeft = getTimeLeftString(listing.pickup_deadline);
      const estBikeMins = Math.max(3, Math.round((listing.distance_km || 1) * 3.5));
      const estWalkMins = Math.max(8, Math.round((listing.distance_km || 1) * 11));

      const popupHtml = `
        <div style="padding: 14px; width: 270px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 2px 6px;
              border-radius: 4px;
              background: ${isUrgent ? '#FEE2E2' : '#E1EFE8'};
              color: ${isUrgent ? '#B91C1C' : '#26483E'};
            ">${listing.category.replace('_', ' ')}</span>
            <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: #DC653A;">
              ⏱ ${timeLeft}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #1B332C; margin: 0 0 4px 0; line-height: 1.3;">
            ${listing.title}
          </h4>
          <p style="font-size: 11px; color: #726B5A; margin: 0 0 6px 0;">
            ${listing.vendor_org_name || listing.vendor_name} • ${listing.portion_estimate} meals (${listing.quantity} ${listing.unit})
          </p>
          
          <!-- Distance Engine Travel Estimates -->
          <div style="background: #FAF9F6; border: 1px solid #E8E5DC; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; font-size: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #1B332C; margin-bottom: 2px;">
              <span>📏 Haversine Distance:</span>
              <span style="font-family: monospace;">${listing.distance_km ?? '—'} km</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #5C564A;">
              <span>🚲 Cargo Courier: ~${estBikeMins} mins</span>
              <span>🚶 Foot: ~${estWalkMins} mins</span>
            </div>
          </div>

          <div id="btn-claim-${listing.id}"></div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectListing(listing);
      });

      marker.on('popupopen', () => {
        const btnContainer = document.getElementById(`btn-claim-${listing.id}`);
        if (btnContainer) {
          if (isAvailable && canClaim) {
            btnContainer.innerHTML = `
              <button style="
                width: 100%;
                background: #1B332C;
                color: #FFFFFF;
                border: none;
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
              ">Claim This Batch</button>
            `;
            btnContainer.querySelector('button')?.addEventListener('click', () => {
              onClaimListing(listing);
            });
          } else if (isClaimed) {
            btnContainer.innerHTML = `
              <div style="text-align: center; font-size: 11px; font-weight: 600; color: #475569; padding: 4px; background: #F1F5F9; border-radius: 6px;">
                Claimed & In Transit
              </div>
            `;
          }
        }
      });

      markersRef.current[listing.id] = marker;
    });
  }, [listings, canClaim]);

  // Draw connecting line to hovered / selected listing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const activeId = hoveredListingId || selectedListing?.id;
    if (!activeId || !markersRef.current[activeId]) return;

    const targetMarker = markersRef.current[activeId];
    const targetLatLng = targetMarker.getLatLng();

    // Draw dashed path between user and batch
    routeLineRef.current = L.polyline([[userLat, userLng], targetLatLng], {
      color: '#DC653A',
      weight: 2.5,
      dashArray: '6, 8',
      opacity: 0.85,
    }).addTo(map);

    targetMarker.openPopup();
  }, [hoveredListingId, selectedListing, userLat, userLng]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#E8E5DC] shadow-soft-md">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
      
      {/* Interactive Map Floating Controls */}
      <div className="absolute top-3 left-3 z-[20] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8E5DC] shadow-soft-sm text-[11px] flex items-center gap-2">
        <Navigation2 className="w-3.5 h-3.5 text-[#2D5A4C] fill-current" />
        <span className="font-semibold text-[#1B332C]">Interactive Mode:</span>
        <span className="text-[#726B5A]">Click anywhere on map to reposition your hub</span>
      </div>

      {/* Map Floating Legend */}
      <div className="absolute top-3 right-3 z-[20] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#E8E5DC] shadow-soft-sm text-[11px] space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
          <span className="text-[#1B332C] font-medium">Available Batch</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC653A]" />
          <span className="text-[#1B332C] font-medium">Urgent (&lt; 90m left)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
          <span className="text-[#1B332C] font-medium">Claimed / Reserved</span>
        </div>
      </div>
    </div>
  );
};

function getTimeLeftString(deadlineIso: string): string {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}
