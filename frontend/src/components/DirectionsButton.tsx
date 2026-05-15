import React from 'react';
import { Navigation } from 'lucide-react';

interface DirectionsButtonProps {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
}

export default function DirectionsButton({ lat, lng, label = 'Get Directions', className = '' }: DirectionsButtonProps) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${className}`}
    >
      <Navigation className="w-3 h-3" />
      {label}
    </a>
  );
}
