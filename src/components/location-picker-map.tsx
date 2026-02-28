
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

interface LocationPickerMapProps {
  onLocationSelect: (latlng: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number } | null;
}

export default function LocationPickerMap({ onLocationSelect, initialCenter }: LocationPickerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const indiaCenter: L.LatLngExpression = [20.5937, 78.9629];
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    const center = initialCenter ? ([initialCenter.lat, initialCenter.lng] as L.LatLngExpression) : indiaCenter;
    const zoom = initialCenter ? 15 : 5;

    if (mapRef.current === null) {
      const map = L.map("location-picker-map").setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationSelect({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(map);
        }
        map.panTo(e.latlng);
      });

      mapRef.current = map;
      setMapInitialized(true);
    } else if (mapInitialized) {
        mapRef.current.setView(center, zoom);
    }

     if (initialCenter && mapRef.current) {
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([initialCenter.lat, initialCenter.lng]);
        } else {
            const pulsingIcon = L.divIcon({
                className: 'leaflet-pulsing-icon',
                iconSize: [20, 20],
            });
            userLocationMarkerRef.current = L.marker([initialCenter.lat, initialCenter.lng], { icon: pulsingIcon }).addTo(mapRef.current);
        }
    }

  }, [onLocationSelect, initialCenter, mapInitialized]);

  return (
      <>
        <style>{`
            @keyframes leaflet-pulsing-animation {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.5);
                    opacity: 0.5;
                }
                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
            .leaflet-pulsing-icon {
                background-color: hsl(var(--primary));
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
            }
            .leaflet-pulsing-icon::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background-color: hsl(var(--primary) / 0.5);
                animation: leaflet-pulsing-animation 1.5s infinite;
                z-index: -1;
            }
        `}</style>
        <div id="location-picker-map" className="h-[400px] w-full rounded-md border" />
      </>
  );
}
