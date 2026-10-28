import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color, letter) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${letter}</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
});

const workerIcon   = makeIcon('#6366f1', 'W');
const customerIcon = makeIcon('#10b981', 'C');
const bookingIcon  = makeIcon('#f59e0b', 'B');

const INDIA_CENTER = [20.5937, 78.9629];

const AdminMapPanel = ({ workers = [], customers = [], bookings = [] }) => {
  const [layer, setLayer] = useState('all');

  const validWorkers = workers.filter(w => {
    const [lng, lat] = w.location?.coordinates || [0, 0];
    return lat && lng && !(lat === 0 && lng === 0);
  });
  const validCustomers = customers.filter(c => {
    const [lng, lat] = c.location?.coordinates || [0, 0];
    return lat && lng && !(lat === 0 && lng === 0);
  });
  const validBookings = bookings.filter(b => {
    const [lng, lat] = b.location?.coordinates || [0, 0];
    return lat && lng && !(lat === 0 && lng === 0);
  });

  const LayerBtn = ({ id, label, color, count }) => (
    <button onClick={() => setLayer(id)}
      style={{ padding: '0.4rem 0.875rem', border: `2px solid ${layer === id ? color : '#e5e7eb'}`, borderRadius: 50, background: layer === id ? color : 'white', color: layer === id ? 'white' : '#6b7280', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      {label} <span style={{ background: layer === id ? 'rgba(255,255,255,0.3)' : '#f3f4f6', padding: '0 5px', borderRadius: 50, fontSize: '0.72rem' }}>{count}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Layer controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <LayerBtn id="all"       label="All"       color="#374151" count={validWorkers.length + validCustomers.length} />
        <LayerBtn id="workers"   label="👷 Workers"   color="#6366f1" count={validWorkers.length} />
        <LayerBtn id="customers" label="👤 Customers" color="#10b981" count={validCustomers.length} />
        <LayerBtn id="bookings"  label="📋 Bookings"  color="#f59e0b" count={validBookings.length} />
      </div>

      {/* Map */}
      <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', height: 480 }}>
        <MapContainer center={INDIA_CENTER} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Workers */}
          {(layer === 'all' || layer === 'workers') && validWorkers.map(w => {
            const [lng, lat] = w.location.coordinates;
            return (
              <Marker key={w._id} position={[lat, lng]} icon={workerIcon}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>{w.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{w.workerProfile?.skills?.slice(0,2).join(', ')}</div>
                    <div style={{ color: '#059669', fontWeight: 700, marginTop: 3 }}>₹{w.workerProfile?.hourlyRate}/hr</div>
                    <div style={{ color: '#f59e0b', fontSize: '0.82rem' }}>⭐ {(w.workerProfile?.rating||0).toFixed(1)}</div>
                    <div style={{ marginTop: 6, fontSize: '0.75rem' }}>
                      <span style={{ background: w.workerProfile?.verificationStatus==='verified'?'#d1fae5':'#fef3c7', color: w.workerProfile?.verificationStatus==='verified'?'#065f46':'#92400e', padding: '1px 6px', borderRadius: 50, fontWeight: 600 }}>
                        {w.workerProfile?.verificationStatus}
                      </span>
                    </div>
                    <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`} target="_blank" rel="noreferrer"
                      style={{ display: 'block', marginTop: 6, fontSize: '0.75rem', color: '#6366f1' }}>View on map ↗</a>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Customers */}
          {(layer === 'all' || layer === 'customers') && validCustomers.map(c => {
            const [lng, lat] = c.location.coordinates;
            return (
              <Marker key={c._id} position={[lat, lng]} icon={customerIcon}>
                <Popup>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>{c.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{c.email}</div>
                    <div style={{ color: '#059669', fontSize: '0.82rem', marginTop: 3 }}>🏅 {c.loyaltyPoints||0} pts</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Bookings */}
          {(layer === 'bookings') && validBookings.map(b => {
            const [lng, lat] = b.location.coordinates;
            return (
              <React.Fragment key={b._id}>
                <Marker position={[lat, lng]} icon={bookingIcon}>
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>{b.service}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>Customer: {b.customer?.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>Worker: {b.worker?.name}</div>
                      <div style={{ color: '#059669', fontWeight: 700, marginTop: 3 }}>₹{b.amount}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 3 }}>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: 50, fontWeight: 600 }}>{b.status}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <Circle center={[lat, lng]} radius={500} pathOptions={{ color: '#f59e0b', fillColor: '#fef3c7', fillOpacity: 0.3, weight: 1 }} />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Workers on map', value: validWorkers.length, color: '#6366f1' },
          { label: 'Customers on map', value: validCustomers.length, color: '#10b981' },
          { label: 'Bookings on map', value: validBookings.length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 120, background: 'white', borderRadius: 10, padding: '0.875rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMapPanel;
