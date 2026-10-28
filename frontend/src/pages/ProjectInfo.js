import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Reusable mini components ─────────────────────────────────────── */
const Section = ({ title, icon, children, id }) => (
  <div id={id} style={{ background:'white', borderRadius:16, padding:'1.75rem 2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem', border:'1px solid #f3f4f6' }}>
    <h2 style={{ margin:'0 0 1.25rem', fontSize:'1.1rem', fontWeight:800, color:'#1f2937', display:'flex', alignItems:'center', gap:'0.6rem' }}>
      <span style={{ fontSize:'1.3rem' }}>{icon}</span>{title}
    </h2>
    {children}
  </div>
);

const Tag = ({ text, color='#6366f1', bg='#ede9fe' }) => (
  <span style={{ background:bg, color, padding:'0.18rem 0.65rem', borderRadius:50, fontSize:'0.72rem', fontWeight:700, marginRight:'0.35rem', marginBottom:'0.35rem', display:'inline-block', whiteSpace:'nowrap' }}>{text}</span>
);

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
      style={{ background:copied?'#10b981':'#6366f1', color:'white', border:'none', borderRadius:5, padding:'0.15rem 0.5rem', fontSize:'0.68rem', cursor:'pointer', fontWeight:700, marginLeft:'0.4rem', transition:'background 0.2s', flexShrink:0 }}>
      {copied?'✓':'Copy'}
    </button>
  );
};

