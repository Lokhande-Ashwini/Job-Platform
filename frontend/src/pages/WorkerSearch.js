import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import MapComponent from '../components/MapComponent';
import Navbar from '../components/Navbar';
import AddressSearchInput from '../components/AddressSearchInput';
import api from '../utils/api';

/* ── Constants ─────────────────────────────────────────────────────────── */
const SKILLS = [
  'Electrician','Plumber','Carpenter','Mechanic','Tutor','Painter',
  'Cleaner','Gardener','AC Technician','Appliance Repair','Mason','Welder',
  'Pest Control','Interior Designer','Security Guard',
];

const DISTANCE_OPTIONS = [
  { label: 'Any Distance', value: 0 },
  { label: '1 km',   value: 1000 },
  { label: '3 km',   value: 3000 },
  { label: '5 km',   value: 5000 },
  { label: '10 km',  value: 10000 },
  { label: '20 km',  value: 20000 },
  { label: '50 km',  value: 50000 },
  { label: '100 km', value: 100000 },
];

const SORT_OPTIONS = [
  { label: 'Best Match',      value: 'match' },
  { label: 'Nearest First',   value: 'distance' },
  { label: 'Highest Rated',   value: 'rating' },
  { label: 'Lowest Price',    value: 'price_asc' },
  { label: 'Most Experienced',value: 'experience' },
  { label: 'Most Jobs Done',  value: 'jobs' },
];

