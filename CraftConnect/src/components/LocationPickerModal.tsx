import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import styles from './LocationPickerModal.module.css';
import Spinner from './Spinner'; // Import Spinner if it's available in components

// Fix for default marker icon in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: icon, 
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationString: string) => void;
}

function LocationMarker({ position, setPosition, setAddress, setLoading }: any) {
  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      const addr = data.address || {};
      const localArea = addr.village || addr.suburb || addr.town || addr.city || addr.county || "";
      const stateArea = addr.state || "";
      const areaName = [localArea, stateArea].filter(Boolean).join(", ");
      setAddress(areaName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch (err) {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      fetchAddress(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Component to recenter map when opened
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Default center: India
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]);

  useEffect(() => {
    if (isOpen) {
      // Try to get user's location to center the map initially
      if (navigator.geolocation && !position) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCenter([latitude, longitude]);
          },
          () => {
            // Silently fail to default center
          }
        );
      }
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (address) {
      onConfirm(address);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Choose Location on Map</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", margin: "0" }}>
          Click anywhere on the map to pin your workshop location.
        </p>

        <div className={styles.mapContainer}>
          <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker 
              position={position} 
              setPosition={setPosition} 
              setAddress={setAddress} 
              setLoading={setLoading} 
            />
            <RecenterMap center={center} />
          </MapContainer>
        </div>

        <div className={styles.selectedLocation}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Spinner size="sm" inline /> Fetching address...
            </div>
          ) : position ? (
            <span>📍 <strong>Selected:</strong> {address}</span>
          ) : (
            <span style={{ color: "var(--outline)" }}>No location selected yet.</span>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={handleConfirm}
            disabled={!position || loading}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
