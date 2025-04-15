"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issues
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Komponen marker yang menangani event klik pada peta
function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`
      )
        .then((res) => res.json())
        .then((data) => {
          onSelect(e.latlng, data.display_name);
        })
        .catch(err => {
          console.error("Error fetching address:", err);
          onSelect(e.latlng, "Alamat tidak ditemukan");
        });
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LeafletMap({ onSelect }) {
  return (
    <MapContainer
      center={[-7.956, 112.614]}
      zoom={16}
      scrollWheelZoom={true}
      style={{
        height: "300px",
        width: "100%",
        borderRadius: "12px",
        zIndex: 0,
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker onSelect={onSelect} />
    </MapContainer>
  );
} 