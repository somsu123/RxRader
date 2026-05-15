import { useState, useCallback } from 'react';
import { getNearestPharmacies, PharmacyLocation } from '../lib/api';

export type GeoStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeolocationState {
  status: GeoStatus;
  userLocation: { lat: number; lng: number } | null;
  pharmacies: PharmacyLocation[];
  detect: () => void;
  setFromCoords: (lat: number, lng: number) => Promise<void>;
}

export function useGeolocation(medicineId?: string): GeolocationState {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyLocation[]>([]);

  const setFromCoords = useCallback(async (lat: number, lng: number) => {
    setStatus('loading');
    try {
      const data = await getNearestPharmacies(lat, lng, medicineId);
      setUserLocation({ lat, lng });
      setPharmacies(data.pharmacies);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [medicineId]);

  const detect = useCallback(() => {
    if (!navigator.geolocation) { setStatus('error'); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => setFromCoords(pos.coords.latitude, pos.coords.longitude),
      () => setStatus('error'),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [setFromCoords]);

  return { status, userLocation, pharmacies, detect, setFromCoords };
}
