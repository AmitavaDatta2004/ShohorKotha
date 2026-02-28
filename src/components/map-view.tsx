
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { Ticket } from "@/types";
import { Users } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapViewProps {
  tickets: Ticket[];
  onJoinReport: (ticketId: string) => void;
}

export default function MapView({ tickets, onJoinReport }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const indiaCenter: L.LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    if (mapRef.current === null) {
      const map = L.map("map").setView(indiaCenter, 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
    }
    
    const map = mapRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    tickets.forEach((ticket) => {
      if (ticket.location) {
        const marker = L.marker([ticket.location.latitude, ticket.location.longitude])
          .addTo(map);

        const iconMarkup = renderToStaticMarkup(<Users className="h-4 w-4 inline-block mr-1" />);
        
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
            <b>${ticket.category}</b>
            <p>${ticket.notes}</p>
            <div style="display: flex; align-items: center; margin-top: 8px;">
                ${iconMarkup}
                <span>${ticket.reportCount || 1}</span>
            </div>
            <button id="join-report-${ticket.id}" class="join-report-button">Join Report</button>
        `;
        
        marker.bindPopup(popupContent, { autoClose: false });
        
        const joinButton = popupContent.querySelector(`#join-report-${ticket.id}`);
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                onJoinReport(ticket.id);
            });
        }
      }
    });

  }, [tickets, onJoinReport]);

  return (
    <>
      <style>{`
        .join-report-button {
          margin-top: 10px;
          padding: 8px 12px;
          border: none;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: var(--radius);
          cursor: pointer;
          width: 100%;
        }
        .join-report-button:hover {
          background-color: hsl(var(--primary) / 0.9);
        }
      `}</style>
      <div id="map" className="h-[600px] w-full" />
    </>
  );
}