const FileRow = ({ path, desc, color='#374151' }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:8, marginBottom:'0.3rem', background:'#f9fafb', border:'1px solid #f3f4f6' }}>
    <code style={{ fontSize:'0.75rem', color:'#4f46e5', fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>{path}</code>
    <span style={{ fontSize:'0.75rem', color, lineHeight:1.5 }}>{desc}</span>
  </div>
);

const FolderBlock = ({ title, color, bg, border, children }) => (
  <div style={{ background:bg, border:`2px solid ${border}`, borderRadius:12, padding:'1.1rem 1.25rem', marginBottom:'1rem' }}>
    <div style={{ fontWeight:800, color, fontSize:'0.85rem', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</div>
    {children}
  </div>
);

const StatusOk  = () => <span style={{ background:'#dcfce7', color:'#16a34a', padding:'0.15rem 0.55rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>✅ Working</span>;
const StatusWarn = () => <span style={{ background:'#fff7ed', color:'#c2410c', padding:'0.15rem 0.55rem', borderRadius:50, fontSize:'0.68rem', fontWeight:700 }}>⚠️ Needs Config</span>;

/* ── Main Component ───────────────────────────────────────────────── */
export default function ProjectInfo() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const tabs = [
    { key:'overview',      label:'📋 Overview' },
    { key:'architecture',  label:'🏗️ Architecture' },
    { key:'database',      label:'🗄️ Database' },
    { key:'auth',          label:'🔐 Auth & Security' },
    { key:'backend',       label:'⚙️ Backend Files' },
    { key:'frontend',      label:'🖥️ Frontend Files' },
    { key:'features',      label:'⚡ Features' },
    { key:'credentials',   label:'🔑 Credentials' },
    { key:'status',        label:'✅ Test Results' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{ background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', padding:'2.5rem 1.5rem', textAlign:'center', color:'white' }}>
        <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🏠</div>
        <h1 style={{ margin:'0 0 0.4rem', fontSize:'2.2rem', fontWeight:900 }}>Hyperlocal Jobs</h1>
        <p style={{ margin:'0 0 0.3rem', fontSize:'1rem', opacity:0.85, fontWeight:500 }}>Hyperlocal Job Matching Platform for Skilled Workers</p>
        <p style={{ margin:'0 0 1.25rem', fontSize:'0.85rem', opacity:0.6, fontStyle:'italic' }}>"Your Trusted Local Professional, Just a Click Away"</p>
        <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'1.25rem' }}>
          {['React 18','Node.js','Express','MongoDB','JWT','Razorpay','OpenStreetMap','Leaflet','Twilio','Cloudinary'].map(t=>(
            <span key={t} style={{ background:'rgba(255,255,255,0.12)', padding:'0.25rem 0.75rem', borderRadius:50, fontSize:'0.72rem', fontWeight:600 }}>{t}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/login')} style={{ padding:'0.6rem 1.5rem', background:'white', color:'#4f46e5', border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:'0.875rem' }}>🚀 Launch App</button>
          <button onClick={()=>navigate('/')} style={{ padding:'0.6rem 1.5rem', background:'rgba(255,255,255,0.12)', color:'white', border:'2px solid rgba(255,255,255,0.35)', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>🏠 Home</button>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ background:'white', borderBottom:'2px solid #e5e7eb', position:'sticky', top:0, zIndex:50, overflowX:'auto' }}>
        <div style={{ display:'flex', padding:'0 1rem', minWidth:'max-content' }}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ padding:'0.875rem 1.1rem', border:'none', background:'none', cursor:'pointer', fontWeight:600, fontSize:'0.82rem', color:tab===t.key?'#4f46e5':'#6b7280', borderBottom:tab===t.key?'3px solid #4f46e5':'3px solid transparent', whiteSpace:'nowrap', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1rem' }}>

        {/* ════════════════════════════════ OVERVIEW ════════════════════════════════ */}
        {tab==='overview' && <>
          <Section icon="🎯" title="What is This Project?">
            <p style={{ color:'#374151', lineHeight:1.8, margin:'0 0 1rem', fontSize:'0.9rem' }}>
              <strong>Hyperlocal Jobs</strong> is a full-stack MERN web application that connects customers with verified skilled workers (electricians, plumbers, carpenters, mechanics, tutors, and more) in their local area across India. It provides a complete ecosystem with booking management, secure payments, real-time notifications, dispute resolution, and a powerful admin panel.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.875rem' }}>
              {[
                {icon:'👤', label:'User Roles', value:'3 (Customer / Worker / Admin)'},
                {icon:'🛠️', label:'Services', value:'10+ skill categories'},
                {icon:'📄', label:'Frontend Pages', value:'25 pages'},
                {icon:'⚙️', label:'Backend Controllers', value:'12 controllers'},
                {icon:'🗄️', label:'DB Models', value:'13 MongoDB models'},
                {icon:'🔌', label:'API Endpoints', value:'60+ endpoints'},
                {icon:'🤖', label:'AI Features', value:'5 smart modules'},
                {icon:'🧪', label:'Tests', value:'52/52 passing'},
              ].map(s=>(
                <div key={s.label} style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem', border:'1px solid #e5e7eb', textAlign:'center' }}>
                  <div style={{ fontSize:'1.4rem', marginBottom:'0.25rem' }}>{s.icon}</div>
                  <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>{s.label}</div>
                  <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#1f2937', marginTop:'0.2rem' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon="😤" title="Problems We Solve">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'0.65rem' }}>
              {[
                {p:'Hard to find reliable local workers', s:'Search by skill, location, rating, distance'},
                {p:'No way to verify worker identity', s:'Admin-verified ID with Verified badge'},
                {p:'Unclear, inflated pricing', s:'Itemized transparent payment breakdown'},
                {p:'Workers have no digital presence', s:'Full professional worker profile'},
                {p:'Disputes go unresolved', s:'Structured admin-mediated dispute system'},
                {p:'No receipts or payment records', s:'GST invoice auto-generated after payment'},
                {p:'No real-time tracking', s:'Live location tracking during active jobs'},
                {p:'No communication channel', s:'Per-booking chat + admin messaging'},
              ].map((item,i)=>(
                <div key={i} style={{ background:'#fafafa', borderRadius:10, padding:'0.75rem', border:'1px solid #e5e7eb' }}>
                  <div style={{ fontSize:'0.75rem', color:'#dc2626', fontWeight:600, marginBottom:'0.2rem' }}>❌ {item.p}</div>
                  <div style={{ fontSize:'0.75rem', color:'#16a34a', fontWeight:600 }}>✅ {item.s}</div>
                </div>
              ))}
            </div>
          </Section>
        </>}

        {/* ════════════════════════════════ ARCHITECTURE ════════════════════════════ */}
        {tab==='architecture' && <>
          <Section icon="🏗️" title="System Architecture">
            <div style={{ background:'#0f172a', borderRadius:12, padding:'1.5rem', fontFamily:'monospace', fontSize:'0.78rem', color:'#e2e8f0', lineHeight:1.9, marginBottom:'1.25rem' }}>
              <div style={{ color:'#38bdf8', fontWeight:700, marginBottom:'0.5rem' }}>THREE-TIER ARCHITECTURE</div>
              <div>┌─────────────────────────────────────────────┐</div>
              <div>│  <span style={{color:'#a78bfa'}}>PRESENTATION LAYER</span>  — React 18 (Port 3001) │</div>
              <div>│  25 pages · 9 components · 5 CSS files       │</div>
              <div>│  React Router v6 · Axios · Recharts · Leaflet │</div>
              <div>└─────────────┬───────────────────────────────┘</div>
              <div>              │ HTTP REST API (JSON)</div>
              <div>┌─────────────▼───────────────────────────────┐</div>
              <div>│  <span style={{color:'#34d399'}}>BUSINESS LOGIC LAYER</span> — Node.js (Port 5000) │</div>
              <div>│  Express.js · JWT · bcrypt · Compression      │</div>
              <div>│  15 route files · 12 controllers · 5 utils    │</div>
              <div>└─────────────┬───────────────────────────────┘</div>
              <div>              │ Mongoose ODM</div>
              <div>┌─────────────▼───────────────────────────────┐</div>
              <div>│  <span style={{color:'#fbbf24'}}>DATA LAYER</span> — MongoDB (Port 27017)         │</div>
              <div>│  Database: hyperlocal-jobs                    │</div>
              <div>│  13 collections · Geospatial indexes          │</div>
              <div>└─────────────────────────────────────────────┘</div>
              <div style={{ marginTop:'0.75rem', color:'#94a3b8' }}>External Services:</div>
              <div>  💳 Razorpay → Payment gateway (UPI/Card/Cash)</div>
              <div>  📱 Twilio   → SMS notifications (demo mode)</div>
              <div>  📷 Cloudinary → Image/avatar uploads</div>
              <div>  🗺️ OpenStreetMap + Nominatim → Maps (FREE)</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem' }}>
              {[
                {title:'Frontend Entry Point', color:'#4f46e5', bg:'#ede9fe', items:[
                  'frontend/src/index.js — React DOM render entry',
                  'frontend/src/App.js — Router + all routes + ErrorBoundary',
                  'frontend/src/context/AuthContext.js — Global auth state',
                ]},
                {title:'Backend Entry Point', color:'#059669', bg:'#dcfce7', items:[
                  'backend/server.js — Express app + all middleware + routes',
                  'backend/config/db.js — MongoDB connection',
                  'backend/.env — All environment variables',
                ]},
                {title:'Data Flow', color:'#dc2626', bg:'#fee2e2', items:[
                  'User action → React component → api.js (Axios)',
                  'Axios → Bearer token header → Express route',
                  'Route → auth middleware → controller → model',
                  'MongoDB → controller → JSON response → React state',
                ]},
              ].map(s=>(
                <div key={s.title} style={{ background:s.bg, border:`2px solid ${s.color}20`, borderRadius:12, padding:'1.1rem' }}>
                  <div style={{ fontWeight:800, color:s.color, marginBottom:'0.75rem', fontSize:'0.8rem', textTransform:'uppercase' }}>{s.title}</div>
                  {s.items.map((item,i)=>(
                    <div key={i} style={{ display:'flex', gap:'0.5rem', padding:'0.3rem 0', borderBottom:`1px solid ${s.color}15`, fontSize:'0.75rem', color:'#374151', alignItems:'flex-start' }}>
                      <span style={{ color:s.color, flexShrink:0 }}>→</span>{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          <Section icon="🔄" title="Request Flow — How Auth Works">
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'1.25rem', fontFamily:'monospace', fontSize:'0.78rem', lineHeight:2 }}>
              <div><span style={{color:'#4f46e5',fontWeight:700}}>1. LOGIN</span>  → POST /api/auth/login → bcrypt verify → JWT sign → return token</div>
              <div><span style={{color:'#4f46e5',fontWeight:700}}>2. STORE</span>  → localStorage.setItem('token') + localStorage.setItem('cached_user')</div>
              <div><span style={{color:'#4f46e5',fontWeight:700}}>3. REQUEST</span>→ api.js interceptor adds: Authorization: Bearer &lt;token&gt;</div>
              <div><span style={{color:'#4f46e5',fontWeight:700}}>4. VERIFY</span> → backend/middleware/auth.js → jwt.verify() → req.user = payload</div>
              <div><span style={{color:'#4f46e5',fontWeight:700}}>5. RESPONSE</span>→ Controller uses req.user.id/role to filter data</div>
              <div><span style={{color:'#dc2626',fontWeight:700}}>6. EXPIRE</span> → 401 response → api.js interceptor → clear storage → redirect /login</div>
            </div>
          </Section>
        </>}

        {/* ════════════════════════════════ DATABASE ════════════════════════════════ */}
        {tab==='database' && <>
          <Section icon="🗄️" title="Database Configuration">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem', marginBottom:'1rem' }}>
              {[
                {label:'Type', value:'MongoDB (NoSQL Document DB)', icon:'🍃'},
                {label:'Connection', value:'mongodb://localhost:27017', icon:'🔌'},
                {label:'Database Name', value:'hyperlocal-jobs', icon:'📦'},
                {label:'Port', value:'27017 (default MongoDB)', icon:'🔢'},
                {label:'ODM', value:'Mongoose v8.0', icon:'📐'},
                {label:'Config File', value:'backend/config/db.js', icon:'⚙️'},
                {label:'Env Variable', value:'MONGODB_URI in backend/.env', icon:'🔑'},
                {label:'Collections', value:'13 collections', icon:'🗂️'},
              ].map(s=>(
                <div key={s.label} style={{ background:'#f9fafb', borderRadius:10, padding:'0.875rem', border:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', alignItems:'center' }}>
                  <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#1f2937' }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:'#f0fdf4', border:'1px solid #6ee7b7', borderRadius:10, padding:'0.875rem 1.25rem', marginBottom:'1.25rem' }}>
              <div style={{ fontWeight:700, color:'#065f46', marginBottom:'0.3rem' }}>📍 To connect with MongoDB Compass</div>
              <div style={{ display:'flex', alignItems:'center', fontFamily:'monospace', fontSize:'0.875rem', color:'#1f2937' }}>
                mongodb://localhost:27017 <CopyBtn text="mongodb://localhost:27017" />
              </div>
              <div style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:'0.3rem' }}>Then open database: <strong>hyperlocal-jobs</strong></div>
            </div>
          </Section>

          <Section icon="📊" title="All 13 Database Collections (Models)">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'0.75rem' }}>
              {[
                {file:'models/User.js', collection:'users', desc:'Stores all users — customers, workers, admins. Contains workerProfile nested object with skills, rating, verification, hourlyRate, availability.', indexes:['email (unique)', 'location (2dsphere geo)', 'role']},
                {file:'models/Booking.js', collection:'bookings', desc:'Every service booking with full lifecycle. Contains timeline array, review, payment info, worker location.', indexes:['customer+createdAt', 'worker+createdAt', 'status']},
                {file:'models/Message.js', collection:'messages', desc:'Per-booking chat messages between customer and worker.', indexes:['receiver+isRead', 'sender+receiver']},
                {file:'models/AdminMessage.js', collection:'adminmessages', desc:'Admin-user message threads for platform communication.', indexes:['participants+lastMessageAt']},
                {file:'models/Notification.js', collection:'notifications', desc:'All in-app alerts for all users with type filtering.', indexes:['user+isRead+createdAt']},
                {file:'models/Quote.js', collection:'quotes', desc:'Custom pricing quotes with negotiation history and Q&A.', indexes:['customer+status', 'worker+status']},
                {file:'models/Dispute.js', collection:'disputes', desc:'Disputes between customers and workers with evidence and resolution tracking.', indexes:['raisedBy+createdAt', 'against+createdAt', 'status']},
                {file:'models/SupportTicket.js', collection:'supporttickets', desc:'Customer/worker support tickets with admin messaging and escalation.', indexes:['raisedBy+createdAt', 'status']},
                {file:'models/PaymentTransaction.js', collection:'paymenttransactions', desc:'Full payment records with GST breakdown, invoice numbers, refund tracking.', indexes:['customer', 'worker', 'paidAt']},
                {file:'models/WorkerPayout.js', collection:'workerpayouts', desc:'Worker payout records after commission and tax deductions.', indexes:['worker+createdAt', 'payoutStatus']},
                {file:'models/PlatformSettings.js', collection:'platformsettings', desc:'Configurable platform fee, commission rate, GST rate stored as key-value pairs.', indexes:['key (unique)']},
                {file:'models/WorkerChangeRequest.js', collection:'workerchangerequests', desc:'Admin-initiated profile change requests for workers.', indexes:['worker+status']},
                {file:'models/Review.js', collection:'reviews', desc:'Standalone reviews (also embedded in bookings).', indexes:['worker', 'customer']},
              ].map((m,i)=>(
                <div key={i} style={{ background:'#f9fafb', borderRadius:10, padding:'1rem', border:'1px solid #e5e7eb' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.4rem' }}>
                    <code style={{ fontSize:'0.75rem', fontWeight:800, color:'#4f46e5' }}>{m.file}</code>
                    <Tag text={m.collection} color='#059669' bg='#dcfce7' />
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'#6b7280', margin:'0 0 0.5rem', lineHeight:1.5 }}>{m.desc}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem' }}>
                    {m.indexes.map(idx=><Tag key={idx} text={'idx: '+idx} color='#6b7280' bg='#f3f4f6' />)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>}

        {/* ════════════════════════════════ AUTH & SECURITY ═════════════════════════ */}
        {tab==='auth' && <>
          <Section icon="🔐" title="Authentication System">
            <FolderBlock title="Auth Files" color="#4f46e5" bg="#ede9fe" border="#c4b5fd">
              <FileRow path="backend/middleware/auth.js" desc="JWT token verifier — runs before every protected route. Decodes token, fetches user from DB, attaches to req.user. Also contains adminOnly middleware." />
              <FileRow path="backend/controllers/authController.js" desc="register(), login(), getProfile(), updateProfile(), changePassword() — core auth logic." />
              <FileRow path="backend/routes/auth.js" desc="POST /register, POST /login, GET /profile, PATCH /profile, PATCH /change-password" />
              <FileRow path="frontend/src/context/AuthContext.js" desc="React Context — global user state. Loads from localStorage cache instantly on page load, refreshes from API in background. Provides login(), logout(), register(), refreshUser()." />
              <FileRow path="frontend/src/utils/api.js" desc="Axios instance — auto-adds Bearer token to every request. Auto-redirects to /login on 401." />
            </FolderBlock>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem' }}>
              {[
                {title:'Password Security', color:'#dc2626', items:[
                  'bcryptjs with salt rounds = 10',
                  'Passwords NEVER stored in plain text',
                  'comparePassword() method on User model',
                  'Password excluded from all queries (select: false)',
                ]},
                {title:'JWT Token', color:'#059669', items:[
                  'Token signed with JWT_SECRET from .env',
                  'Expires in 7 days (JWT_EXPIRE=7d)',
                  'Stored in localStorage on frontend',
                  'Cached user data in localStorage (instant load)',
                ]},
                {title:'Role-Based Access', color:'#f59e0b', items:[
                  '3 roles: admin, worker, customer',
                  'adminOnly() middleware blocks non-admins',
                  'Controllers filter data by req.user.role',
                  'Frontend: PrivateRoute redirects unauthenticated',
                ]},
                {title:'Rate Limiting', color:'#8b5cf6', items:[
                  'Auth endpoints: max 20 requests per 15 min',
                  'General API: max 300 requests per 15 min',
                  'Rate limits skipped for localhost in dev',
                  'express-rate-limit package',
                ]},
                {title:'Payment Security', color:'#0ea5e9', items:[
                  'HMAC-SHA256 Razorpay signature verification',
                  'Server-side order creation only',
                  'No payment keys on frontend',
                  'Payment status only set after verified signature',
                ]},
                {title:'Other Security', color:'#374151', items:[
                  'CORS restricted to allowed origins',
                  'gzip compression on all responses',
                  'Input validation via express-validator',
                  'File size limit: 10MB (base64 images)',
                ]},
              ].map(s=>(
                <div key={s.title} style={{ background:'#f9fafb', borderRadius:12, padding:'1.1rem', border:`2px solid ${s.color}20` }}>
                  <div style={{ fontWeight:800, color:s.color, marginBottom:'0.75rem', fontSize:'0.8rem' }}>{s.title}</div>
                  {s.items.map((item,i)=>(
                    <div key={i} style={{ display:'flex', gap:'0.5rem', padding:'0.25rem 0', borderBottom:`1px solid ${s.color}10`, fontSize:'0.75rem', color:'#374151' }}>
                      <span style={{ color:s.color, flexShrink:0 }}>•</span>{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        </>}

        {/* ════════════════════════════════ BACKEND FILES ═══════════════════════════ */}
        {tab==='backend' && <>
          <Section icon="⚙️" title="Backend File Structure">
            <FolderBlock title="📁 backend/ — Root" color="#059669" bg="#f0fdf4" border="#6ee7b7">
              <FileRow path="server.js" desc="Main Express app entry point. Registers all middleware (CORS, gzip, rate-limit, JSON parser) and mounts all 15 route groups. Starts HTTP server on PORT 5000." />
              <FileRow path=".env" desc="All environment variables: MONGODB_URI, JWT_SECRET, JWT_EXPIRE, RAZORPAY keys, TWILIO credentials, CLOUDINARY credentials, ALLOWED_ORIGINS." />
              <FileRow path=".env.example" desc="Template for .env — share this in repo, not .env." />
            </FolderBlock>

            <FolderBlock title="📁 backend/config/" color="#4f46e5" bg="#ede9fe" border="#c4b5fd">
              <FileRow path="config/db.js" desc="MongoDB connection using mongoose.connect(). Logs success/error. Called once at server startup." />
            </FolderBlock>

            <FolderBlock title="📁 backend/middleware/" color="#dc2626" bg="#fee2e2" border="#fca5a5">
              <FileRow path="middleware/auth.js" desc="protect() — verifies JWT token, fetches user from DB, attaches to req.user. adminOnly() — blocks non-admin users with 403. Used on all private routes." />
            </FolderBlock>

            <FolderBlock title="📁 backend/models/ — 13 MongoDB Schemas" color="#f59e0b" bg="#fef3c7" border="#fcd34d">
              <FileRow path="models/User.js" desc="Master user schema for all roles. Contains nested workerProfile{} with skills, rating, verificationStatus, hourlyRate, availability, idDocument, idSelfie. Has comparePassword() method." />
              <FileRow path="models/Booking.js" desc="Full booking lifecycle. Fields: customer, worker, service, status (10 statuses), timeline[], amount, paymentStatus, review{}, workerLocation, isEmergency." />
              <FileRow path="models/Message.js" desc="Per-booking messages. Fields: booking, sender, receiver, message, isRead. Indexed for fast unread count queries." />
              <FileRow path="models/AdminMessage.js" desc="Admin message threads. Fields: participants[], subject, messages[], threadType, isOpen." />
              <FileRow path="models/Notification.js" desc="All alerts. Fields: user, title, message, type (12 types), isRead, actionUrl." />
              <FileRow path="models/Quote.js" desc="Custom quotes with negotiation. Fields: quotedAmount, counterAmount, status, history[], questions[], seenBy[]." />
              <FileRow path="models/Dispute.js" desc="Dispute records. Fields: raisedBy, against, issueType, status (12 statuses), priority, activity[], seenBy[], refundAmount." />
              <FileRow path="models/SupportTicket.js" desc="Support tickets. Fields: raisedBy, subject, category (11 types), priority, status, messages[], adminNotes[]." />
              <FileRow path="models/PaymentTransaction.js" desc="Payment records. Fields: serviceAmount, platformFee, supportFee, urgentFee, taxAmount, totalPaid, invoiceNumber, paymentMethod, paymentStatus." />
              <FileRow path="models/WorkerPayout.js" desc="Worker payouts. Fields: grossAmount, commissionDeduction, taxDeduction, netPayout, payoutStatus, payoutReference." />
              <FileRow path="models/PlatformSettings.js" desc="Key-value store for admin-configurable settings: commission rate, platform fee, GST rate, payout mode." />
              <FileRow path="models/WorkerChangeRequest.js" desc="Admin requests for workers to update their profile. Fields: worker, requestedChanges, status, adminNote." />
              <FileRow path="models/Review.js" desc="Review records. Fields: booking, worker, customer, rating, comment, sentiment." />
            </FolderBlock>

            <FolderBlock title="📁 backend/controllers/ — 12 Business Logic Files" color="#8b5cf6" bg="#f5f3ff" border="#c4b5fd">
              <FileRow path="controllers/authController.js" desc="register(), login(), getProfile(), updateProfile(), changePassword()" />
              <FileRow path="controllers/workerController.js" desc="searchWorkers() — Haversine distance + AI scoring + radius filter. getWorkerById()" />
              <FileRow path="controllers/bookingController.js" desc="createBooking(), getBookings(), updateBookingStatus(), addReview(), getWorkerAnalytics() — LARGEST controller. Full lifecycle with SMS alerts." />
              <FileRow path="controllers/messageController.js" desc="sendMessage(), getMessages(), getConversations(), markRead()" />
              <FileRow path="controllers/adminController.js" desc="getStats(), getWorkers(), getCustomers(), updateWorkerVerification(), getBookings(), toggleSuspend()" />
              <FileRow path="controllers/adminMessageController.js" desc="createThread(), getThreads(), sendMessage(), markRead()" />
              <FileRow path="controllers/notificationController.js" desc="getNotifications(), markAsRead(), markAllAsRead(), getUnreadCounts() — 7 parallel DB queries for badge counts, deleteAll(), createAnnouncement()" />
              <FileRow path="controllers/paymentController.js" desc="createPaymentOrder(), verifyPaymentSignature() — Razorpay integration with HMAC verification and auto-financial record creation." />
              <FileRow path="controllers/financeController.js" desc="getWorkerEarnings(), getCustomerTransactions(), getAdminRevenue(), getAdminProfitAnalytics(), getAdminTaxSummary(), updatePayoutStatus(), exportCSV()" />
              <FileRow path="controllers/quoteController.js" desc="createQuote(), counterQuote(), workerCounter(), approveQuote(), rejectQuote(), askQuestion(), answerQuestion(), adminDecideQuote()" />
              <FileRow path="controllers/disputeController.js" desc="createDispute(), getMyDisputes(), getAllDisputes(), updateDisputeStatus(), addEvidence(), resolveDispute(), suspendUser()" />
              <FileRow path="controllers/supportTicketController.js" desc="createTicket(), getMyTickets(), getAllTickets(), sendMessage(), updateTicket(), escalateTicket(), convertToDispute()" />
              <FileRow path="controllers/profileController.js" desc="updateProfile(), updateLocation(), updateOnlineStatus(), verifyWorker() — admin verification with notification trigger." />
              <FileRow path="controllers/aiController.js" desc="reviewSentiment(), priceFairness(), workerTrustScore(), suspiciousFlags(), reviewAnalytics(), bookingPriceSuggestion()" />
              <FileRow path="controllers/workerChangeRequestController.js" desc="createRequest(), getMyRequests(), updateRequest() — admin-to-worker profile change workflow." />
            </FolderBlock>

            <FolderBlock title="📁 backend/routes/ — 15 Route Files" color="#0ea5e9" bg="#e0f2fe" border="#7dd3fc">
              {[
                {f:'routes/auth.js',desc:'/api/auth — POST /register, POST /login, GET /profile, PATCH /profile, PATCH /change-password'},
                {f:'routes/workers.js',desc:'/api/workers — GET /search (public), GET /:id (protected)'},
                {f:'routes/bookings.js',desc:'/api/bookings — POST /, GET /, GET /:id, PATCH /:id/status, POST /:id/review, GET /analytics/worker'},
                {f:'routes/messages.js',desc:'/api/messages — POST /, GET /:bookingId, GET /conversations, PATCH /read'},
                {f:'routes/profile.js',desc:'/api/profile — PATCH /, PATCH /location, PATCH /online-status, POST /verify/:id/admin'},
                {f:'routes/notifications.js',desc:'/api/notifications — GET /, GET /unread-counts, PATCH /read-all, DELETE /all, POST /announcement'},
                {f:'routes/payments.js',desc:'/api/payments — POST /create-order, POST /verify, GET /summary, POST /demo'},
                {f:'routes/admin.js',desc:'/api/admin — GET /stats, GET /workers, GET /customers, PATCH /workers/:id/verify, GET /bookings'},
                {f:'routes/quotes.js',desc:'/api/quotes — POST /, GET /incoming, GET /my, PATCH /:id/counter, PATCH /:id/approve, GET /admin/review'},
                {f:'routes/disputes.js',desc:'/api/disputes — POST /, GET /my, PATCH /:id/status (admin), POST /:id/evidence, PATCH /:id/resolve'},
                {f:'routes/adminMessages.js',desc:'/api/support — POST /threads, GET /threads/all, POST /threads/:id/message, PATCH /threads/:id/read'},
                {f:'routes/supportTickets.js',desc:'/api/tickets — POST /, GET /my, GET / (admin), POST /:id/messages, PATCH /:id (admin)'},
                {f:'routes/finance.js',desc:'/api/finance — GET /worker/earnings, GET /customer/transactions, GET /admin/profit-analytics, GET /admin/export'},
                {f:'routes/ai.js',desc:'/api/ai — POST /sentiment, GET /price-fairness, GET /suspicious-flags, GET /review-analytics'},
                {f:'routes/workerChangeRequests.js',desc:'/api/worker-requests — POST /, GET /my, PATCH /:id'},
              ].map(r=><FileRow key={r.f} path={r.f} desc={r.desc} />)}
            </FolderBlock>

            <FolderBlock title="📁 backend/utils/ — 5 Utility Files" color="#374151" bg="#f9fafb" border="#d1d5db">
              <FileRow path="utils/aiEngine.js" desc="Custom AI logic: analyzeSentiment() (keyword scoring), analyzePriceFairness() (market rate comparison), calculateTrustScore() (0-100 with levels), detectSuspiciousActivity(), getRecommendationLabel()" />
              <FileRow path="utils/trustScore.js" desc="Extended trust score calculations with breakdown by factor (profile, rating, jobs, disputes, etc.)" />
              <FileRow path="utils/razorpay.js" desc="createOrder() — creates Razorpay payment order. verifyPayment() — HMAC-SHA256 signature verification." />
              <FileRow path="utils/sms.js" desc="sendBookingNotification(), sendAcceptedNotification(), sendOnTheWayNotification(), sendCompletedNotification() — Twilio SMS wrappers. Falls back to demo mode if no credentials." />
              <FileRow path="utils/cloudinary.js" desc="uploadImage() — uploads base64 or file to Cloudinary CDN, returns URL." />
              <FileRow path="utils/profileCompletion.js" desc="calculateProfileCompletion() — returns percentage + missingFields[] + tier + nextStep for the profile completion banner." />
            </FolderBlock>
          </Section>
        </>}

        {/* ════════════════════════════════ FRONTEND FILES ══════════════════════════ */}
        {tab==='frontend' && <>
          <Section icon="🖥️" title="Frontend File Structure">
            <FolderBlock title="📁 frontend/src/ — Root" color="#4f46e5" bg="#ede9fe" border="#c4b5fd">
              <FileRow path="src/index.js" desc="React DOM entry point — renders <App /> into #root. Sets up StrictMode." />
              <FileRow path="src/App.js" desc="Top-level router. Defines ALL 26 routes. Contains ErrorBoundary class, PrivateRoute component, lazy-loaded page imports, ToastContainer setup." />
              <FileRow path="src/App.css" desc="Global styles, spin animation, loading-screen class." />
              <FileRow path="src/index.css" desc="CSS reset and base font/box-sizing styles." />
              <FileRow path="src/admin.css" desc="Admin panel specific styles." />
              <FileRow path="src/landing.css" desc="Landing page styles — hero, features grid, services, footer." />
              <FileRow path="src/messages.css" desc="Chat/messages page styles." />
              <FileRow path="src/service-pages.css" desc="Service and feature detail page styles." />
            </FolderBlock>

            <FolderBlock title="📁 src/context/ — Global State" color="#dc2626" bg="#fee2e2" border="#fca5a5">
              <FileRow path="context/AuthContext.js" desc="THE most important frontend file. Provides: user state (from localStorage cache instantly), login(), logout(), register(), refreshUser(), showSetupPrompt, dismissSetupPrompt(). Token cached in localStorage, user profile cached as JSON." />
            </FolderBlock>

            <FolderBlock title="📁 src/utils/ — Helpers" color="#059669" bg="#dcfce7" border="#6ee7b7">
              <FileRow path="utils/api.js" desc="Pre-configured Axios instance with baseURL=http://localhost:5000/api. Request interceptor adds Bearer token. Response interceptor handles 401 → redirect to /login." />
            </FolderBlock>

            <FolderBlock title="📁 src/components/ — 9 Reusable Components" color="#f59e0b" bg="#fef3c7" border="#fcd34d">
              <FileRow path="components/Navbar.js" desc="Main navigation bar. Shows role-based nav links with unread badge counts. Inline notification dropdown with type filters. Mobile hamburger menu. Avatar → profile." />
              <FileRow path="components/MapComponent.js" desc="Leaflet map with worker pins, user location dot, radius circle, auto-fit bounds. Worker markers show verification badge. Powered by OpenStreetMap (free)." />
              <FileRow path="components/LocationPicker.js" desc="Interactive map for selecting service location. Supports: click-to-pin, drag marker, address search (Nominatim), GPS detect. Reverse geocodes to address string." />
              <FileRow path="components/AddressSearchInput.js" desc="Debounced address autocomplete input using Nominatim API." />
              <FileRow path="components/ProfileCompletionBanner.js" desc="3 variants (banner/compact/checklist). Shows completion % ring, missing fields as chips, next recommended step." />
              <FileRow path="components/TrustScoreCard.js" desc="3 variants (full/compact/mini). Shows score ring, level badge (Bronze→Platinum), factor breakdown bars, improvement tips panel." />
              <FileRow path="components/ChatbotWidget.js" desc="Floating AI chatbot widget (bottom-right). Answers platform FAQ questions." />
              <FileRow path="components/ProfileSetupPrompt.js" desc="Modal shown to new users after registration to complete their profile." />
              <FileRow path="components/AdminMapPanel.js" desc="Admin view of all worker locations on a map." />
              <FileRow path="components/ReviewSummaryCard.js" desc="Displays aggregated worker review stats with star distribution." />
              <FileRow path="components/VerifiedBadge.js" desc="Small verified checkmark badge component." />
              <FileRow path="components/DashboardLayout.js" desc="Reusable layout wrapper for dashboard pages." />
              <FileRow path="components/DesignSystem.js" desc="Shared design tokens and reusable UI primitives." />
            </FolderBlock>

            <FolderBlock title="📁 src/pages/ — 25 Page Components" color="#8b5cf6" bg="#f5f3ff" border="#c4b5fd">
              {[
                {f:'pages/Landing.js', r:'/', d:'Public home page. Features grid, services, how-it-works, FAQ, footer. Uses React Router Link for SPA navigation.'},
                {f:'pages/Login.js', r:'/login', d:'Login form with CAPTCHA simulation. Redirects admin→/admin, others→/dashboard after auth.'},
                {f:'pages/Register.js', r:'/register', d:'Registration with role selection (Customer/Worker), location picker, worker skill fields.'},
                {f:'pages/Dashboard.js', r:'/dashboard', d:'Smart router — renders CustomerDashboard or WorkerDashboard based on role. Redirects admin to /admin instantly.'},
                {f:'pages/AdminDashboard.js', r:'/admin', d:'Full admin control panel. Tabs: Overview, Workers, Customers, Bookings, Disputes, Tickets, Messages, Payments, Notifications, AI, Finance.'},
                {f:'pages/AdminFinance.js', r:'/admin/finance', d:'Dedicated finance page. Revenue, payout management, profit analytics, tax summary, CSV export, platform settings.'},
                {f:'pages/AdminProfile.js', r:'/admin/profile', d:'Admin account profile management.'},
                {f:'pages/AdminSetup.js', r:'/admin-setup', d:'First-time admin account creation page.'},
                {f:'pages/WorkerSearch.js', r:'/search', d:'Worker discovery with map + list view. Filters: skill, radius, rating, price, availability. AI recommendation labels.'},
                {f:'pages/Bookings.js', r:'/bookings', d:'Booking management for customers and workers. Timeline view, status updates, payment modal, invoice, reviews.'},
                {f:'pages/Messages.js', r:'/messages', d:'Chat interface. Per-booking conversation threads + admin message threads.'},
                {f:'pages/Profile.js', r:'/profile', d:'Full profile editor. Avatar upload, skills, location picker, ID verification upload, trust score, availability toggle.'},
                {f:'pages/QuotePage.js', r:'/quotes', d:'Quote management. View received/sent quotes, counter-offer, approve/reject, Q&A.'},
                {f:'pages/DisputePage.js', r:'/disputes', d:'Dispute center. Raise new disputes, track status, submit evidence, view resolution.'},
                {f:'pages/SupportTickets.js', r:'/support', d:'Support ticketing. Create tickets, chat with admin, track status, view history.'},
                {f:'pages/WorkerEarnings.js', r:'/earnings', d:'Worker financial dashboard. Total earnings, pending payouts, monthly chart, payout history.'},
                {f:'pages/CustomerFinance.js', r:'/my-payments', d:'Customer payment history. All transactions, invoices, monthly spending chart.'},
                {f:'pages/Notifications.js', r:'/notifications', d:'Full notifications center. Filter by type, mark read, delete.'},
                {f:'pages/WorkerRequests.js', r:'/worker-requests', d:'Admin change request tracking for workers.'},
                {f:'pages/AboutUs.js', r:'/about', d:'About the platform and team.'},
                {f:'pages/ContactUs.js', r:'/contact', d:'Contact form and support details.'},
                {f:'pages/ServicePage.js', r:'/service/:service', d:'Dynamic service detail page (electrician, plumber, etc.).'},
                {f:'pages/FeaturePage.js', r:'/feature/:feature', d:'Dynamic feature detail page (payments, map, chat, etc.).'},
                {f:'pages/ProjectInfo.js', r:'/project-info', d:'This page — full project documentation with architecture, DB, auth, all file locations.'},
              ].map(p=>(
                <div key={p.f} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:8, marginBottom:'0.3rem', background:'#f9fafb', border:'1px solid #f3f4f6' }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                      <code style={{ fontSize:'0.72rem', color:'#4f46e5', fontWeight:700 }}>{p.f}</code>
                      <Tag text={p.r} color='#059669' bg='#dcfce7' />
                    </div>
                    <div style={{ fontSize:'0.73rem', color:'#6b7280', marginTop:'0.2rem', lineHeight:1.4 }}>{p.d}</div>
                  </div>
                  <button onClick={()=>navigate(p.r.replace(':service','electrician').replace(':feature','location-search'))}
                    style={{ background:'#ede9fe', color:'#4f46e5', border:'none', borderRadius:6, padding:'0.2rem 0.5rem', fontSize:'0.68rem', cursor:'pointer', fontWeight:700, flexShrink:0 }}>
                    Open →
                  </button>
                </div>
              ))}
            </FolderBlock>
          </Section>
        </>}

        {/* ════════════════════════════════ FEATURES ════════════════════════════════ */}
        {tab==='features' && <>
          {[
            { role:'Customer', icon:'👤', color:'#4f46e5', bg:'#ede9fe', features:[
              '🔍 Search workers by skill, location, rating, price range',
              '🗺️ Live interactive map showing verified workers nearby',
              '📋 Book workers with scheduling and service description',
              '📍 Real-time worker location tracking during active jobs',
              '💬 Per-booking chat with workers',
              '💳 Secure Razorpay payment — UPI/Card/Cash with GST invoice',
              '⭐ Rate and review after job completion with sentiment analysis',
              '🏷️ Request and negotiate custom price quotes',
              '⚠️ Raise disputes with evidence submission',
              '🎫 Submit support tickets for any issue',
              '🏅 Loyalty points: ₹10 = 1 point, redeemable on bookings',
              '📊 Full payment history, spending charts, invoice download',
              '🔔 Real-time notifications for every booking update',
            ]},
            { role:'Worker', icon:'👷', color:'#059669', bg:'#dcfce7', features:[
              '🏠 Professional profile: skills, bio, hourly rate, portfolio',
              '📍 Discovered by nearby customers on map',
              '📊 Dashboard: earnings, active jobs, rating, reviews',
              '💰 Transparent payout: gross − commission − tax = net',
              '🟢 Online/Offline availability toggle',
              '📝 Respond to custom quote requests, negotiate price',
              '🆔 Submit ID document + selfie for verification badge',
              '📈 Monthly earnings chart and payout history',
              '💬 Message customers and admin directly',
              '📱 SMS notification on every new booking',
              '🏆 Trust score with level (Bronze→Platinum) and tips',
              '🔔 Change request alerts from admin',
            ]},
            { role:'Admin', icon:'🛡️', color:'#dc2626', bg:'#fee2e2', features:[
              '👥 Full user management — customers and workers',
              '✅ Worker ID verification — approve/reject with reason',
              '📊 Financial analytics — revenue, profit, GST, payouts',
              '⚠️ Dispute resolution with mediation tools',
              '🎫 Support ticket handling and escalation',
              '📢 Platform-wide announcements to all/role users',
              '⚙️ Configure: commission %, platform fee, GST rate, payout mode',
              '📥 CSV export: transactions, payouts, tax reports',
              '🤖 AI suspicious activity detection and flags',
              '💬 Direct message threads with any user',
              '📋 View and manage all bookings across platform',
              '🏷️ Review flagged quotes needing approval',
            ]},
          ].map(section=>(
            <Section key={section.role} icon={section.icon} title={`${section.role} Features`}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0.45rem' }}>
                {section.features.map((f,i)=>(
                  <div key={i} style={{ padding:'0.55rem 0.875rem', background:section.bg, borderRadius:8, fontSize:'0.78rem', fontWeight:500, color:'#374151', border:`1px solid ${section.color}20` }}>{f}</div>
                ))}
              </div>
            </Section>
          ))}
        </>}

        {/* ════════════════════════════════ CREDENTIALS ═════════════════════════════ */}
        {tab==='credentials' && <>
          <Section icon="🔑" title="Demo Login Credentials">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                {role:'Admin', email:'admin@test.com', pass:'admin123', color:'#4f46e5', bg:'#ede9fe', icon:'🛡️', path:'/admin'},
                {role:'Customer', email:'rahul@example.com', pass:'password123', color:'#059669', bg:'#dcfce7', icon:'👤', path:'/dashboard'},
                {role:'Worker', email:'suresh.electric@example.com', pass:'password123', color:'#f59e0b', bg:'#fef3c7', icon:'👷', path:'/dashboard'},
              ].map(c=>(
                <div key={c.role} style={{ background:c.bg, border:`2px solid ${c.color}30`, borderRadius:14, padding:'1.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.875rem' }}>
                    <span style={{ fontSize:'1.5rem' }}>{c.icon}</span>
                    <span style={{ fontWeight:800, color:c.color, fontSize:'1rem' }}>{c.role}</span>
                  </div>
                  <div style={{ marginBottom:'0.5rem' }}>
                    <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', marginBottom:'0.15rem' }}>Email</div>
                    <div style={{ display:'flex', alignItems:'center', fontFamily:'monospace', fontSize:'0.82rem', fontWeight:600, background:'white', padding:'0.3rem 0.6rem', borderRadius:6 }}>
                      {c.email}<CopyBtn text={c.email}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:'0.875rem' }}>
                    <div style={{ fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', marginBottom:'0.15rem' }}>Password</div>
                    <div style={{ display:'flex', alignItems:'center', fontFamily:'monospace', fontSize:'0.82rem', fontWeight:600, background:'white', padding:'0.3rem 0.6rem', borderRadius:6 }}>
                      {c.pass}<CopyBtn text={c.pass}/>
                    </div>
                  </div>
                  <button onClick={()=>navigate(c.path)} style={{ width:'100%', padding:'0.55rem', background:c.color, color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:'0.85rem' }}>
                    Login as {c.role} →
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section icon="👥" title="All Test Accounts (password: password123 for all except admin)">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:550 }}>
                <thead>
                  <tr style={{ background:'#f9fafb' }}>
                    {['Role','Name','Email','Skill / Notes'].map(h=>(
                      <th key={h} style={{ padding:'0.65rem 0.875rem', textAlign:'left', fontSize:'0.65rem', color:'#9ca3af', fontWeight:700, textTransform:'uppercase', borderBottom:'2px solid #f3f4f6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Admin','Admin User','admin@test.com','admin123 — Full platform access'],
                    ['Customer','Rahul Sharma','rahul@example.com','Kothrud, Pune'],
                    ['Customer','Priya Patel','priya@example.com','Viman Nagar, Pune'],
                    ['Customer','Amit Desai','amit@example.com','Hadapsar, Pune'],
                    ['Customer','Sneha Kulkarni','sneha@example.com','Baner, Pune'],
                    ['Worker','Suresh Electrician','suresh.electric@example.com','Electrician ⭐4.8 — Pune'],
                    ['Worker','Manoj Plumber','manoj.plumber@example.com','Plumber ⭐4.6 — Pune'],
                    ['Worker','Ravi Carpenter','ravi.carpenter@example.com','Carpenter ⭐4.9 — Pune'],
                    ['Worker','Deepak Mechanic','deepak.mechanic@example.com','Mechanic ⭐4.7 — Pune'],
                    ['Worker','Anita Tutor','anita.tutor@example.com','Tutor ⭐4.9 — Pune'],
                    ['Worker','Vijay Painter','vijay.painter@example.com','Painter ⭐4.5 — Pune'],
                    ['Worker','Kavita Cleaner','kavita.cleaner@example.com','Cleaner ⭐4.7 — Pune'],
                    ['Worker','Nikhil AC Tech','nikhil.ac@example.com','AC Tech — Pending verify'],
                    ['Worker','Rakesh Electrician','rakesh.electric@nagar.com','Electrician — Ahmednagar'],
                    ['Worker','Suresh Kolhapur','suresh.electric@kolhapur.com','Electrician — Kolhapur'],
                    ['Worker','Rajendra Carpenter','rajendra.carpenter@kolhapur.com','Carpenter ⭐5.0 — Kolhapur'],
                    ['Worker','Rajesh Electric','rajesh.electric@mumbai.com','Electrician — Mumbai'],
                    ['Worker','Karthik Electric','karthik.electric@bangalore.com','Electrician — Bengaluru'],
                  ].map(([role,name,email,note],i)=>(
                    <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background='white'} style={{ borderBottom:'1px solid #f9fafb' }}>
                      <td style={{ padding:'0.6rem 0.875rem' }}>
                        <Tag text={role} color={role==='Admin'?'#4f46e5':role==='Customer'?'#059669':'#f59e0b'} bg={role==='Admin'?'#ede9fe':role==='Customer'?'#dcfce7':'#fef3c7'} />
                      </td>
                      <td style={{ padding:'0.6rem 0.875rem', fontWeight:600, color:'#1f2937', fontSize:'0.82rem' }}>{name}</td>
                      <td style={{ padding:'0.6rem 0.875rem', fontFamily:'monospace', fontSize:'0.75rem', color:'#374151' }}>{email}<CopyBtn text={email}/></td>
                      <td style={{ padding:'0.6rem 0.875rem', fontSize:'0.75rem', color:'#6b7280' }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section icon="🌍" title="Workers Added — 19 Cities Across India">
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {['Ahmednagar','Pune','Satara','Sangli','Kolhapur','Paithan','Shrigonda','Chichodi','Mumbai','Nashik','Chhatrapati Sambhajinagar','Nagpur','New Delhi','Bengaluru','Hyderabad','Chennai','Ahmedabad','Jaipur','Kolkata'].map(city=>(
                <Tag key={city} text={city} color='#059669' bg='#dcfce7' />
              ))}
            </div>
            <p style={{ margin:'0.75rem 0 0', fontSize:'0.78rem', color:'#6b7280' }}>72 workers added across all cities. All with password: <strong>password123</strong></p>
          </Section>
        </>}

        {/* ════════════════════════════════ TEST RESULTS ════════════════════════════ */}
        {tab==='status' && <>
          <Section icon="✅" title="End-to-End Test Results — 52/52 PASS">
            <div style={{ background:'#f0fdf4', border:'1px solid #6ee7b7', borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <span style={{ fontSize:'2rem' }}>🎉</span>
              <div>
                <div style={{ fontWeight:800, color:'#065f46', fontSize:'1rem' }}>52 / 52 API Tests Passing</div>
                <div style={{ fontSize:'0.78rem', color:'#16a34a' }}>All endpoints tested across Admin, Customer and Worker roles</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'0.6rem' }}>
              {[
                ['Auth — Login all 3 roles','✅',3,'JWT + bcrypt'],
                ['Profile — all 3 roles','✅',3,'GET /auth/profile'],
                ['Workers — search by skill + lat/lng','✅',7,'Haversine + AI scoring'],
                ['Bookings — admin, customer, worker','✅',5,'Full lifecycle'],
                ['Notifications — unread counts + list','✅',4,'7 parallel DB queries'],
                ['Quotes — admin, incoming, my','✅',3,'Counter-offer flow'],
                ['Disputes — admin, customer, worker','✅',3,'Evidence + resolution'],
                ['Support Tickets — all roles','✅',3,'Categories + priority'],
                ['Messages — conversations + admin threads','✅',2,'Per-booking chat'],
                ['Admin — stats, workers, customers, verify','✅',5,'Full admin panel'],
                ['Finance — earnings, transactions, analytics','✅',7,'Revenue + GST + payout'],
                ['Payments — summary','✅',1,'Razorpay flow'],
                ['AI Engine — flags, fairness, analytics','✅',4,'Custom AI engine'],
                ['Worker Change Requests','✅',1,'Admin→Worker flow'],
                ['Server Health Check','✅',1,'/health endpoint'],
                ['SMS (Twilio)','⚠️',0,'Demo mode — add credentials'],
                ['Image Upload (Cloudinary)','⚠️',0,'Add credentials in .env'],
                ['Live Razorpay Payments','⚠️',0,'Add real keys in .env'],
              ].map(([module,status,count,note],i)=>(
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.6rem', padding:'0.75rem', background:status==='✅'?'#f9fafb':'#fff7ed', borderRadius:10, border:`1px solid ${status==='✅'?'#e5e7eb':'#fed7aa'}` }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>{status}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#1f2937', fontSize:'0.82rem' }}>{module}</div>
                    <div style={{ fontSize:'0.7rem', color:'#6b7280', marginTop:'0.1rem' }}>{count>0?`${count} tests — `:''}{note}</div>
                  </div>
                  {status==='✅'?<StatusOk/>:<StatusWarn/>}
                </div>
              ))}
            </div>
          </Section>

          <Section icon="🔧" title="Environment Variables (.env)">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'0.65rem' }}>
              {[
                {key:'PORT', val:'5000', status:'ok', desc:'Backend server port'},
                {key:'MONGODB_URI', val:'mongodb://localhost:27017/hyperlocal-jobs', status:'ok', desc:'MongoDB connection string'},
                {key:'JWT_SECRET', val:'hyperlocal_jobs_secret_key_2024', status:'ok', desc:'JWT signing secret'},
                {key:'JWT_EXPIRE', val:'7d', status:'ok', desc:'Token expiry duration'},
                {key:'RAZORPAY_KEY_ID', val:'your_razorpay_key_id', status:'warn', desc:'Add real key for live payments'},
                {key:'RAZORPAY_KEY_SECRET', val:'your_razorpay_key_secret', status:'warn', desc:'Add real secret for live payments'},
                {key:'TWILIO_ACCOUNT_SID', val:'ACxxxxxxxx...', status:'warn', desc:'Add for real SMS notifications'},
                {key:'TWILIO_AUTH_TOKEN', val:'your_twilio_auth_token', status:'warn', desc:'Add for real SMS'},
                {key:'TWILIO_PHONE_NUMBER', val:'+1234567890', status:'warn', desc:'Your Twilio sender number'},
                {key:'CLOUDINARY_CLOUD_NAME', val:'your_cloud_name', status:'warn', desc:'Add for avatar/photo uploads'},
                {key:'CLOUDINARY_API_KEY', val:'your_api_key', status:'warn', desc:'Cloudinary API key'},
                {key:'CLOUDINARY_API_SECRET', val:'your_api_secret', status:'warn', desc:'Cloudinary API secret'},
              ].map((env,i)=>(
                <div key={i} style={{ padding:'0.75rem', background:env.status==='ok'?'#f0fdf4':'#fff7ed', borderRadius:10, border:`1px solid ${env.status==='ok'?'#6ee7b7':'#fed7aa'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
                    <code style={{ fontWeight:700, color:'#1f2937', fontSize:'0.78rem' }}>{env.key}</code>
                    {env.status==='ok'?<StatusOk/>:<StatusWarn/>}
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'#4f46e5', background:'white', padding:'0.2rem 0.5rem', borderRadius:4, marginBottom:'0.25rem', wordBreak:'break-all' }}>{env.val}</div>
                  <div style={{ fontSize:'0.7rem', color:'#6b7280' }}>{env.desc}</div>
                </div>
              ))}
            </div>
          </Section>
        </>}

      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'2rem', color:'#9ca3af', fontSize:'0.78rem', borderTop:'2px solid #e5e7eb', marginTop:'1rem', background:'white' }}>
        <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>🏠</div>
        <p style={{ margin:'0 0 0.3rem', fontWeight:800, color:'#1f2937', fontSize:'0.9rem' }}>Hyperlocal Jobs Platform</p>
        <p style={{ margin:'0 0 0.3rem' }}>Built with React 18 + Node.js + MongoDB + OpenStreetMap + Razorpay</p>
        <p style={{ margin:'0 0 0.3rem' }}>Backend: <code style={{color:'#4f46e5'}}>localhost:5000</code> &nbsp;|&nbsp; Frontend: <code style={{color:'#4f46e5'}}>localhost:3001</code> &nbsp;|&nbsp; DB: <code style={{color:'#4f46e5'}}>localhost:27017/hyperlocal-jobs</code></p>
        <p style={{ margin:'0.5rem 0 0' }}>Built by <strong>Ashwini Lokhande</strong> &nbsp;|&nbsp; 📞 8767823948 &nbsp;|&nbsp; 📧 contact@ansoftio.com &nbsp;|&nbsp; 🌐 ansoftio.com</p>
      </div>
    </div>
  );
}
