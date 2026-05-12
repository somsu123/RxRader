import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PharmacyLocation } from '../lib/api';
import DirectionsButton from './DirectionsButton';

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color: string, size: number = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function makePulseIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px;">
      <div style="
        position:absolute;inset:0;
        background:${color};opacity:0.3;
        border-radius:50%;
        animation:rxpulse 1.4s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:4px;left:4px;
        width:14px;height:14px;
        background:${color};
        border:2.5px solid white;
        border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
      "></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -15],
  });
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;inset:0;
        background:#3b82f6;opacity:0.25;
        border-radius:50%;
        animation:rxpulse 1.2s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:3px;left:3px;
        width:14px;height:14px;
        background:#3b82f6;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(59,130,246,0.6);
      "></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

// Inject pulse keyframes once
if (typeof document !== 'undefined' && !document.getElementById('rxpulse-style')) {
  const style = document.createElement('style');
  style.id = 'rxpulse-style';
  style.textContent = `@keyframes rxpulse{0%{transform:scale(1);opacity:0.4}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}`;
  document.head.appendChild(style);
}

// Sub-component: re-centers map when userLocation changes
function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 1.2 }); }, [center, map]);
  return null;
}

// Sub-component: opens popup for activePharmacy
function ActiveMarkerOpener({
  pharmacies,
  activePharmacy,
  markerRefs,
}: {
  pharmacies: PharmacyLocation[];
  activePharmacy: string | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  useEffect(() => {
    if (!activePharmacy) return;
    const marker = markerRefs.current[activePharmacy];
    if (marker) marker.openPopup();
  }, [activePharmacy, markerRefs]);
  return null;
}

interface PharmacyMapProps {
  userLocation: { lat: number; lng: number } | null;
  pharmacies: PharmacyLocation[];
  activePharmacy: string | null;
  onPharmacyClick: (name: string) => void;
  isLoading?: boolean;
}

const PHARMACY_COLORS: Record<string, string> = {
  'Apollo Pharmacy': '#ef4444',
  'MedPlus':         '#22c55e',
  'Netmeds':         '#3b82f6',
  '1mg':             '#f97316',
  'Jan Aushadhi':    '#a855f7',
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center

export default function PharmacyMap({
  userLocation,
  pharmacies,
  activePharmacy,
  onPharmacyClick,
  isLoading = false,
}: PharmacyMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({});

  const cheapest = pharmacies.reduce<PharmacyLocation | null>((best, p) => {
    if (p.pricePerUnit == null) return best;
    if (!best || (best.pricePerUnit ?? Infinity) > p.pricePerUnit) return p;
    return best;
  }, null);

  const nearest = pharmacies.reduce<PharmacyLocation | null>((best, p) => {
    if (!best || p.distanceKm < best.distanceKm) return p;
    return best;
  }, null);

  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : DEFAULT_CENTER;

  return (
    <div className="relative w-full h-64 md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 13 : 5}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && <MapFlyTo center={[userLocation.lat, userLocation.lng]} />}

        {/* User location pin */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon()}>
            <Popup>
              <div className="text-xs font-bold text-blue-700">📍 Your Location</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pharmacy markers */}
        {pharmacies.map((p) => {
          const isCheapest = cheapest?.name === p.name;
          const isNearest  = nearest?.name === p.name;
          const color = PHARMACY_COLORS[p.name] ?? p.color ?? '#94a3b8';
          const icon = (isCheapest || isNearest) ? makePulseIcon(color) : makeIcon(color);

          return (
            <Marker
              key={p.name}
              position={[p.lat, p.lng]}
              icon={icon}
              ref={(ref) => { if (ref) markerRefs.current[p.name] = ref; }}
              eventHandlers={{ click: () => onPharmacyClick(p.name) }}
            >
              <Popup minWidth={200}>
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-black text-slate-800">{p.name}</span>
                  </div>

                  {(isCheapest || isNearest) && (
                    <div className="flex gap-1 mb-1.5 flex-wrap">
                      {isCheapest && (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          ★ Cheapest
                        </span>
                      )}
                      {isNearest && (
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          ⬤ Nearest
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-0.5 text-slate-600 mb-2">
                    <div>📍 {p.distanceKm} km away</div>
                    {p.pricePerUnit != null && (
                      <div>💊 ₹{p.pricePerUnit} / unit</div>
                    )}
                    {p.availability && (
                      <div>
                        {p.availability === 'In Stock' ? '✅' : '⚠️'} {p.availability}
                      </div>
                    )}
                  </div>

                  <DirectionsButton lat={p.lat} lng={p.lng} />
                </div>
              </Popup>
            </Marker>
          );
        })}

        <ActiveMarkerOpener
          pharmacies={pharmacies}
          activePharmacy={activePharmacy}
          markerRefs={markerRefs}
        />
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Finding pharmacies…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && userLocation && pharmacies.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="bg-white/90 rounded-xl px-4 py-3 text-center shadow">
            <p className="text-sm font-bold text-slate-600">No pharmacies found nearby.</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {pharmacies.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-slate-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="text-[9px] font-black text-slate-600 uppercase">Cheapest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
            <span className="text-[9px] font-black text-slate-600 uppercase">Nearest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-100" />
            <span className="text-[9px] font-black text-slate-600 uppercase">You</span>
          </div>
        </div>
      )}
    </div>
  );
}
