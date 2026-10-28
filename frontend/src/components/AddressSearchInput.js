/**
 * AddressSearchInput — reusable free address field
 * Uses Nominatim (OpenStreetMap) for autocomplete + reverse geocoding.
 * Zero paid API dependency.
 *
 * Props:
 *   value        — current address string (controlled)
 *   onChange     — (addressString) => void
 *   onSelect     — ({ address, latitude, longitude, city, state, pincode }) => void
 *   placeholder  — string
 *   required     — bool
 *   label        — optional label text above the input
 *   showMap      — bool, show a small inline map preview (default false)
 *   style        — wrapper style overrides
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

const NOMINATIM = process.env.REACT_APP_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

// Rate-limit guard: Nominatim asks for max 1 req/sec
let lastNominatimCall = 0;
const nominatimFetch = async (url) => {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNominatimCall = Date.now();
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'HyperlocalJobs/1.0' } });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  return res.json();
};

const AddressSearchInput = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search address, area, or city...',
  required = false,
  label,
  style = {},
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualVal, setManualVal] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const data = await nominatimFetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`
      );
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently fail — user can still type manually
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange && onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 600);
  };

  const pick = (item) => {
    const addr = item.display_name;
    const a = item.address || {};
    onChange && onChange(addr);
    onSelect && onSelect({
      address: addr,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      city: a.village || a.hamlet || a.suburb || a.neighbourhood || a.town || a.municipality || a.city_district || a.city || a.county || '',
      state: a.state || '',
      pincode: a.postcode || '',
    });
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Please type your address.');
      setShowManual(true);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;        try {
          const data = await nominatimFetch(
            `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
          );
          const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const a = data.address || {};
          onChange && onChange(addr);
          onSelect && onSelect({
            address: addr, latitude: lat, longitude: lng,
            city: a.village || a.hamlet || a.suburb || a.neighbourhood || a.town || a.municipality || a.city_district || a.city || a.county || '',
            state: a.state || '',
            pincode: a.postcode || '',
          });
          toast.success('📍 Location detected!');
        } catch {
          // Geocoding failed but we still have coordinates
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onChange && onChange(fallback);
          onSelect && onSelect({ address: fallback, latitude: lat, longitude: lng });
          toast.info('Location set. Address lookup unavailable — you can edit it manually.');
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoDenied(true);
          toast.warning('Location permission denied. Please type your address below.');
          setShowManual(true);
        } else if (err.code === 3) {
          toast.error('Location request timed out. Please type your address.');
        } else {
          toast.error('Could not get location. Please type your address.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const saveManual = () => {
    if (!manualVal.trim()) { toast.error('Please enter an address'); return; }
    onChange && onChange(manualVal);
    onSelect && onSelect({ address: manualVal, latitude: 0, longitude: 0, city: '', state: '', pincode: '' });
    setShowManual(false);
    toast.success('Address saved!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}>
      {label && (
        <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{label}</label>
      )}

      {/* Main input row */}
      <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInput}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            style={{
              width: '100%', padding: '0.875rem 2.5rem 0.875rem 0.875rem',
              border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; setTimeout(() => setSuggestions([]), 200); }}
          />
          {loading && (
            <div style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 14, height: 14, border: '2px solid #e5e7eb', borderTopColor: '#6366f1',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          )}
        </div>

        {/* Use my location button */}
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={geoLoading || geoDenied}
          title={geoDenied ? 'Location permission denied — type address manually' : 'Use my current location'}
          style={{
            padding: '0.875rem 1rem', border: 'none', borderRadius: 8, cursor: geoDenied ? 'not-allowed' : 'pointer',
            background: geoDenied ? '#f3f4f6' : geoLoading ? '#e5e7eb' : '#6366f1',
            color: geoDenied ? '#9ca3af' : 'white', fontSize: '0.85rem', fontWeight: 600,
            whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
            transition: 'background 0.2s',
          }}
        >
          {geoLoading ? (
            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Detecting...</>
          ) : geoDenied ? '🚫 Denied' : '📍 My Location'}
        </button>
      </div>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => pick(s)}
              style={{ padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: '0.85rem', color: '#374151', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
              <span>{s.display_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Manual entry fallback */}
      {!showManual ? (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
        >
          ✏️ Enter address manually instead
        </button>
      ) : (
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Type your full address
          </label>
          <textarea
            value={manualVal}
            onChange={e => setManualVal(e.target.value)}
            rows={2}
            placeholder="e.g. 123 MG Road, Koregaon Park, Pune, Maharashtra 411001"
            style={{ width: '100%', padding: '0.75rem', border: '2px solid #c4b5fd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={saveManual}
              style={{ padding: '0.5rem 1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Save
            </button>
            <button type="button" onClick={() => setShowManual(false)}
              style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #c4b5fd', color: '#7c3aed', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved address chip */}
      {value && !showManual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
          <span style={{ color: '#10b981', flexShrink: 0 }}>✅</span>
          <span style={{ color: '#166534', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
          <button type="button" onClick={() => { onChange && onChange(''); onSelect && onSelect({ address: '', latitude: 0, longitude: 0 }); }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0, padding: 0 }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default AddressSearchInput;
