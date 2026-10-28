import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Icon factories ─────────────────────────────────────────────────────── */
const makeWorkerIcon = (worker, isSelected) => {
  const verified = worker.workerProfile?.verificationStatus === 'verified';
  const rating   = worker.workerProfile?.rating || 0;
  const bg       = isSelected ? '#6366f1' : verified ? '#059669' : '#6b7280';
  const border   = isSelected ? '3px solid #fbbf24' : '3px solid white';
  const size     = isSelected ? 40 : 34;
  const initial  = (worker.name || 'W').charAt(0).toUpperCase();
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border:${border};border-radius:50%;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:${isSelected ? 15 : 13}px;font-weight:700;
      cursor:pointer;transition:all 0.2s;
      ${isSelected ? 'transform:scale(1.15);' : ''}
    ">${initial}${verified ? '<span style="position:absolute;bottom:-2px;right:-2px;background:#10b981;border-radius:50%;width:12px;height:12px;border:2px solid white;font-size:7px;display:flex;align-items:center;justify-content:center;">✓</span>' : ''}</div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

const userLocationIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="width:22px;height:22px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.6);"></div>
    <div style="position:absolute;inset:-6px;border:2px solid rgba(59,130,246,0.3);border-radius:50%;animation:pulse 2s infinite;"></div>
  </div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

/* ── Auto-fit bounds ────────────────────────────────────────────────────── */
const FitBounds = ({ workers, center, radius }) => {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const points = [];
    workers.forEach(w => {
      const [lng, lat] = w.location?.coordinates || [0, 0];
      if (lat && lng && !(lat === 0 && lng === 0)) points.push([lat, lng]);
    });
    if (center?.lat && center?.lng) points.push([center.lat, center.lng]);

    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
      fitted.current = true;
    } else if (center?.lat && center?.lng) {
      const radiusKm = (radius || 5000) / 1000;
      const zoomLevel = radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : radiusKm <= 20 ? 11 : 10;
      map.setView([center.lat, center.lng], zoomLevel);
      fitted.current = true;
    }
  }, [workers, center, radius, map]);

  // Reset fit when center changes significantly
  useEffect(() => { fitted.current = false; }, [center?.lat, center?.lng]);

  return null;
};