const TRUST_COLORS = { Platinum:'#6366f1', Gold:'#f59e0b', Silver:'#9ca3af', Bronze:'#b45309', New:'#6b7280' };
const TRUST_EMOJIS = { Platinum:'💎', Gold:'🥇', Silver:'🥈', Bronze:'🥉', New:'🌱' };

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmtDist = (d) => {
  if (d == null) return null;
  return typeof d === 'number' ? (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`) : `${d}km`;
};

const Pill = ({ bg, color, children, style }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'0.2rem', padding:'0.15rem 0.55rem', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:bg, color, ...style }}>{children}</span>
);

const StarBar = ({ rating, count }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
    <span style={{ color:'#f59e0b', fontWeight:700, fontSize:'0.875rem' }}>⭐ {rating.toFixed(1)}</span>
    {count > 0 && <span style={{ color:'#9ca3af', fontSize:'0.72rem' }}>({count})</span>}
  </div>
);

/* ── Worker Card ────────────────────────────────────────────────────────── */
const WorkerCard = ({ worker, isSaved, onSave, onBook, onSelect, isSelected }) => {
  const verified = worker.workerProfile?.verificationStatus === 'verified';
  const trust    = worker.trustScore;
  const dist     = worker.distance;
  const label    = worker.aiLabel;
  const tc       = TRUST_COLORS[trust?.level] || '#9ca3af';

  return (
    <div
      onClick={() => onSelect(worker)}
      style={{
        background: 'white', borderRadius: 16, overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 2px #6366f1, 0 8px 24px rgba(99,102,241,0.15)' : '0 2px 12px rgba(0,0,0,0.07)',
        border: isSelected ? '2px solid #6366f1' : '1px solid #f3f4f6',
        cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* AI label */}
      {label && (
        <div style={{ position:'absolute', top:10, left:10, zIndex:2, background:label.bg, color:label.color, border:`1px solid ${label.color}40`, padding:'0.2rem 0.6rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }} title={label.reason}>
          {label.label}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={e => { e.stopPropagation(); onSave(worker._id); }}
        style={{ position:'absolute', top:8, right:8, zIndex:2, background:'rgba(255,255,255,0.9)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.12)' }}>
        {isSaved ? '❤️' : '🤍'}
      </button>

      {/* Header gradient */}
      <div style={{ background: verified ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#667eea,#764ba2)', padding:'1.25rem 1rem 1rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.25)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:700, border:'3px solid rgba(255,255,255,0.4)', overflow:'hidden', flexShrink:0 }}>
          {worker.avatar ? <img src={worker.avatar} alt={worker.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (worker.name || 'W').charAt(0)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
            <span style={{ color:'white', fontWeight:700, fontSize:'1rem' }}>{worker.name}</span>
            {verified && <span style={{ background:'rgba(255,255,255,0.25)', color:'white', fontSize:'0.62rem', fontWeight:700, padding:'0.1rem 0.4rem', borderRadius:50 }}>✓ Verified</span>}
          </div>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.78rem', marginTop:'0.15rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {worker.workerProfile?.skills?.slice(0,3).join(' · ') || 'Worker'}
          </div>
          {worker.workerProfile?.availability && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginTop:'0.25rem' }}>
              <span style={{ width:7, height:7, background:'#4ade80', borderRadius:'50%', display:'inline-block' }}></span>
              <span style={{ color:'rgba(255,255,255,0.85)', fontSize:'0.68rem', fontWeight:600 }}>Available Now</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'1rem', flex:1, display:'flex', flexDirection:'column', gap:'0.75rem' }}>

        {/* Trust + Rating row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.4rem' }}>
          <StarBar rating={worker.workerProfile?.rating || 0} count={worker.workerProfile?.totalReviews || 0} />
          {trust && (
            <span style={{ background:tc+'15', color:tc, border:`1px solid ${tc}30`, padding:'0.15rem 0.5rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>
              {TRUST_EMOJIS[trust.level]} {trust.level} · {trust.score}
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
          {[
            { icon:'💼', label:'Experience', value:`${worker.workerProfile?.experience || 0} yrs` },
            { icon:'✅', label:'Jobs Done',  value: worker.workerProfile?.totalJobs || 0 },
            dist != null && { icon:'��', label:'Distance', value: fmtDist(dist), color:'#6366f1' },
            { icon:'⚡', label:'Response',   value: worker.workerProfile?.responseTime || 'Fast' },
          ].filter(Boolean).map((s, i) => (
            <div key={i} style={{ background:'#f9fafb', borderRadius:8, padding:'0.5rem 0.625rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span style={{ fontSize:'0.8rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:'0.62rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', lineHeight:1 }}>{s.label}</div>
                <div style={{ fontSize:'0.8rem', fontWeight:700, color: s.color || '#1f2937', marginTop:'0.1rem' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Completion rate */}
        {worker.workerProfile?.completionRate > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#9ca3af', marginBottom:'0.2rem' }}>
              <span>Completion Rate</span>
              <span style={{ color:'#10b981', fontWeight:700 }}>{Math.round(worker.workerProfile.completionRate)}%</span>
            </div>
            <div style={{ height:3, background:'#f3f4f6', borderRadius:2 }}>
              <div style={{ height:'100%', background:'#10b981', borderRadius:2, width:`${Math.min(100, worker.workerProfile.completionRate)}%`, transition:'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Price + AI score */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
          <div>
            <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase' }}>Hourly Rate</div>
            <div style={{ fontSize:'1.2rem', fontWeight:800, color:'#1f2937' }}>₹{worker.workerProfile?.hourlyRate || 0}<span style={{ fontSize:'0.72rem', color:'#9ca3af', fontWeight:400 }}>/hr</span></div>
          </div>
          {worker.recommendationScore > 0 && (
            <div style={{ background:'#f5f3ff', borderRadius:8, padding:'0.35rem 0.6rem', textAlign:'center' }}>
              <div style={{ fontSize:'0.62rem', color:'#7c3aed', fontWeight:600 }}>AI Match</div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#6366f1' }}>{Math.round(Math.min(100, worker.recommendationScore))}%</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button
            onClick={e => { e.stopPropagation(); onBook(worker); }}
            style={{ flex:1, padding:'0.6rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
            Book Now
          </button>
          <button
            onClick={e => { e.stopPropagation(); onSelect(worker); }}
            style={{ padding:'0.6rem 0.875rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:9, cursor:'pointer', fontWeight:600, fontSize:'0.82rem' }}>
            View
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main WorkerSearch Component ────────────────────────────────────────── */
const WorkerSearch = () => {
  const navigate = useNavigate();

  // Location state
  const [userLocation,    setUserLocation]    = useState({ lat: null, lng: null });
  const [locationLabel,   setLocationLabel]   = useState('');
  const [locationAccuracy,setLocationAccuracy]= useState(null);
  const [locationDenied,  setLocationDenied]  = useState(false);
  const [locating,        setLocating]        = useState(false);
  const [showLocPanel,    setShowLocPanel]    = useState(false);
  const [manualAddr,      setManualAddr]      = useState('');
  const [initialLoad,     setInitialLoad]     = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    skill: '', radius: 5000,
    minRating: 0, minPrice: 0, maxPrice: 10000,
    minExperience: 0, verifiedOnly: false,
    availableNow: true, minTrust: 0, topRated: false,
  });
  const [sortBy,    setSortBy]    = useState('match');
  const [search,    setSearch]    = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Results
  const [workers,   setWorkers]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);

  // UI state
  const [selectedWorker,  setSelectedWorker]  = useState(null);
  const [savedWorkers,    setSavedWorkers]    = useState(() => JSON.parse(localStorage.getItem('savedWorkers') || '[]'));
  const [showBookModal,   setShowBookModal]   = useState(false);
  const [bookTarget,      setBookTarget]      = useState(null);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [bookingData,     setBookingData]     = useState({ service:'', description:'', scheduledDate:'', scheduledTime:'', amount:'', isEmergency:false, paymentMethod:'cash', jobAddress:'', jobLat:0, jobLng:0 });
  const [viewMode,        setViewMode]        = useState('split'); // 'split' | 'cards' | 'map'

  /* ── Location detection ─────────────────────────────────────────────── */
  const detectLocation = useCallback((highAccuracy = true) => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setInitialLoad(false);
      setShowLocPanel(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setUserLocation({ lat, lng });
        setLocationAccuracy(Math.round(accuracy));
        setLocating(false);
        setInitialLoad(false);
        setLocationDenied(false);
        // If accuracy is very poor (>500m), auto-open location panel to let user correct it
        if (accuracy > 500) {
          setShowLocPanel(true);
        }
        // Reverse geocode with zoom=18 for maximum precision (village level)
        const NOMINATIM = process.env.REACT_APP_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
        fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`, { headers: { 'Accept-Language': 'en' } })
          .then(r => r.json())
          .then(d => {
            const a = d.address || {};
            // Use most specific location name available — village/hamlet first, then town, then city
            const label =
              a.village ||
              a.hamlet ||
              a.suburb ||
              a.neighbourhood ||
              a.town ||
              a.municipality ||
              a.city_district ||
              a.city ||
              a.county ||
              a.state_district ||
              '';
            if (label) setLocationLabel(label);
            else setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }).catch(() => {
            setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          });
      },
      err => {
        setLocating(false);
        if (err.code === 1) {
          setLocationDenied(true);
          setInitialLoad(false);
          setShowLocPanel(true);
        } else if (highAccuracy) {
          // Retry with low accuracy
          detectLocation(false);
        } else {
          setInitialLoad(false);
          setShowLocPanel(true);
        }
      },
      { timeout: highAccuracy ? 8000 : 12000, enableHighAccuracy: highAccuracy, maximumAge: highAccuracy ? 0 : 60000 }
    );
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  // Auto-search when location is set
  useEffect(() => {
    if (!initialLoad && userLocation.lat && userLocation.lng) {
      doSearch();
    }
  }, [userLocation.lat, userLocation.lng, initialLoad]); // eslint-disable-line

  /* ── Search ─────────────────────────────────────────────────────────── */
  const doSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.skill)       params.append('skill', filters.skill);
      if (userLocation.lat)    params.append('lat', userLocation.lat);
      if (userLocation.lng)    params.append('lng', userLocation.lng);
      params.append('radius', filters.radius > 0 ? filters.radius : 500000);
      const { data } = await api.get(`/workers/search?${params}`);

      let result = data.filter(w => {
        const rate = w.workerProfile?.hourlyRate || 0;
        const rating = w.workerProfile?.rating || 0;
        const exp = w.workerProfile?.experience || 0;
        const verified = w.workerProfile?.verificationStatus === 'verified';
        const avail = w.workerProfile?.availability;
        if (rate < filters.minPrice || rate > filters.maxPrice) return false;
        if (rating < filters.minRating) return false;
        if (exp < filters.minExperience) return false;
        if (filters.verifiedOnly && !verified) return false;
        if (filters.availableNow && !avail) return false;
        if (filters.topRated && rating < 4.5) return false;
        // Frontend radius double-check — exclude workers beyond selected radius
        if (filters.radius > 0 && filters.radius < 500000 && userLocation.lat && userLocation.lng) {
          const maxKm = filters.radius / 1000;
          if (w.distance != null && w.distance > maxKm) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const nameMatch = w.name?.toLowerCase().includes(q);
          const skillMatch = w.workerProfile?.skills?.some(s => s.toLowerCase().includes(q));
          if (!nameMatch && !skillMatch) return false;
        }
        return true;
      });

      // Sort
      result = [...result].sort((a, b) => {
        if (sortBy === 'distance')   return (a.distance || 999) - (b.distance || 999);
        if (sortBy === 'rating')     return (b.workerProfile?.rating || 0) - (a.workerProfile?.rating || 0);
        if (sortBy === 'price_asc')  return (a.workerProfile?.hourlyRate || 0) - (b.workerProfile?.hourlyRate || 0);
        if (sortBy === 'experience') return (b.workerProfile?.experience || 0) - (a.workerProfile?.experience || 0);
        if (sortBy === 'jobs')       return (b.workerProfile?.totalJobs || 0) - (a.workerProfile?.totalJobs || 0);
        return (b.recommendationScore || 0) - (a.recommendationScore || 0); // match
      });

      setWorkers(result);
      if (result.length === 0) toast.info('No workers found. Try adjusting filters.');
    } catch (err) {
      toast.error('Search failed: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, [filters, userLocation, search, sortBy]);

  /* ── Booking ─────────────────────────────────────────────────────────── */
  const openBookModal = async (worker) => {
    setBookTarget(worker);
    // Pre-fill service from worker's primary skill and amount from hourly rate
    const primarySkill = worker.workerProfile?.skills?.[0] || '';
    const hourlyRate = worker.workerProfile?.hourlyRate || '';
    setBookingData(prev => ({
      ...prev,
      service: primarySkill,
      amount: hourlyRate ? String(hourlyRate) : '',
    }));
    setShowBookModal(true);
    setPriceSuggestion(null);
    try {
      const skill = primarySkill || 'Electrician';
      const { data } = await api.get(`/ai/price-suggestion?skill=${skill}&workerRate=${worker.workerProfile?.hourlyRate}&estimatedHours=2`);
      setPriceSuggestion(data);
    } catch {}
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingData.service.trim()) { toast.error('Please enter the service needed'); return; }
    if (!bookingData.scheduledDate) { toast.error('Please select a date'); return; }
    if (!bookingData.scheduledTime) { toast.error('Please select a time'); return; }
    const scheduledDateTime = new Date(`${bookingData.scheduledDate}T${bookingData.scheduledTime}`);
    if (scheduledDateTime < new Date()) { toast.error('Scheduled date must be in the future'); return; }
    if (!bookingData.amount || Number(bookingData.amount) <= 0) { toast.error('Please enter a valid amount'); return; }
    try {
      const payload = {
        ...bookingData,
        amount: Number(bookingData.amount),
        scheduledDate: scheduledDateTime.toISOString(),
        worker: bookTarget._id,
      };
      if (bookingData.jobLat && bookingData.jobLng) {
        payload.location = { type:'Point', coordinates:[bookingData.jobLng, bookingData.jobLat], address: bookingData.jobAddress };
      }
      await api.post('/bookings', payload);
      toast.success('Booking request sent! Worker will accept or reject shortly.');
      setShowBookModal(false);
      setBookingData({ service:'', description:'', scheduledDate:'', scheduledTime:'', amount:'', isEmergency:false, paymentMethod:'cash', jobAddress:'', jobLat:0, jobLng:0 });
      navigate('/bookings');
    } catch (err) { toast.error('Booking failed: ' + (err.response?.data?.message || err.message)); }
  };

  const toggleSave = (id) => {
    const updated = savedWorkers.includes(id) ? savedWorkers.filter(s => s !== id) : [...savedWorkers, id];
    setSavedWorkers(updated);
    localStorage.setItem('savedWorkers', JSON.stringify(updated));
    toast.success(savedWorkers.includes(id) ? 'Removed from saved' : 'Worker saved!');
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  /* ── Loading screen ─────────────────────────────────────────────────── */
  if (initialLoad) return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      <Navbar />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:'1rem' }}>
        <div style={{ width:48, height:48, border:'4px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#6b7280', fontWeight:500 }}>Detecting your location...</p>
        <button onClick={() => { setInitialLoad(false); setShowLocPanel(true); }} style={{ color:'#6366f1', background:'none', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600, textDecoration:'underline' }}>
          Skip — enter location manually
        </button>
      </div>
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────────── */
  const mapCenter = userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : {};
  const activeRadius = filters.radius > 0 ? filters.radius : 0;

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <Navbar />

      {/* ── TOP BAR ── */}
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'0.875rem 1.5rem', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', gap:'0.875rem', flexWrap:'wrap' }}>

          {/* Title */}
          <div style={{ flexShrink:0 }}>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#1f2937' }}>Find Workers</h2>
          </div>

          {/* Location chip */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1, minWidth:200 }}>
            {userLocation.lat ? (
              <button onClick={() => setShowLocPanel(!showLocPanel)}
                style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:50, padding:'0.35rem 0.875rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, color:'#166534', whiteSpace:'nowrap' }}>
                <span>📍</span>
                <span>{locationLabel || `${parseFloat(userLocation.lat).toFixed(3)}, ${parseFloat(userLocation.lng).toFixed(3)}`}</span>
                {locationAccuracy && <span style={{ color:'#9ca3af', fontSize:'0.68rem' }}>±{locationAccuracy > 1000 ? `${(locationAccuracy/1000).toFixed(1)}km` : `${locationAccuracy}m`}</span>}
                <span style={{ color:'#9ca3af' }}>✏️</span>
              </button>
            ) : (
              <button onClick={() => setShowLocPanel(true)}
                style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:50, padding:'0.35rem 0.875rem', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, color:'#92400e' }}>
                📍 Set Location
              </button>
            )}
            {locating && <div style={{ width:14, height:14, border:'2px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />}
          </div>

          {/* Search input */}
          <div style={{ flex:2, minWidth:180, maxWidth:320, position:'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search by name or skill..."
              style={{ width:'100%', padding:'0.5rem 2.5rem 0.5rem 0.875rem', border:'1.5px solid #e5e7eb', borderRadius:50, fontSize:'0.875rem', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:'0.9rem', pointerEvents:'none' }}>🔍</span>
          </div>

          {/* Quick filters */}
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>
            <select value={filters.skill} onChange={e => setFilter('skill', e.target.value)}
              style={{ padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer' }}>
              <option value="">All Services</option>
              {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filters.radius} onChange={e => setFilter('radius', parseInt(e.target.value))}
              style={{ padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer' }}>
              {DISTANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white', cursor:'pointer' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button onClick={() => setShowFilters(!showFilters)}
              style={{ padding:'0.45rem 0.875rem', border:`1.5px solid ${showFilters ? '#6366f1' : '#e5e7eb'}`, borderRadius:8, fontSize:'0.82rem', fontWeight:600, cursor:'pointer', background: showFilters ? '#ede9fe' : 'white', color: showFilters ? '#6366f1' : '#374151' }}>
              ⚙️ Filters {Object.values({ a:filters.verifiedOnly, b:filters.topRated, c:filters.minRating > 0, d:filters.minExperience > 0 }).filter(Boolean).length > 0 ? '●' : ''}
            </button>

            <button onClick={doSearch} disabled={loading}
              style={{ padding:'0.45rem 1.25rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* View mode toggle */}
          <div style={{ display:'flex', gap:'0.25rem', background:'#f3f4f6', borderRadius:8, padding:'0.2rem', flexShrink:0 }}>
            {[['split','⊞'],['cards','▦'],['map','🗺']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ padding:'0.3rem 0.6rem', border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.85rem', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#6366f1' : '#9ca3af', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: viewMode === mode ? 700 : 400 }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOCATION PANEL ── */}
      {showLocPanel && (
        <div style={{ background:'#f5f3ff', borderBottom:'1px solid #c4b5fd', padding:'1rem 1.5rem' }}>
          <div style={{ maxWidth:1400, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <p style={{ margin:0, fontWeight:600, color:'#374151', fontSize:'0.875rem' }}>
                {locationDenied ? '📍 Location access denied — enter your area manually' : '📍 Set your search location'}
              </p>
              <button onClick={() => setShowLocPanel(false)} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'1rem' }}>✕</button>
            </div>
            {/* Show warning if GPS accuracy is poor (laptop/WiFi location) */}
            {locationAccuracy && locationAccuracy > 1000 && (
              <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, padding:'0.6rem 0.875rem', marginBottom:'0.75rem', fontSize:'0.82rem', color:'#92400e', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span>⚠️</span>
                <span>Your GPS accuracy is <strong>±{locationAccuracy > 1000 ? `${(locationAccuracy/1000).toFixed(0)}km` : `${locationAccuracy}m`}</strong> — this is too inaccurate (laptop/WiFi location). Please <strong>type your village/area name</strong> below for accurate results.</span>
              </div>
            )}
            <div style={{ maxWidth:560 }}>
              <AddressSearchInput
                value={manualAddr}
                onChange={v => setManualAddr(v)}
                onSelect={loc => {
                  if (loc.latitude && loc.longitude) {
                    setUserLocation({ lat: loc.latitude, lng: loc.longitude });
                    setLocationLabel(loc.city || loc.address?.split(',')[0] || '');
                    setLocationAccuracy(null);
                    setLocationDenied(false);
                    setShowLocPanel(false);
                    toast.success(`Location set to ${loc.city || loc.address}`);
                  }
                }}
                placeholder="Type your village, area or city — e.g. Chichondi Patil..."
              />
            </div>
            {!locationDenied && (
              <button onClick={() => { setShowLocPanel(false); detectLocation(); }}
                style={{ marginTop:'0.75rem', background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, padding:0 }}>
                🎯 Use my current location instead
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ADVANCED FILTERS PANEL ── */}
      {showFilters && (
        <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'1rem 1.5rem' }}>
          <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#9ca3af', textTransform:'uppercase', marginBottom:'0.35rem' }}>Min Rating</label>
              <select value={filters.minRating} onChange={e => setFilter('minRating', parseFloat(e.target.value))}
                style={{ padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white' }}>
                <option value="0">Any</option>
                <option value="3">3+ ⭐</option>
                <option value="4">4+ ⭐</option>
                <option value="4.5">4.5+ ⭐</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#9ca3af', textTransform:'uppercase', marginBottom:'0.35rem' }}>Price Range (₹/hr)</label>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', parseInt(e.target.value)||0)} placeholder="Min" style={{ width:70, padding:'0.45rem 0.5rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none' }} />
                <span style={{ color:'#9ca3af' }}>–</span>
                <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', parseInt(e.target.value)||10000)} placeholder="Max" style={{ width:70, padding:'0.45rem 0.5rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#9ca3af', textTransform:'uppercase', marginBottom:'0.35rem' }}>Experience</label>
              <select value={filters.minExperience} onChange={e => setFilter('minExperience', parseInt(e.target.value))}
                style={{ padding:'0.45rem 0.75rem', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:'0.82rem', outline:'none', background:'white' }}>
                <option value="0">Any</option>
                <option value="1">1+ yrs</option>
                <option value="3">3+ yrs</option>
                <option value="5">5+ yrs</option>
                <option value="10">10+ yrs</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={filters.verifiedOnly} onChange={e => setFilter('verifiedOnly', e.target.checked)} style={{ width:15, height:15 }} />
                ✓ Verified Only
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={filters.availableNow} onChange={e => setFilter('availableNow', e.target.checked)} style={{ width:15, height:15 }} />
                ● Available Now
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={filters.topRated} onChange={e => setFilter('topRated', e.target.checked)} style={{ width:15, height:15 }} />
                ⭐ Top Rated (4.5+)
              </label>
            </div>
            <button onClick={() => setFilters({ skill:'', radius:5000, minRating:0, minPrice:0, maxPrice:10000, minExperience:0, verifiedOnly:false, availableNow:true, minTrust:0, topRated:false })}
              style={{ padding:'0.45rem 0.875rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, maxWidth:1400, margin:'0 auto', width:'100%', padding:'1rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

        {/* Results summary */}
        {searched && !loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
            <p style={{ margin:0, color:'#6b7280', fontSize:'0.875rem' }}>
              <strong style={{ color:'#1f2937' }}>{workers.length}</strong> workers found
              {filters.radius > 0 && userLocation.lat && <span> within <strong>{DISTANCE_OPTIONS.find(o => o.value === filters.radius)?.label || filters.radius + 'm'}</strong></span>}
              {filters.skill && <span> for <strong>{filters.skill}</strong></span>}
            </p>
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
              {workers.filter(w => w.workerProfile?.verificationStatus === 'verified').length > 0 && (
                <Pill bg="#d1fae5" color="#065f46">✓ {workers.filter(w => w.workerProfile?.verificationStatus === 'verified').length} Verified</Pill>
              )}
              {workers.filter(w => w.workerProfile?.rating >= 4.5).length > 0 && (
                <Pill bg="#fef3c7" color="#92400e">⭐ {workers.filter(w => w.workerProfile?.rating >= 4.5).length} Top Rated</Pill>
              )}
            </div>
          </div>
        )}

        {/* Split / Cards / Map views */}
        {viewMode === 'split' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'1.25rem', alignItems:'start' }}>
            {/* Cards column */}
            <div>
              {loading ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ background:'white', borderRadius:16, height:320, animation:'pulse 1.5s infinite', opacity:0.6 }} />
                  ))}
                </div>
              ) : workers.length === 0 ? (
                <div style={{ textAlign:'center', padding:'4rem 2rem', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
                  <h3 style={{ color:'#1f2937', marginBottom:'0.5rem' }}>{searched ? 'No workers found' : 'Search for workers'}</h3>
                  <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>{searched ? 'Try expanding the radius or changing filters.' : 'Set your location and click Search.'}</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
                  {workers.map(w => (
                    <WorkerCard key={w._id} worker={w} isSaved={savedWorkers.includes(w._id)} onSave={toggleSave} onBook={openBookModal} onSelect={setSelectedWorker} isSelected={selectedWorker?._id === w._id} />
                  ))}
                </div>
              )}
            </div>

            {/* Map column — sticky */}
            <div style={{ position:'sticky', top:70, height:'calc(100vh - 90px)' }}>
              <MapComponent
                workers={workers}
                center={mapCenter}
                radius={activeRadius}
                selectedId={selectedWorker?._id}
                onWorkerClick={w => { setSelectedWorker(w); }}
                onBook={openBookModal}
                onLocate={loc => { setUserLocation({ lat: loc.lat, lng: loc.lng }); setLocationAccuracy(loc.accuracy); }}
              />
            </div>
          </div>
        )}

        {viewMode === 'cards' && (
          loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ background:'white', borderRadius:16, height:320, animation:'pulse 1.5s infinite', opacity:0.6 }} />)}
            </div>
          ) : workers.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'white', borderRadius:16 }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
              <h3 style={{ color:'#1f2937' }}>{searched ? 'No workers found' : 'Search for workers'}</h3>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
              {workers.map(w => (
                <WorkerCard key={w._id} worker={w} isSaved={savedWorkers.includes(w._id)} onSave={toggleSave} onBook={openBookModal} onSelect={setSelectedWorker} isSelected={selectedWorker?._id === w._id} />
              ))}
            </div>
          )
        )}

        {viewMode === 'map' && (
          <div style={{ height:'calc(100vh - 200px)', minHeight:500 }}>
            <MapComponent
              workers={workers}
              center={mapCenter}
              radius={activeRadius}
              selectedId={selectedWorker?._id}
              onWorkerClick={w => setSelectedWorker(w)}
              onBook={openBookModal}
              onLocate={loc => { setUserLocation({ lat: loc.lat, lng: loc.lng }); setLocationAccuracy(loc.accuracy); }}
            />
          </div>
        )}
      </div>

      {/* ── BOOKING MODAL ── */}
      {showBookModal && bookTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ color:'#1f2937', fontWeight:700, margin:0 }}>Book {bookTarget.name}</h3>
              <button onClick={() => setShowBookModal(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#9ca3af' }}>✕</button>
            </div>

            {/* Worker summary */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1rem', background:'#f9fafb', borderRadius:12, marginBottom:'1.25rem' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
                {bookTarget.avatar ? <img src={bookTarget.avatar} alt={bookTarget.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : bookTarget.name.charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#1f2937' }}>{bookTarget.name}</div>
                <div style={{ fontSize:'0.78rem', color:'#9ca3af' }}>₹{bookTarget.workerProfile?.hourlyRate}/hr · ⭐ {(bookTarget.workerProfile?.rating||0).toFixed(1)}</div>
              </div>
              {bookTarget.trustScore && (
                <span style={{ background:TRUST_COLORS[bookTarget.trustScore.level]+'15', color:TRUST_COLORS[bookTarget.trustScore.level], padding:'0.2rem 0.6rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700 }}>
                  {TRUST_EMOJIS[bookTarget.trustScore.level]} {bookTarget.trustScore.level}
                </span>
              )}
            </div>

            {/* AI price suggestion */}
            {priceSuggestion && (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'0.875rem', marginBottom:'1.25rem', fontSize:'0.85rem' }}>
                <div style={{ fontWeight:700, color:'#166534', marginBottom:'0.25rem' }}>AI Price Suggestion</div>
                <div style={{ color:'#15803d' }}>{priceSuggestion.tip}</div>
                <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem', color:'#166534' }}>
                  <span>Suggested: <strong>₹{priceSuggestion.suggested}</strong></span>
                  <span>Market avg: <strong>₹{priceSuggestion.marketSuggested}</strong></span>
                </div>
              </div>
            )}

            <form onSubmit={handleBooking} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Service Type *</label>
                <input type="text" value={bookingData.service} onChange={e => setBookingData({...bookingData, service:e.target.value})} required placeholder="e.g. Fan installation, Pipe leak repair" style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Description</label>
                <textarea value={bookingData.description} onChange={e => setBookingData({...bookingData, description:e.target.value})} rows={3} placeholder="Describe your requirements..." style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
              <AddressSearchInput label="Job Location" value={bookingData.jobAddress} onChange={v => setBookingData(p => ({...p, jobAddress:v}))} onSelect={loc => setBookingData(p => ({...p, jobAddress:loc.address, jobLat:loc.latitude, jobLng:loc.longitude}))} placeholder="Where should the worker come?" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Date *</label>
                  <input type="date" value={bookingData.scheduledDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBookingData({...bookingData, scheduledDate:e.target.value})} required style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Time *</label>
                  <input type="time" value={bookingData.scheduledTime} onChange={e => setBookingData({...bookingData, scheduledTime:e.target.value})} required style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Estimated Amount (₹) *</label>
                <input type="number" value={bookingData.amount} onChange={e => setBookingData({...bookingData, amount:e.target.value})} required placeholder={priceSuggestion ? `Suggested: ${priceSuggestion.suggested}` : 'Enter amount'} style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.875rem', fontWeight:600, color:'#374151' }}>
                <input type="checkbox" checked={bookingData.isEmergency} onChange={e => setBookingData({...bookingData, isEmergency:e.target.checked})} />
                Emergency Booking (+₹100 priority fee)
              </label>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Payment Method</label>
                <select value={bookingData.paymentMethod} onChange={e => setBookingData({...bookingData, paymentMethod:e.target.value})} style={{ width:'100%', padding:'0.75rem', border:'2px solid #e5e7eb', borderRadius:8, fontSize:'0.9rem', outline:'none', background:'white' }}>
                  <option value="cash">Cash — Pay after work</option>
                  <option value="upi">UPI — Pay online</option>
                  <option value="online">Card / Net Banking</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="submit" style={{ flex:1, padding:'0.875rem', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'1rem' }}>Confirm Booking</button>
                <button type="button" onClick={() => setShowBookModal(false)} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSearch;
