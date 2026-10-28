import React,{useState,useCallback,useEffect}from"react";
import{useNavigate,useLocation}from"react-router-dom";
import{useAuth}from"../context/AuthContext";
import api from"../utils/api";

const CUSTOMER_MENU=[
  {r:"/dashboard",icon:"📊",label:"Dashboard"},
  {r:"/search",icon:"🔍",label:"Find Workers"},
  {r:"/bookings",icon:"📋",label:"My Bookings"},
  {r:"/messages",icon:"💬",label:"Messages"},
  {r:"/quotes",icon:"🏷️",label:"Quotes"},
  {r:"/disputes",icon:"⚠️",label:"Disputes"},
  {r:"/support",icon:"🎫",label:"Support"},
  {r:"/my-payments",icon:"💳",label:"Payments"},
  {r:"/notifications",icon:"🔔",label:"Notifications"},
  {r:"/profile",icon:"👤",label:"Profile"},
];
const WORKER_MENU=[
  {r:"/dashboard",icon:"📊",label:"Dashboard"},
  {r:"/bookings",icon:"📋",label:"My Bookings"},
  {r:"/quotes",icon:"🏷️",label:"Quotes"},
  {r:"/messages",icon:"💬",label:"Messages"},
  {r:"/earnings",icon:"💰",label:"Earnings"},
  {r:"/support",icon:"🎫",label:"Support"},
  {r:"/worker-requests",icon:"📝",label:"Change Requests"},
  {r:"/disputes",icon:"⚠️",label:"Disputes"},
  {r:"/notifications",icon:"🔔",label:"Notifications"},
  {r:"/profile",icon:"👤",label:"Profile"},
];

const Av=({user,size=32})=>(user?.avatar?<img src={user.avatar}alt=""style={{width:size,height:size,borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38}}>{user?.name?.[0]||"?"}</div>);