/* ── Current location button (inside map) ───────────────────────────────── */
const LocateButton = ({ onLocate }) => {
  const map = useMap();
  const [loading, setLoading] = React.useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        map.setView([lat, lng], 14);
        onLocate && onLocate({ lat, lng, accuracy });
        setLoading(false);
      },
      () => setLoading(false),
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [map, onLocate]);

  return (
    <div
      onClick={locate}
      title="Go to my location"
      style={{
        position: 'absolute', bottom: 80, right: 12, zIndex: 1000,
        width: 36, height: 36, background: 'white', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', border: '1px solid #e5e7eb',
        transition: 'box-shadow 0.2s',
      }}
    >
      {loading ? (
        <div style={{ width: 14, height: 14, border: '2px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : '🎯'}
    </div>
  );
};

/* ── Worker profile popup card ──────────────────────────────────────────── */
const WorkerPopupCard = ({ worker, onBook }) => {
  const verified = worker.workerProfile?.verificationStatus === 'verified';
  const trust    = worker.trustScore;
  const dist     = worker.distance;
  const rating   = worker.workerProfile?.rating || 0;
  const trustColors = { Platinum: '#6366f1', Gold: '#f59e0b', Silver: '#9ca3af', Bronze: '#b45309' };
  const trustColor  = trustColors[trust?.level] || '#9ca3af';

  return (
    <div style={{ minWidth: 220, maxWidth: 260, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: verified ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#667eea,#764ba2)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1.1rem', overflow: 'hidden', border: '2px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}>
          {worker.avatar
            ? <img src={worker.avatar} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (worker.name || 'W').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            {worker.name}
            {verified && <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.6rem', fontWeight: 700, padding: '0.05rem 0.35rem', borderRadius: 50 }}>✓ Verified</span>}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {worker.workerProfile?.skills?.slice(0, 2).join(' · ') || 'Worker'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.625rem' }}>
        <div style={{ background: '#f9fafb', borderRadius: 6, padding: '0.35rem 0.4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>⭐ {rating.toFixed(1)}</div>
          <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Rating</div>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 6, padding: '0.35rem 0.4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>₹{worker.workerProfile?.hourlyRate || 0}</div>
          <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>/hr</div>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 6, padding: '0.35rem 0.4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1' }}>
            {dist != null ? `${typeof dist === 'number' ? dist.toFixed(1) : dist}km` : `${worker.workerProfile?.experience || 0}yr`}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{dist != null ? 'Away' : 'Exp'}</div>
        </div>
      </div>

      {/* Trust score */}
      {trust && (
        <div style={{ background: trustColor + '12', border: `1px solid ${trustColor}30`, borderRadius: 6, padding: '0.3rem 0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: trustColor }}>
            {trust.level === 'Platinum' ? '💎' : trust.level === 'Gold' ? '🥇' : trust.level === 'Silver' ? '🥈' : '🥉'} {trust.level}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Trust Score: {trust.score}</span>
        </div>
      )}

      {/* Jobs done */}
      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.625rem' }}>
        {worker.workerProfile?.totalJobs || 0} jobs completed
        {worker.workerProfile?.availability && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 600 }}>● Available</span>}
      </div>

      {/* Book button */}
      <button
        onClick={() => onBook && onBook(worker)}
        style={{
          width: '100%', padding: '0.5rem', background: 'linear-gradient(135deg,#667eea,#764ba2)',
          color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.82rem',
        }}
      >
        Book Now →
      </button>
    </div>
  );
};

/* ── Main MapComponent ──────────────────────────────────────────────────── */
const INDIA_CENTER = [20.5937, 78.9629];

const MapComponent = ({
  workers      = [],
  center       = {},
  radius       = 0,
  selectedId   = null,
  onWorkerClick,
  onBook,
  onLocate,
}) => {
  const defaultCenter = (center?.lat && center?.lng) ? [center.lat, center.lng] : INDIA_CENTER;
  const defaultZoom   = (center?.lat && center?.lng) ? 13 : 5;

  const validWorkers = workers.filter(w => {
    const [lng, lat] = w.location?.coordinates || [0, 0];
    return lat && lng && !(lat === 0 && lng === 0);
  });

  const radiusMeters = radius > 0 ? radius : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 420, borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds workers={validWorkers} center={center} radius={radiusMeters} />
        <LocateButton onLocate={onLocate} />

        {/* User location marker */}
        {center?.lat && center?.lng && (
          <Marker position={[center.lat, center.lng]} icon={userLocationIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px 8px', fontWeight: 600, color: '#3b82f6' }}>
                📍 Your Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Radius circle */}
        {center?.lat && center?.lng && radiusMeters > 0 && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.06,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        )}

        {/* Worker markers */}
        {validWorkers.map(worker => {
          const [lng, lat] = worker.location.coordinates;
          const isSelected = selectedId === worker._id;
          return (
            <Marker
              key={worker._id}
              position={[lat, lng]}
              icon={makeWorkerIcon(worker, isSelected)}
              zIndexOffset={isSelected ? 500 : 0}
              eventHandlers={{
                click: () => onWorkerClick && onWorkerClick(worker),
              }}
            >
              <Popup maxWidth={270} minWidth={220}>
                <WorkerPopupCard worker={worker} onBook={onBook} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', borderRadius: 8,
        padding: '0.4rem 0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontSize: '0.72rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
        backdropFilter: 'blur(4px)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} /> You
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#059669', borderRadius: '50%', display: 'inline-block' }} /> Verified
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: '#6b7280', borderRadius: '50%', display: 'inline-block' }} /> Unverified
        </span>
        <span style={{ color: '#6366f1', fontWeight: 600 }}>{validWorkers.length} workers</span>
      </div>

      {/* Empty state */}
      {validWorkers.length === 0 && !center?.lat && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(255,255,255,0.75)', zIndex: 500,
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Allow location access to see workers near you</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
