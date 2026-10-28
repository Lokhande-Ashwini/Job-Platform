import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const NOMINATIM = process.env.REACT_APP_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

// Inner component: handles map click + marker drag
const DraggableMarker = ({ position, onMove }) => {
  const markerRef = useRef(null);
  const map = useMap();

  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });

  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], map.getZoom());
  }, [position, map]);

  if (!position) return null;
  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current;
          if (m) { const p = m.getLatLng(); onMove(p.lat, p.lng); }
        }
      }}
    />
  );
};

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const debounceRef = useRef(null);

  // Reverse geocode: coordinates → address
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const a = data.address || {};
      setAddress(addr);
      if (onLocationSelect) {
        onLocationSelect({
          latitude: lat, longitude: lng, address: addr,
          city: a.village || a.hamlet || a.suburb || a.neighbourhood || a.town || a.municipality || a.city_district || a.city || a.county || '',
          state: a.state || '',
          pincode: a.postcode || '',
        });
      }
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallback);
      if (onLocationSelect) onLocationSelect({ latitude: lat, longitude: lng, address: fallback });
    }
  }, [onLocationSelect]);

  const handleMove = useCallback((lat, lng) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Pre-fill address when initialLocation is provided
  useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng && !address) {
      reverseGeocode(initialLocation.lat, initialLocation.lng);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Forward geocode: text → suggestions
  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally { setSearching(false); }
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 500);
  };

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setPosition({ lat, lng });
    setSearchQuery(item.display_name);
    setSuggestions([]);
    reverseGeocode(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      setManualMode(true);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
        setGeoLoading(false);
        toast.success('📍 Location detected!');
      },
      err => {
        setGeoLoading(false);
        if (err.code === 1) {
          toast.warning('Location permission denied. Please enter address manually.');
        } else {
          toast.error('Could not get location. Please enter manually.');
        }
        setManualMode(true);
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const saveManualAddress = () => {
    if (!manualAddress.trim()) { toast.error('Please enter an address'); return; }
    setAddress(manualAddress);
    if (onLocationSelect) {
      onLocationSelect({ latitude: position?.lat || 0, longitude: position?.lng || 0, address: manualAddress });
    }
    setManualMode(false);
    toast.success('Address saved!');
  };

  const mapCenter = position ? [position.lat, position.lng] : [INDIA_CENTER.lat, INDIA_CENTER.lng];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="🔍 Search address, area, city..."
              style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; setTimeout(() => setSuggestions([]), 200); }}
            />
            {searching && (
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: '2px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            )}
          </div>
          <button type="button" onClick={getCurrentLocation} disabled={geoLoading}
            style={{ padding: '0.75rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: geoLoading ? 0.7 : 1 }}>
            {geoLoading ? '⏳' : '📍'} {geoLoading ? 'Detecting...' : 'My Location'}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onMouseDown={() => selectSuggestion(s)}
                style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem', color: '#374151' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                📍 {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual entry toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setManualMode(!manualMode)}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline' }}>
          {manualMode ? 'Use map instead' : '✏️ Enter address manually'}
        </button>
      </div>

      {/* Manual address input */}
      {manualMode && (
        <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: 10, border: '1px solid #c4b5fd' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Enter your full address</label>
          <textarea value={manualAddress} onChange={e => setManualAddress(e.target.value)} rows={2}
            placeholder="e.g. 123 Main Street, Koregaon Park, Pune, Maharashtra 411001"
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #c4b5fd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button type="button" onClick={saveManualAddress}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            Save Address
          </button>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', height: 320 }}>
        <MapContainer center={mapCenter} zoom={position ? 14 : 5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={position} onMove={handleMove} />
        </MapContainer>
      </div>

      {/* Selected address display */}
      {address && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '0.875rem 1rem' }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.25rem', fontSize: '0.875rem' }}>✅ Selected Location</div>
          <div style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '0.35rem' }}>{address}</div>
          {position && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Lat: {position.lat.toFixed(6)}</span>
              <span>Lng: {position.lng.toFixed(6)}</span>
              <a href={`https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}&zoom=16`} target="_blank" rel="noreferrer"
                style={{ color: '#6366f1', fontWeight: 600 }}>View on OSM ↗</a>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
        💡 Click on the map or drag the marker to fine-tune your location
      </p>
    </div>
  );
};

export default LocationPicker;