const DashboardLayout=({children})=>{
  const{user,logout}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const[open,setOpen]=useState(true);
  const[drop,setDrop]=useState(false);
  const[unread,setUnread]=useState({});

  const fetchU=useCallback(async()=>{try{const{data}=await api.get("/notifications/unread-counts");setUnread(data||{});}catch{}},[]);
  useEffect(()=>{fetchU();const t=setInterval(fetchU,30000);return()=>clearInterval(t);},[fetchU]);

  if(!user||user.role==="admin")return<>{children}</>;

  const menu=user.role==="worker"?WORKER_MENU:CUSTOMER_MENU;
  const roleLabel=user.role==="worker"?"Worker Portal":"Customer Portal";
  const accent=user.role==="worker"?"#059669":"#4f46e5";

  const badge=(r)=>{
    if(r==="/messages")return(unread.messages||0)+(unread.adminMessages||0);
    if(r==="/quotes")return unread.quotes||0;
    if(r==="/support")return unread.tickets||0;
    if(r==="/disputes")return unread.disputes||0;
    if(r==="/notifications")return unread.notifications||0;
    if(r==="/worker-requests")return unread.pendingChangeRequests||0;
    return 0;
  };

  const active=(r)=>r==="/dashboard"?location.pathname===r:location.pathname.startsWith(r);
  const total=(unread.messages||0)+(unread.adminMessages||0)+(unread.quotes||0)+(unread.tickets||0)+(unread.disputes||0);

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#f8fafc",fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* SIDEBAR */}
      <aside style={{width:open?240:64,background:"#1e1b4b",flexShrink:0,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",overflowY:"auto",overflowX:"hidden",zIndex:300,transition:"width 0.3s"}}>
        {/* Logo */}
        <div onClick={()=>setOpen(!open)} style={{padding:"1.1rem 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",gap:"0.75rem",cursor:"pointer",flexShrink:0}}>
          <div style={{width:34,height:34,background:"rgba(255,255,255,0.15)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>🏠</div>
          {open&&<div><div style={{color:"white",fontWeight:700,fontSize:"0.9rem",whiteSpace:"nowrap"}}>Hyperlocal Jobs</div><div style={{color:"#a5b4fc",fontSize:"0.65rem"}}>{roleLabel}</div></div>}
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:"0.4rem 0"}}>
          {menu.map(m=>{
            const b=badge(m.r);
            const a=active(m.r);
            return(
              <button key={m.r} onClick={()=>navigate(m.r)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 1.25rem",background:a?"rgba(99,102,241,0.28)":"transparent",border:"none",cursor:"pointer",color:a?"#a5b4fc":"#94a3b8",fontWeight:a?600:400,fontSize:"0.875rem",textAlign:"left",borderLeft:a?"3px solid #6366f1":"3px solid transparent",transition:"all 0.15s",position:"relative"}}
                onMouseEnter={e=>{if(!a){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="#c7d2fe";}}}
                onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94a3b8";}}}>
                <span style={{fontSize:"1rem",flexShrink:0}}>{m.icon}</span>
                {open&&<span style={{whiteSpace:"nowrap",flex:1}}>{m.label}</span>}
                {open&&b>0&&<span style={{background:"#ef4444",color:"white",borderRadius:50,padding:"0.05rem 0.4rem",fontSize:"0.6rem",fontWeight:700,flexShrink:0}}>{b>9?"9+":b}</span>}
                {!open&&b>0&&<span style={{position:"absolute",top:6,right:6,width:7,height:7,background:"#ef4444",borderRadius:"50%"}}/>}
              </button>
            );
          })}
        </nav>
        {/* Logout */}
        <div style={{padding:"0.75rem",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
          <button onClick={logout} style={{width:"100%",padding:"0.55rem",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#fca5a5",cursor:"pointer",fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.5rem",justifyContent:open?"flex-start":"center",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.3)";e.currentTarget.style.color="white";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.15)";e.currentTarget.style.color="#fca5a5";}}>
            <span>🚪</span>{open&&"Logout"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,marginLeft:open?240:64,transition:"margin-left 0.3s",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        {/* TOPBAR */}
        <div style={{background:"white",padding:"0.75rem 1.75rem",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",flexShrink:0}}>
          <div>
            <h1 style={{margin:0,fontSize:"1.1rem",fontWeight:700,color:"#1f2937"}}>
              {menu.find(m=>active(m.r))?.icon} {menu.find(m=>active(m.r))?.label||"Dashboard"}
            </h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <button onClick={()=>navigate("/notifications")} style={{position:"relative",background:"#f3f4f6",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem"}}>
              🔔{total>0&&<span style={{position:"absolute",top:-3,right:-3,background:"#ef4444",color:"white",borderRadius:"50%",width:16,height:16,fontSize:"0.6rem",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{total>9?"9+":total}</span>}
            </button>
            <div style={{position:"relative"}}>
              <div onClick={()=>setDrop(v=>!v)} style={{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer",padding:"0.3rem 0.75rem",borderRadius:10,background:"#f9fafb",border:"1px solid #e5e7eb"}}>
                <Av user={user} size={28}/>
                <div><div style={{fontSize:"0.8rem",fontWeight:600,color:"#1f2937"}}>{user?.name?.split(" ")[0]}</div><div style={{fontSize:"0.62rem",color:"#9ca3af",textTransform:"capitalize"}}>{user?.role}</div></div>
                <span style={{color:"#9ca3af",fontSize:"0.65rem"}}>▾</span>
              </div>
              {drop&&(<><div onClick={()=>setDrop(false)} style={{position:"fixed",inset:0,zIndex:98}}/><div style={{position:"absolute",top:44,right:0,background:"white",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:"1px solid #e5e7eb",minWidth:170,zIndex:99,overflow:"hidden"}}><div style={{padding:"0.7rem 1rem",borderBottom:"1px solid #f3f4f6",background:"#f9fafb"}}><div style={{fontWeight:700,color:"#1f2937",fontSize:"0.85rem"}}>{user?.name}</div><div style={{fontSize:"0.7rem",color:"#9ca3af",textTransform:"capitalize"}}>{user?.role}</div></div>{[["👤","Profile","/profile"],["📋","Bookings","/bookings"]].map(([ic,lb,path])=>(<button key={path} onClick={()=>{navigate(path);setDrop(false);}} style={{width:"100%",padding:"0.6rem 1rem",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:"0.82rem",color:"#374151",display:"flex",alignItems:"center",gap:"0.6rem"}} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="none"}><span>{ic}</span>{lb}</button>))}<div style={{borderTop:"1px solid #f3f4f6"}}><button onClick={logout} style={{width:"100%",padding:"0.6rem 1rem",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontSize:"0.82rem",color:"#ef4444",fontWeight:600,display:"flex",alignItems:"center",gap:"0.6rem"}} onMouseEnter={e=>e.currentTarget.style.background="#fff5f5"} onMouseLeave={e=>e.currentTarget.style.background="none"}><span>🚪</span>Logout</button></div></div></>)}
            </div>
          </div>
        </div>
        {/* PAGE CONTENT */}
        <div style={{flex:1}}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
