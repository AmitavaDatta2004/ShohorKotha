"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { Ticket } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { Users, ShieldAlert, Clock, MapPin, Activity } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MunicipalMapViewProps {
  tickets: Ticket[];
}

// Custom icons for different priorities
const highPriorityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const mediumPriorityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const lowPriorityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getIconForPriority = (priority: 'High' | 'Medium' | 'Low') => {
  switch (priority) {
    case 'High':
      return highPriorityIcon;
    case 'Medium':
      return mediumPriorityIcon;
    case 'Low':
      return lowPriorityIcon;
    default:
      return new L.Icon.Default();
  }
};

const getPriorityClass = (priority: 'High' | 'Medium' | 'Low') => {
  switch (priority) {
    case 'High':
      return 'priority-high';
    case 'Medium':
      return 'priority-medium';
    case 'Low':
      return 'priority-low';
    default:
      return '';
  }
};

export default function MunicipalMapView({ tickets }: MunicipalMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const openPopupIdRef = useRef<string | null>(null);
  const indiaCenter: L.LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    if (mapRef.current === null) {
      const map = L.map("municipal-map", {
        center: indiaCenter,
        zoom: 5,
        closePopupOnClick: false, // Prevent popups from closing when clicking map
      });

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
        const marker = L.marker([ticket.location.latitude, ticket.location.longitude], {
          icon: getIconForPriority(ticket.priority),
        })
          .addTo(map);

        const usersIconMarkup = renderToStaticMarkup(<Users className="h-3 w-3 inline-block mr-1 text-indigo-600" />);
        const statusIconMarkup = renderToStaticMarkup(<Activity className="h-3 w-3 inline-block mr-1 text-slate-400" />);
        const clockIconMarkup = renderToStaticMarkup(<Clock className="h-3 w-3 inline-block mr-1 text-slate-400" />);
        const pinIconMarkup = renderToStaticMarkup(<MapPin className="h-3 w-3 inline-block mr-1 text-slate-400" />);
        
        const shortNotes = ticket.notes ? (ticket.notes.length > 80 ? ticket.notes.substring(0, 80) + '...' : ticket.notes) : 'No administrative notes provided.';

        const popupContent = `
          <div class="map-popup">
            <div class="popup-header">
                <span class="popup-category">${ticket.category}</span>
                <span class="popup-priority ${getPriorityClass(ticket.priority)}">${ticket.priority}</span>
            </div>
            <h3 class="map-popup-title">${ticket.title || ticket.category}</h3>
            
            <div class="popup-row">
                ${pinIconMarkup}
                <span class="popup-text">${ticket.address}</span>
            </div>

            <div class="popup-row">
                ${statusIconMarkup}
                <span class="popup-text font-black text-indigo-600 uppercase tracking-widest">${ticket.status}</span>
            </div>

            <div class="map-popup-notes">
                ${shortNotes}
            </div>

            <div class="map-popup-details">
              <div class="detail-item">
                <span class="detail-label">Staff Assigned</span>
                <span class="detail-value">${ticket.assignedSupervisorName || 'Waiting Assignment'}</span>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Reports</span>
                    <span class="detail-value">${usersIconMarkup} ${ticket.reportCount || 1}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Logged</span>
                    <span class="detail-value">${clockIconMarkup} ${formatDistanceToNow(new Date(ticket.submittedDate), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
            className: 'modern-leaflet-popup',
            minWidth: 260,
            autoClose: false,
            closeOnClick: false
        });

        marker.on('popupopen', () => {
            openPopupIdRef.current = ticket.id;
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

  }, [tickets]);

  return (
    <>
      <style>{`
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
        .map-popup {
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
        
        .map-popup-title {
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 0.75rem;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .popup-row {
          display: flex;
          align-items: start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .popup-text {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          line-height: 1.3;
        }
        .map-popup-notes {
          font-size: 11px;
          color: #475569;
          margin: 0.75rem 0 1.25rem;
          border-left: 3px solid #f1f5f9;
          padding-left: 10px;
          font-style: italic;
          line-height: 1.4;
        }
        .map-popup-details {
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .detail-grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 1rem;
        }
        .detail-label {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .detail-value {
          font-size: 10px;
          font-weight: 800;
          color: #1e293b;
          display: flex;
          align-items: center;
        }
        .leaflet-popup-tip {
            background: white;
        }
      `}</style>
      <div id="municipal-map" style={{ height: "600px", width: "100%", borderRadius: 'var(--radius)' }} />
    </>
  );
}