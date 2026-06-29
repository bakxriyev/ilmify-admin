'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ViewOnlyMapProps {
  latitude: number;
  longitude: number;
  height?: string;
}

export default function ViewOnlyMap({ latitude, longitude, height = '300px' }: ViewOnlyMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (document.querySelector('link[href*="leaflet.css"]')) {
      setReady(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.onload = () => setReady(true);
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!ready || mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    }).setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.marker([latitude, longitude]).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [ready, latitude, longitude]);

  if (!ready) {
    return (
      <div
        style={{ height, width: '100%', backgroundColor: '#f3f4f6' }}
        className="flex items-center justify-center text-gray-400 text-sm rounded-lg"
      >
        Xarita yuklanmoqda...
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, width: '100%', zIndex: 0 }} />;
}
