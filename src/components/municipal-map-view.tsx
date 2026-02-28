
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type { Ticket } from "@/types";

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

export default function MunicipalMapView({ tickets }: MunicipalMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const indiaCenter: L.LatLngExpression = [20.5937, 78.9629];

  useEffect(() => {
    if (mapRef.current === null) {
      const map = L.map("map", {
        center: indiaCenter,
        zoom: 5,
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
        L.marker([ticket.location.latitude, ticket.location.longitude], {
          icon: getIconForPriority(ticket.priority),
        })
          .addTo(map)
          .bindPopup(
            `<b>${ticket.category}</b><br>Priority: ${ticket.priority}<br>${ticket.notes}`
          );
      }
    });

  }, [tickets]);

  return <div id="map" style={{ height: "600px", width: "100%", borderRadius: 'var(--radius)' }} />;
}
