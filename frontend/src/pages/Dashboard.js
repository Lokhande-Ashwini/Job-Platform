import React,{useEffect,useState,useCallback}from 'react';
import{useNavigate,Navigate}from 'react-router-dom';
import{useAuth}from '../context/AuthContext';
import{toast}from 'react-toastify';
import{BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from 'recharts';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import TrustScoreCard from '../components/TrustScoreCard';
import api from '../utils/api';

const getGreeting=()=>{const h=new Date().getHours();if(h<12)return 'Good morning';if(h<17)return 'Good afternoon';return 'Good evening';}; // eslint-disable-line
const fmtDate=()=>new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); // eslint-disable-line
const MONTH_NAMES=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; // eslint-disable-line
const STATUS_CFG={requested:{bg:'#ede9fe',color:'#6366f1',label:'Requested'},accepted:{bg:'#dbeafe',color:'#2563eb',label:'Accepted'},rejected:{bg:'#fee2e2',color:'#dc2626',label:'Rejected'},'on-the-way':{bg:'#fef3c7',color:'#ca8a04',label:'On The Way'},arrived:{bg:'#fef9c3',color:'#a16207',label:'Arrived'},'in-progress':{bg:'#ede9fe',color:'#7c3aed',label:'In Progress'},'waiting-for-payment':{bg:'#fff7ed',color:'#c2410c',label:'Awaiting Payment'},completed:{bg:'#dcfce7',color:'#16a34a',label:'Completed'},cancelled:{bg:'#f3f4f6',color:'#6b7280',label:'Cancelled'},disputed:{bg:'#fef2f2',color:'#991b1b',label:'Disputed'},pending:{bg:'#ede9fe',color:'#6366f1',label:'Requested'}};
const StatusBadge=({status})=>{const s=STATUS_CFG[status]||{bg:'#f3f4f6',color:'#6b7280',label:status||''};return<span style={{background:s.bg,color:s.color,padding:'0.18rem 0.6rem',borderRadius:50,fontSize:'0.72rem',fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>;};
const KpiCard=React.memo(({icon,label,value,sub,color})=>(<div style={{background:'white',borderRadius:16,padding:'1.25rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)',borderLeft:'4px solid '+color,display:'flex',alignItems:'center',gap:'0.875rem'}}><div style={{width:46,height:46,borderRadius:12,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',flexShrink:0}}>{icon}</div><div><div style={{fontSize:'1.5rem',fontWeight:800,color:'#1f2937',lineHeight:1}}>{value}</div><div style={{fontSize:'0.72rem',fontWeight:600,color:'#9ca3af',marginTop:'0.15rem',textTransform:'uppercase',letterSpacing:'0.4px'}}>{label}</div>{sub&&<div style={{fontSize:'0.7rem',color:'#9ca3af',marginTop:'0.1rem'}}>{sub}</div>}</div></div>));
const Spinner=()=>(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc'}}><div style={{textAlign:'center'}}><div style={{width:44,height:44,border:'4px solid #e5e7eb',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 1rem'}}></div><p style={{color:'#9ca3af'}}>Loading...</p></div></div>);
const Av=({user,size=36})=>(user?.avatar?<img src={user.avatar} alt={user?.name} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}}/>:<div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:size*0.38}}>{user?.name?.[0]||'?'}</div>);
const SBtn=({icon,label,active,badge,onClick,open})=>(<button onClick={onClick} style={{width:'100%',display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1.25rem',background:active?'rgba(99,102,241,0.28)':'transparent',border:'none',cursor:'pointer',color:active?'#a5b4fc':'#94a3b8',fontWeight:active?600:400,fontSize:'0.875rem',textAlign:'left',borderLeft:active?'3px solid #6366f1':'3px solid transparent',transition:'all 0.2s',position:'relative'}} onMouseEnter={e=>{if(!active){e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.color='#c7d2fe';}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8';}}}><span style={{fontSize:'1.1rem',flexShrink:0}}>{icon}</span>{open&&<span style={{whiteSpace:'nowrap',flex:1}}>{label}</span>}{open&&badge>0&&<span style={{background:'#ef4444',color:'white',borderRadius:50,padding:'0.05rem 0.45rem',fontSize:'0.62rem',fontWeight:700,flexShrink:0}}>{badge>9?'9+':badge}</span>}{!open&&badge>0&&<span style={{position:'absolute',top:6,right:6,width:8,height:8,background:'#ef4444',borderRadius:'50%'}}/>}</button>);

const CTABS=[{key:'overview',icon:'📊',label:'Overview'},{key:'bookings',icon:'📋',label:'My Bookings',r:'/bookings'},{key:'search',icon:'🔍',label:'Find Workers',r:'/search'},{key:'quotes',icon:'🏷️',label:'Quotes',r:'/quotes'},{key:'messages',icon:'💬',label:'Messages',r:'/messages'},{key:'payments',icon:'💳',label:'Payments',r:'/my-payments'},{key:'support',icon:'🎫',label:'Support',r:'/support'},{key:'disputes',icon:'⚠️',label:'Disputes',r:'/disputes'},{key:'notifications',icon:'🔔',label:'Notifications',r:'/notifications'},{key:'profile',icon:'👤',label:'Profile',r:'/profile'}];
const WTABS=[{key:'overview',icon:'📊',label:'Overview'},{key:'bookings',icon:'📋',label:'My Bookings',r:'/bookings'},{key:'quotes',icon:'🏷️',label:'Quotes',r:'/quotes'},{key:'messages',icon:'💬',label:'Messages',r:'/messages'},{key:'earnings',icon:'💰',label:'Earnings',r:'/earnings'},{key:'support',icon:'🎫',label:'Support',r:'/support'},{key:'requests',icon:'📝',label:'Change Requests',r:'/worker-requests'},{key:'disputes',icon:'⚠️',label:'Disputes',r:'/disputes'},{key:'notifications',icon:'🔔',label:'Notifications',r:'/notifications'},{key:'profile',icon:'👤',label:'Profile',r:'/profile'}];

const Sidebar=({tabs,open,setOpen,getBadge,onNav,user,logout,roleLabel,gradient})=>(
  <aside style={{width:open?240:64,background:'#1e1b4b',transition:'width 0.3s',flexShrink:0,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,height:'100vh',overflowY:'auto',overflowX:'hidden',zIndex:100}}>
    <div onClick={()=>setOpen(!open)} style={{padding:'1.25rem',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',gap:'0.75rem',cursor:'pointer',flexShrink:0}}>
      <div style={{width:36,height:36,background:'rgba(255,255,255,0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>🏠</div>
      {open&&<div><div style={{color:'white',fontWeight:700,fontSize:'0.95rem',whiteSpace:'nowrap'}}>Hyperlocal Jobs</div><div style={{color:'#a5b4fc',fontSize:'0.7rem'}}>{roleLabel}</div></div>}
    </div>
    <nav style={{flex:1,padding:'0.5rem 0'}}>
      {tabs.map(t=><SBtn key={t.key} icon={t.icon} label={t.label} active={false} badge={getBadge(t.key)} open={open} onClick={()=>onNav(t)}/>)}
    </nav>
    <div style={{padding:'0.75rem',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
      <button onClick={logout} style={{width:'100%',padding:'0.6rem',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#fca5a5',cursor:'pointer',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:open?'flex-start':'center',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.3)';e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.15)';e.currentTarget.style.color='#fca5a5';}}>
        <span>🚪</span>{open&&'Logout'}
      </button>
    </div>
  </aside>
);

const Topbar=({title,subtitle,totalUnread,user,logout,navigate,dropOpen,setDropOpen,roleLabel})=>(
  <div style={{background:'white',padding:'0.875rem 1.75rem',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 4px rgba(0,0,0,0.05)',flexShrink:0}}>
    <div><h1 style={{margin:0,fontSize:'1.15rem',fontWeight:700,color:'#1f2937'}}>{title}</h1><p style={{margin:0,fontSize:'0.75rem',color:'#9ca3af'}}>{subtitle}</p></div>
    <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
      <button onClick={()=>navigate('/notifications')} style={{position:'relative',background:'#f3f4f6',border:'none',borderRadius:10,width:38,height:38,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>
        {String.fromCodePoint(0x1F514)}{totalUnread>0&&<span style={{position:'absolute',top:-3,right:-3,background:'#ef4444',color:'white',borderRadius:'50%',width:16,height:16,fontSize:'0.6rem',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{totalUnread>9?'9+':totalUnread}</span>}
      </button>
      <div style={{position:'relative'}}>
        <div onClick={()=>setDropOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',padding:'0.35rem 0.75rem',borderRadius:10,background:'#f9fafb',border:'1px solid #e5e7eb'}}>
          <Av user={user} size={30}/><div><div style={{fontSize:'0.82rem',fontWeight:600,color:'#1f2937'}}>{user?.name?.split(' ')[0]}</div><div style={{fontSize:'0.65rem',color:'#9ca3af'}}>{roleLabel}</div></div><span style={{color:'#9ca3af',fontSize:'0.7rem'}}>v</span>
        </div>
        {dropOpen&&(<><div onClick={()=>setDropOpen(false)} style={{position:'fixed',inset:0,zIndex:98}}/><div style={{position:'absolute',top:46,right:0,background:'white',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.15)',border:'1px solid #e5e7eb',minWidth:180,zIndex:99,overflow:'hidden'}}><div style={{padding:'0.75rem 1rem',borderBottom:'1px solid #f3f4f6',background:'#f9fafb'}}><div style={{fontWeight:700,color:'#1f2937',fontSize:'0.875rem'}}>{user?.name}</div><div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{roleLabel}</div></div><button onClick={()=>{navigate('/profile');setDropOpen(false);}} style={{width:'100%',padding:'0.65rem 1rem',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontSize:'0.82rem',color:'#374151',display:'flex',alignItems:'center',gap:'0.6rem'}} onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background='none'}>Profile</button><div style={{borderTop:'1px solid #f3f4f6'}}><button onClick={logout} style={{width:'100%',padding:'0.65rem 1rem',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontSize:'0.82rem',color:'#ef4444',fontWeight:600,display:'flex',alignItems:'center',gap:'0.6rem'}} onMouseEnter={e=>e.currentTarget.style.background='#fff5f5'} onMouseLeave={e=>e.currentTarget.style.background='none'}>Logout</button></div></div></>)}
      </div>
    </div>
  </div>
);

const CustomerDashboard=()=>{
  const{user,logout}=useAuth();const navigate=useNavigate();
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[dropOpen,setDropOpen]=useState(false);
  const[bookings,setBookings]=useState([]);
  const[profile,setProfile]=useState({});
  const[unread,setUnread]=useState({});
  const[loading,setLoading]=useState(true);
  const fetchData=useCallback(async()=>{
    try{
      // Fetch bookings first (most important), then profile/unread in background
      const bRes=await api.get('/bookings?limit=20');
      setBookings(bRes.data||[]);
      setLoading(false); // show UI immediately after bookings load
      const[pRes,uRes]=await Promise.all([api.get('/auth/profile').catch(()=>({data:{}})),api.get('/notifications/unread-counts').catch(()=>({data:{}}))]);
      setProfile(pRes.data||{});setUnread(uRes.data||{});
    }catch(e){console.error(e);setLoading(false);}
  },[]);
  useEffect(()=>{fetchData();},[fetchData]);
  const getBadge=(key)=>{if(key==='messages')return(unread.messages||0)+(unread.adminMessages||0);if(key==='quotes')return unread.quotes||0;if(key==='support')return unread.tickets||0;if(key==='disputes')return unread.disputes||0;if(key==='notifications')return unread.notifications||0;return 0;};
  const onNav=(t)=>{if(t.r)navigate(t.r);};
  if(loading)return<Spinner/>;
  const completed=bookings.filter(b=>b.status==='completed');
  const active=bookings.filter(b=>['requested','accepted','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status));
  const totalSpent=completed.reduce((s,b)=>s+(b.amount||0),0);
  const totalUnread=(unread.messages||0)+(unread.adminMessages||0)+(unread.quotes||0)+(unread.tickets||0)+(unread.disputes||0);
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,system-ui,sans-serif'}}>
      <Sidebar tabs={CTABS} open={sidebarOpen} setOpen={setSidebarOpen} getBadge={getBadge} onNav={onNav} user={user} logout={logout} roleLabel='Customer Portal'/>
      <main style={{flex:1,display:'flex',flexDirection:'column',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s',minHeight:'100vh'}}>
        <Topbar title='Customer Dashboard' subtitle={new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} totalUnread={totalUnread} user={user} logout={logout} navigate={navigate} dropOpen={dropOpen} setDropOpen={setDropOpen} roleLabel='Customer'/>
        <div style={{padding:'1.75rem 2rem',flex:1}}>
          <ProfileCompletionBanner completion={profile.profileCompletion} variant='banner' role='customer'/>
          <div style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',borderRadius:18,padding:'1.75rem 2rem',marginBottom:'1.75rem',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div><div style={{fontSize:'0.8rem',opacity:0.8,marginBottom:'0.25rem'}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><h2 style={{margin:0,fontSize:'1.6rem',fontWeight:800}}>{user?.name?.split(' ')[0]} !</h2><p style={{margin:'0.3rem 0 0',opacity:0.85,fontSize:'0.875rem'}}>Here is your activity overview for today.</p></div>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>{user?.trustedCustomer&&<span style={{background:'rgba(255,255,255,0.2)',padding:'0.35rem 0.875rem',borderRadius:50,fontSize:'0.8rem',fontWeight:700}}>Trusted Customer</span>}<span style={{background:'rgba(255,255,255,0.15)',padding:'0.35rem 0.875rem',borderRadius:50,fontSize:'0.8rem',fontWeight:600}}>Customer</span></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1.25rem',marginBottom:'1.75rem'}}>
            <KpiCard icon='📋' label='Total Bookings' value={bookings.length} color='#6366f1'/>
            <KpiCard icon='✅' label='Completed' value={completed.length} color='#10b981'/>
            <KpiCard icon='⚡' label='Active' value={active.length} color='#f59e0b'/>
            <KpiCard icon='💰' label='Total Spent' value={'Rs'+totalSpent.toLocaleString('en-IN')} color='#ec4899'/>
            <KpiCard icon='🏅' label='Loyalty Pts' value={user?.loyaltyPoints||0} color='#8b5cf6'/>
          </div>
          {totalUnread>0&&<div style={{display:'flex',gap:'0.6rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>{[{key:'messages',label:'Messages',path:'/messages',color:'#0ea5e9',bg:'#e0f2fe',count:(unread.messages||0)+(unread.adminMessages||0)},{key:'quotes',label:'Quotes',path:'/quotes',color:'#6366f1',bg:'#ede9fe',count:unread.quotes||0},{key:'tickets',label:'Support',path:'/support',color:'#8b5cf6',bg:'#f3e8ff',count:unread.tickets||0},{key:'disputes',label:'Disputes',path:'/disputes',color:'#ef4444',bg:'#fee2e2',count:unread.disputes||0}].filter(c=>c.count>0).map(c=>(<button key={c.key} onClick={()=>navigate(c.path)} style={{display:'flex',alignItems:'center',gap:'0.4rem',background:c.bg,color:c.color,border:'1px solid '+c.color+'30',borderRadius:50,padding:'0.4rem 0.875rem',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',whiteSpace:'nowrap'}}>{c.count} {c.label} -></button>))}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}><h3 style={{margin:0,fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Recent Bookings</h3><button onClick={()=>navigate('/bookings')} style={{background:'none',border:'none',color:'#6366f1',cursor:'pointer',fontWeight:600,fontSize:'0.82rem'}}>View All</button></div>
              {bookings.length===0?(<div style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}><div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📋</div><p style={{margin:'0 0 0.75rem',fontSize:'0.875rem'}}>No bookings yet</p><button onClick={()=>navigate('/search')} style={{padding:'0.45rem 1.25rem',background:'#6366f1',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:'0.82rem'}}>Find Workers</button></div>):bookings.slice(0,5).map(b=>(<div key={b._id} onClick={()=>navigate('/bookings')} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.65rem 0.75rem',borderRadius:10,cursor:'pointer',marginBottom:'0.4rem',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:'#1f2937',fontSize:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.service}</div><div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{b.worker?.name||'-'} - {new Date(b.scheduledDate).toLocaleDateString('en-IN')}</div></div><StatusBadge status={b.status}/><div style={{fontWeight:700,color:'#1f2937',fontSize:'0.875rem',flexShrink:0}}>Rs{b.amount}</div></div>))}
            </div>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 1.25rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Quick Actions</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                {[{icon:'🔍',label:'Find Workers',path:'/search',primary:true},{icon:'📋',label:'My Bookings',path:'/bookings'},{icon:'💳',label:'Payments',path:'/my-payments'},{icon:'💬',label:'Messages',path:'/messages',badge:(unread.messages||0)+(unread.adminMessages||0)},{icon:'🏷️',label:'Quotes',path:'/quotes',badge:unread.quotes||0},{icon:'🎫',label:'Support',path:'/support',badge:unread.tickets||0},{icon:'⚠️',label:'Disputes',path:'/disputes',badge:unread.disputes||0},{icon:'👤',label:'My Profile',path:'/profile'}].map(a=>(<button key={a.path+a.label} onClick={()=>navigate(a.path)} style={{position:'relative',padding:'0.75rem 0.5rem',background:a.primary?'linear-gradient(135deg,#4f46e5,#7c3aed)':'#f9fafb',color:a.primary?'white':'#374151',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.8rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',transition:'all 0.15s',boxShadow:a.primary?'0 2px 8px rgba(79,70,229,0.3)':'none'}} onMouseEnter={e=>{if(!a.primary)e.currentTarget.style.background='#f3f4f6';}} onMouseLeave={e=>{if(!a.primary)e.currentTarget.style.background='#f9fafb';}}><span style={{fontSize:'1.15rem'}}>{a.icon}</span>{a.label}{(a.badge||0)>0&&<span style={{position:'absolute',top:5,right:5,background:'#ef4444',color:'white',borderRadius:50,padding:'0.05rem 0.35rem',fontSize:'0.6rem',fontWeight:700}}>{a.badge}</span>}</button>))}
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 1rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Payment Summary</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                {[{label:'Total Paid',value:'Rs'+totalSpent.toLocaleString('en-IN'),bg:'#d1fae5',color:'#065f46'},{label:'Completed Jobs',value:completed.length,bg:'#dbeafe',color:'#1e40af'},{label:'Active Bookings',value:active.length,bg:'#fef3c7',color:'#92400e'},{label:'Loyalty Points',value:user?.loyaltyPoints||0,bg:'#ede9fe',color:'#6d28d9'}].map((s,i)=>(<div key={i} style={{background:s.bg,borderRadius:10,padding:'0.875rem 1rem'}}><div style={{fontSize:'1.25rem',fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:'0.72rem',color:s.color,fontWeight:600,marginTop:'0.15rem',opacity:0.8}}>{s.label}</div></div>))}
              </div>
            </div>
            {profile.trustScore&&<div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}><h3 style={{margin:'0 0 1rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Trust Score</h3><TrustScoreCard trustScore={profile.trustScore} role='customer' variant='compact'/></div>}
          </div>
        </div>
      </main>
    </div>
  );
};

const WorkerDashboard=()=>{
  const{user,logout}=useAuth();const navigate=useNavigate();
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[dropOpen,setDropOpen]=useState(false);
  const[bookings,setBookings]=useState([]);
  const[profile,setProfile]=useState({});
  const[unread,setUnread]=useState({});
  const[analytics,setAnalytics]=useState(null);
  const[availability,setAvailability]=useState(null);
  const[togglingAvail,setTogglingAvail]=useState(false);
  const[loading,setLoading]=useState(true);
  const[pendingRequests,setPendingRequests]=useState([]);
  const fetchData=useCallback(async()=>{
    try{
      // Fetch bookings first so UI renders immediately
      const bRes=await api.get('/bookings?limit=20');
      setBookings(bRes.data||[]);
      setLoading(false); // show UI immediately
      const[pRes,uRes,rRes]=await Promise.all([api.get('/auth/profile').catch(()=>({data:{}})),api.get('/notifications/unread-counts').catch(()=>({data:{}})),api.get('/worker-requests/my').catch(()=>({data:[]}))]);
      setProfile(pRes.data||{});setUnread(uRes.data||{});
      setPendingRequests((rRes.data||[]).filter(r=>r.status==='pending'));
      if(pRes.data?.workerProfile)setAvailability(pRes.data.workerProfile.availability!==false);
    }catch(e){console.error(e);setLoading(false);}
  },[]);
  const fetchAnalytics=useCallback(async()=>{try{const{data}=await api.get('/bookings/analytics/worker');setAnalytics(data);}catch{}},[]);
  useEffect(()=>{fetchData();fetchAnalytics();},[fetchData,fetchAnalytics]);
  const toggleAvailability=async()=>{setTogglingAvail(true);try{const v=!availability;await api.patch('/profile',{workerProfile:{availability:v}});setAvailability(v);toast.success(v?'You are now available':'You are now offline');}catch{toast.error('Failed');}finally{setTogglingAvail(false);}};
  const getBadge=(key)=>{if(key==='messages')return(unread.messages||0)+(unread.adminMessages||0);if(key==='quotes')return unread.quotes||0;if(key==='support')return unread.tickets||0;if(key==='requests')return(unread.pendingChangeRequests||0)||pendingRequests.length||0;if(key==='notifications')return unread.notifications||0;return 0;};
  const onNav=(t)=>{if(t.r)navigate(t.r);};
  if(loading)return<Spinner/>;
  const completed=bookings.filter(b=>b.status==='completed');
  const activeJobs=bookings.filter(b=>['accepted','on-the-way','arrived','in-progress','waiting-for-payment'].includes(b.status));
  const pending=bookings.filter(b=>b.status==='requested');
  const totalEarnings=completed.reduce((s,b)=>s+(b.amount||0),0);
  const wp=profile.workerProfile||user?.workerProfile||{};
  const verStatus=wp.verificationStatus||'pending';
  const totalUnread=(unread.messages||0)+(unread.adminMessages||0)+(unread.quotes||0)+(unread.tickets||0);
  const monthlyData=(analytics?.monthlyEarnings||[]).map(item=>({month:MONTH_NAMES[(item._id?.month||1)-1],earnings:item.earnings||0,jobs:item.jobs||0}));
  const VER={verified:{bg:'#d1fae5',color:'#065f46',label:'Verified'},submitted:{bg:'#dbeafe',color:'#1e40af',label:'Under Review'},'resubmission-required':{bg:'#fff7ed',color:'#c2410c',label:'Resubmit Required'},rejected:{bg:'#fee2e2',color:'#991b1b',label:'Rejected'},pending:{bg:'#f3f4f6',color:'#6b7280',label:'Not Submitted'}};
  const vc=VER[verStatus]||VER.pending;
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,system-ui,sans-serif'}}>
      <aside style={{width:sidebarOpen?240:64,background:'#1e1b4b',transition:'width 0.3s',flexShrink:0,display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,height:'100vh',overflowY:'auto',overflowX:'hidden',zIndex:100}}>
        <div onClick={()=>setSidebarOpen(!sidebarOpen)} style={{padding:'1.25rem',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',gap:'0.75rem',cursor:'pointer',flexShrink:0}}>
          <div style={{width:36,height:36,background:'rgba(255,255,255,0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>H</div>
          {sidebarOpen&&<div><div style={{color:'white',fontWeight:700,fontSize:'0.95rem',whiteSpace:'nowrap'}}>Hyperlocal Jobs</div><div style={{color:'#a5b4fc',fontSize:'0.7rem'}}>Worker Portal</div></div>}
        </div>
        {sidebarOpen&&availability!==null&&(
          <div style={{margin:'0.75rem',padding:'0.75rem',background:availability?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.12)',borderRadius:10,border:'1px solid '+(availability?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'),display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}>
            <div><div style={{color:availability?'#6ee7b7':'#fca5a5',fontSize:'0.72rem',fontWeight:700}}>{availability?'ONLINE':'OFFLINE'}</div><div style={{color:'#94a3b8',fontSize:'0.65rem'}}>{availability?'Accepting bookings':'Not visible'}</div></div>
            <button onClick={toggleAvailability} disabled={togglingAvail} style={{width:36,height:20,borderRadius:10,border:'none',cursor:'pointer',background:availability?'#10b981':'#6b7280',position:'relative',transition:'background 0.2s',flexShrink:0}}><span style={{position:'absolute',top:2,left:availability?18:2,width:16,height:16,borderRadius:'50%',background:'white',transition:'left 0.2s'}}/></button>
          </div>
        )}
        <nav style={{flex:1,padding:'0.5rem 0'}}>{WTABS.map(t=><SBtn key={t.key} icon={t.icon} label={t.label} active={false} badge={getBadge(t.key)} open={sidebarOpen} onClick={()=>onNav(t)}/>)}</nav>
        <div style={{padding:'0.75rem',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={logout} style={{width:'100%',padding:'0.6rem',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#fca5a5',cursor:'pointer',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:'0.5rem',justifyContent:sidebarOpen?'flex-start':'center',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.3)';e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.15)';e.currentTarget.style.color='#fca5a5';}}>
            <span>X</span>{sidebarOpen&&'Logout'}
          </button>
        </div>
      </aside>
      <main style={{flex:1,display:'flex',flexDirection:'column',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s',minHeight:'100vh'}}>
        <Topbar title='Worker Dashboard' subtitle={new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} totalUnread={totalUnread} user={user} logout={logout} navigate={navigate} dropOpen={dropOpen} setDropOpen={setDropOpen} roleLabel='Worker'/>
        <div style={{padding:'1.75rem 2rem',flex:1}}>
          <ProfileCompletionBanner completion={profile.profileCompletion} variant='checklist' role='worker'/>
          <div style={{background:'linear-gradient(135deg,#059669,#0d9488)',borderRadius:18,padding:'1.75rem 2rem',marginBottom:'1.75rem',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div><div style={{fontSize:'0.8rem',opacity:0.8,marginBottom:'0.25rem'}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div><h2 style={{margin:0,fontSize:'1.6rem',fontWeight:800}}>{user?.name?.split(' ')[0]} !</h2><p style={{margin:'0.3rem 0 0',opacity:0.85,fontSize:'0.875rem'}}>Here is your work overview for today.</p></div>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
              {verStatus==='verified'&&<span style={{background:'rgba(255,255,255,0.2)',padding:'0.35rem 0.875rem',borderRadius:50,fontSize:'0.8rem',fontWeight:700}}>Verified Worker</span>}
              <span style={{background:availability?'rgba(255,255,255,0.2)':'rgba(239,68,68,0.3)',padding:'0.35rem 0.875rem',borderRadius:50,fontSize:'0.8rem',fontWeight:700}}>{availability?'Online':'Offline'}</span>
            </div>
          </div>
          {verStatus!=='verified'&&(<div style={{background:vc.bg,border:'1px solid '+vc.color+'30',borderLeft:'4px solid '+vc.color,borderRadius:14,padding:'1rem 1.5rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}><div><div style={{fontWeight:700,color:vc.color}}>{vc.label}</div><div style={{fontSize:'0.82rem',color:vc.color,opacity:0.8}}>{verStatus==='pending'?'Submit your ID to get verified.':verStatus==='submitted'?'Admin will review within 24 hours.':(wp.verificationRejectedReason||'Please re-submit your documents.')}</div></div><button onClick={()=>navigate('/profile')} style={{padding:'0.4rem 1rem',background:vc.color,color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:'0.8rem',flexShrink:0}}>{verStatus==='pending'?'Submit ID':'View Status'}</button></div>)}
          {pendingRequests.length>0&&(<div style={{background:'#fef3c7',border:'1px solid #f59e0b40',borderLeft:'4px solid #f59e0b',borderRadius:14,padding:'1rem 1.5rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}><div><div style={{fontWeight:700,color:'#92400e'}}>{pendingRequests.length} Admin Change Request{pendingRequests.length>1?'s':''} Pending</div><div style={{fontSize:'0.8rem',color:'#b45309'}}>Admin has requested profile updates.</div></div><button onClick={()=>navigate('/worker-requests')} style={{padding:'0.4rem 1rem',background:'#f59e0b',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:'0.82rem',flexShrink:0}}>Review Now</button></div>)}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1.25rem',marginBottom:'1.75rem'}}>
            <KpiCard icon='💰' label='Total Earnings' value={'Rs'+totalEarnings.toLocaleString('en-IN')} color='#10b981'/>
            <KpiCard icon='✅' label='Completed' value={completed.length} color='#6366f1'/>
            <KpiCard icon='⚡' label='Active Jobs' value={activeJobs.length} color='#f59e0b'/>
            <KpiCard icon='🔔' label='New Requests' value={pending.length} color='#ec4899'/>
            <KpiCard icon='⭐' label='Rating' value={(wp.rating||0).toFixed(1)+'/5'} color='#8b5cf6'/>
          </div>
          {totalUnread>0&&<div style={{display:'flex',gap:'0.6rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>{[{key:'messages',label:'Messages',path:'/messages',color:'#0ea5e9',bg:'#e0f2fe',count:(unread.messages||0)+(unread.adminMessages||0)},{key:'quotes',label:'Quotes',path:'/quotes',color:'#6366f1',bg:'#ede9fe',count:unread.quotes||0},{key:'tickets',label:'Support',path:'/support',color:'#8b5cf6',bg:'#f3e8ff',count:unread.tickets||0}].filter(c=>c.count>0).map(c=>(<button key={c.key} onClick={()=>navigate(c.path)} style={{display:'flex',alignItems:'center',gap:'0.4rem',background:c.bg,color:c.color,border:'1px solid '+c.color+'30',borderRadius:50,padding:'0.4rem 0.875rem',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',whiteSpace:'nowrap'}}>{c.count} {c.label} -></button>))}</div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}><h3 style={{margin:0,fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Recent Bookings</h3><button onClick={()=>navigate('/bookings')} style={{background:'none',border:'none',color:'#6366f1',cursor:'pointer',fontWeight:600,fontSize:'0.82rem'}}>View All</button></div>
              {bookings.length===0?(<div style={{textAlign:'center',padding:'2rem',color:'#9ca3af'}}><div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📋</div><p style={{margin:0,fontSize:'0.875rem'}}>No bookings yet</p></div>):bookings.slice(0,5).map(b=>(<div key={b._id} onClick={()=>navigate('/bookings')} style={{display:'flex',alignItems:'center',gap:'0.875rem',padding:'0.65rem 0.75rem',borderRadius:10,cursor:'pointer',marginBottom:'0.4rem',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:'#1f2937',fontSize:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.service}</div><div style={{fontSize:'0.72rem',color:'#9ca3af'}}>{b.customer?.name||'-'} - {new Date(b.scheduledDate).toLocaleDateString('en-IN')}</div></div><StatusBadge status={b.status}/><div style={{fontWeight:700,color:'#1f2937',fontSize:'0.875rem',flexShrink:0}}>Rs{b.amount}</div></div>))}
            </div>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 1.25rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Quick Actions</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                {[{label:'My Bookings',path:'/bookings',primary:true},{label:'Earnings',path:'/earnings'},{label:'Messages',path:'/messages',badge:(unread.messages||0)+(unread.adminMessages||0)},{label:'Quotes',path:'/quotes',badge:unread.quotes||0},{label:'Change Requests',path:'/worker-requests',badge:pendingRequests.length||0},{label:'Support',path:'/support',badge:unread.tickets||0},{label:'Verification',path:'/profile'},{label:'My Profile',path:'/profile'}].map(a=>(<button key={a.path+a.label} onClick={()=>navigate(a.path)} style={{position:'relative',padding:'0.75rem 0.5rem',background:a.primary?'linear-gradient(135deg,#059669,#0d9488)':'#f9fafb',color:a.primary?'white':'#374151',border:'none',borderRadius:10,cursor:'pointer',fontWeight:600,fontSize:'0.8rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',transition:'all 0.15s',boxShadow:a.primary?'0 2px 8px rgba(5,150,105,0.3)':'none'}} onMouseEnter={e=>{if(!a.primary)e.currentTarget.style.background='#f3f4f6';}} onMouseLeave={e=>{if(!a.primary)e.currentTarget.style.background='#f9fafb';}}>{a.label}{(a.badge||0)>0&&<span style={{position:'absolute',top:5,right:5,background:'#ef4444',color:'white',borderRadius:50,padding:'0.05rem 0.35rem',fontSize:'0.6rem',fontWeight:700}}>{a.badge}</span>}</button>))}
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
            <div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <h3 style={{margin:'0 0 1rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Earnings Summary</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                {[{label:'Total Earned',value:'Rs'+totalEarnings.toLocaleString('en-IN'),bg:'#d1fae5',color:'#065f46'},{label:'Completed Jobs',value:completed.length,bg:'#dbeafe',color:'#1e40af'},{label:'Active Jobs',value:activeJobs.length,bg:'#fef3c7',color:'#92400e'},{label:'Avg per Job',value:'Rs'+(completed.length?Math.round(totalEarnings/completed.length).toLocaleString('en-IN'):0),bg:'#ede9fe',color:'#6d28d9'}].map((s,i)=>(<div key={i} style={{background:s.bg,borderRadius:10,padding:'0.875rem 1rem'}}><div style={{fontSize:'1.25rem',fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:'0.72rem',color:s.color,fontWeight:600,marginTop:'0.15rem',opacity:0.8}}>{s.label}</div></div>))}
              </div>
            </div>
            {profile.trustScore&&<div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}><h3 style={{margin:'0 0 1rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Trust Score</h3><TrustScoreCard trustScore={profile.trustScore} role='worker' variant='compact'/></div>}
          </div>
          {monthlyData.length>0&&(<div style={{background:'white',borderRadius:16,padding:'1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)',marginBottom:'1.5rem'}}><h3 style={{margin:'0 0 1.25rem',fontWeight:700,color:'#1f2937',fontSize:'0.95rem'}}>Monthly Earnings</h3><ResponsiveContainer width='100%' height={200}><BarChart data={monthlyData}><CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6'/><XAxis dataKey='month' tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip formatter={(v)=>['Rs'+v,'Earnings']}/><Bar dataKey='earnings' fill='#10b981' radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>)}
          <div style={{background:'white',borderRadius:16,padding:'1.25rem 1.5rem',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}><div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}><div style={{width:42,height:42,background:'#ede9fe',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}>A</div><div><div style={{fontWeight:700,color:'#1f2937',fontSize:'0.9rem'}}>Contact Admin</div><div style={{fontSize:'0.78rem',color:'#9ca3af'}}>Discuss pricing, documents, or profile corrections</div></div></div><button onClick={()=>navigate('/messages?tab=admin')} style={{padding:'0.45rem 1.1rem',background:'#6366f1',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:'0.82rem'}}>Message Admin</button></div></div>
        </div>
      </main>
    </div>
  );
};

const Dashboard=()=>{
  const{user}=useAuth();
  const navigate=useNavigate();
  if(!user) return null;
  if(user?.role==='admin') return <Navigate to="/admin" replace/>;
  if(user?.role==='worker')return<WorkerDashboard/>;
  return<CustomerDashboard/>;
};

export default Dashboard;
