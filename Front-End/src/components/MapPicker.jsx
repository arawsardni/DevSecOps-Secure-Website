"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Komponen LocationMarker yang akan digunakan dalam MapContainer
function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null);
  const { useMapEvents, Marker } = require("react-leaflet");

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`
      )
        .then((res) => res.json())
        .then((data) => {
          onSelect(e.latlng, data.display_name);
        });
    },
  });

  return position ? <Marker position={position} /> : null;
}

// Komponen map yang hanya di-render di client side
const ClientSideMap = ({ onSelect }) => {
  const { MapContainer, TileLayer } = require("react-leaflet");
  
  // Import leaflet styles
  useEffect(() => {
    import("leaflet/dist/leaflet.css");
  }, []);

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
};

// Komponen map yang hanya di-render di client side dengan dynamic import
const Map = dynamic(
  () => import('./LeafletMap').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div 
        style={{ 
          height: "300px", 
          width: "100%", 
          background: "#f0f0f0", 
          borderRadius: "12px", 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center" 
        }}
      >
        <p>Memuat peta...</p>
      </div>
    ),
  }
);

// Fix icon issues on client side
const fixLeafletIcon = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    (async () => {
      const L = await import("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    })();
  }
};

export default function MapPicker({ onSelect }) {
  // Fix icons on mount
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return <Map onSelect={onSelect} />;
}
