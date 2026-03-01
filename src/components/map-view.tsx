
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { Ticket } from "@/types";
import { Users, ShieldAlert, MessageSquare, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapViewProps {
  tickets: Ticket[];
  onJoinReport: (ticketId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function MapView({ tickets, onJoinReport, userLocation }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const openPopupIdRef = useRef<string | null>(null);
  const indiaCenter: L.LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    if (mapRef.current === null) {
      const initialView = userLocation 
        ? [userLocation.latitude, userLocation.longitude] as L.LatLngExpression
        : indiaCenter;
      
      const initialZoom = userLocation ? 14 : 5;

      const map = L.map("citizen-map", {
        zoomControl: false,
        closePopupOnClick: false,
      }).setView(initialView, initialZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapRef.current = map;
    }
    
    const map = mapRef.current;

    // Center map on user if location changes
    if (userLocation) {
        map.setView([userLocation.latitude, userLocation.longitude], 14);
    }

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add User Marker if available
    if (userLocation) {
        const pulsingIcon = L.divIcon({
            className: 'user-location-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
        
        L.marker([userLocation.latitude, userLocation.longitude], { 
            icon: pulsingIcon,
            zIndexOffset: 1000 
        }).addTo(map).bindPopup('<div class="font-black text-[10px] uppercase tracking-widest text-indigo-600">You are here</div>', {
            className: 'user-popup'
        });
    }

    // Add incident markers
    tickets.forEach((ticket) => {
      if (ticket.location) {
        const marker = L.marker([ticket.location.latitude, ticket.location.longitude])
          .addTo(map);

        const usersIconMarkup = renderToStaticMarkup(<Users className="h-3 w-3 inline-block mr-1 text-indigo-600" />);
        const alertIconMarkup = renderToStaticMarkup(<ShieldAlert className="h-3.5 w-3.5 inline-block mr-1 text-red-500" />);
        const noteIconMarkup = renderToStaticMarkup(<MessageSquare className="h-3 w-3 inline-block mr-1 text-slate-400" />);
        const pinIconMarkup = renderToStaticMarkup(<MapPin className="h-3 w-3 inline-block mr-1 text-slate-400" />);
        
        const shortNotes = ticket.notes ? (ticket.notes.length > 60 ? ticket.notes.substring(0, 60) + '...' : ticket.notes) : 'No context provided.';

        const popupContent = document.createElement('div');
        popupContent.className = 'custom-map-popup';
        popupContent.innerHTML = `
            <div class="popup-header">
                <span class="popup-category">${ticket.category}</span>
                <span class="popup-priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
            </div>
            <h4 class="popup-title">${ticket.title || 'Untitled Incident'}</h4>
            <div class="popup-address">
                ${pinIconMarkup}
                <span>${ticket.address}</span>
            </div>
            <div class="popup-notes">
                ${noteIconMarkup}
                <span>${shortNotes}</span>
            </div>
            <div class="popup-stats">
                <div class="stat-item">
                    ${usersIconMarkup}
                    <span class="stat-value">${ticket.reportCount || 1} citizens</span>
                </div>
                ${ticket.severityScore ? `
                <div class="stat-item">
                    ${alertIconMarkup}
                    <span class="stat-value">Severity ${ticket.severityScore}/10</span>
                </div>` : ''}
            </div>
            <button id="join-report-${ticket.id}" class="popup-join-button">Join Movement</button>
        `;
        
        marker.bindPopup(popupContent, { 
            autoClose: false,
            closeOnClick: false,
            className: 'modern-leaflet-popup',
            minWidth: 260
        });
        
        marker.on('popupopen', () => {
            openPopupIdRef.current = ticket.id;
            const joinButton = document.querySelector(`#join-report-${ticket.id}`);
            if (joinButton) {
                joinButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onJoinReport(ticket.id);
                });
            }
        });

        marker.on('popupclose', () => {
            if (openPopupIdRef.current === ticket.id) {
                openPopupIdRef.current = null;
            }
        });

        // Restore open state
        if (openPopupIdRef.current === ticket.id) {
            marker.openPopup();
        }
      }
    });

  }, [tickets, onJoinReport, userLocation]);

  return (
    <>
      <style>{`
        .user-location-marker {
          background: #4f46e5;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(79, 70, 229, 0.6);
          position: relative;
        }
        .user-location-marker::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border: 2px solid #4f46e5;
          border-radius: 50%;
          opacity: 0;
          animation: map-pulse 2s infinite;
        }
        @keyframes map-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .user-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 4px 12px;
          background: white;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .user-popup .leaflet-popup-tip { display: none; }
        .modern-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(0,0,0,0.05);
          background: white;
        }
        .modern-leaflet-popup .leaflet-popup-content {
          margin: 0;
          width: 260px !important;
        }
        .modern-leaflet-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-map-popup {
          padding: 1.5rem;
          font-family: var(--font-inter), sans-serif;
        }
        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .popup-category {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
        }
        .popup-priority {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .priority-high { background: #fee2e2; color: #ef4444; }
        .priority-medium { background: #e0e7ff; color: #4f46e5; }
        .priority-low { background: #f1f5f9; color: #64748b; }
        .popup-title {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .popup-address {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: start;
          line-height: 1.3;
        }
        .popup-notes {
          font-size: 11px;
          font-weight: 500;
          color: #475569;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: start;
          line-height: 1.4;
          font-style: italic;
        }
        .popup-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }
        .stat-item {
          display: flex;
          align-items: center;
        }
        .stat-value {
          font-size: 10px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .popup-join-button {
          width: 100%;
          padding: 0.875rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 1rem;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
        }
        .popup-join-button:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 15px 20px -3px rgba(79, 70, 229, 0.3);
        }
        .popup-join-button:active {
          transform: translateY(0);
        }
      `}</style>
      <div id="citizen-map" className="h-[600px] w-full" />
    </>
  );
}
