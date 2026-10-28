import React, { useState, useRef, useEffect } from 'react';

// ── Intent-based FAQ engine ──────────────────────────────────────────────────
const INTENTS = [
  {
    patterns: ['hello','hi','hey','start','help'],
    reply: () => 'Hi there! 👋 I\'m HyperBot, your AI assistant for Hyperlocal Jobs.\n\nI can help you with:\n• Finding the right service\n• Booking a worker\n• Payment questions\n• Tracking your job\n• Raising a dispute\n\nWhat do you need help with?'
  },
  {
    patterns: ['recommend','suggest','which','best','good worker','find worker'],
    reply: () => '🤖 Our AI ranks workers by:\n\n1. 📍 Distance from you\n2. ⭐ Rating & reviews\n3. 🎓 Years of experience\n4. ✅ Completion rate\n5. 💰 Price fairness\n\nLook for badges like **Best Match**, **Highly Rated**, or **Budget Friendly** on worker cards!'
  },
  {
    patterns: ['electrician','electric','wiring','fan','light','switchboard','mcb','inverter'],
    reply: () => '⚡ **Electrician Services**\n\nWe cover: wiring, switchboards, fans, lights, MCB, inverters, CCTV, AC electrical work.\n\n💰 Rate: ₹200–700/hr\n⏱ Avg time: 1–3 hours\n✅ All electricians are certified\n\nGo to **Find Workers** → select Electrician → Book!'
  },
  {
    patterns: ['plumber','plumbing','pipe','leak','tap','drain','bathroom','geyser','water'],
    reply: () => '🔧 **Plumber Services**\n\nWe cover: pipe leaks, tap replacement, bathroom fitting, geyser installation, drain cleaning.\n\n💰 Rate: ₹200–600/hr\n🚨 Emergency service available 24/7\n\nGo to **Find Workers** → select Plumber!'
  },
  {
    patterns: ['carpenter','furniture','wardrobe','door','wood','cabinet','flooring'],
    reply: () => '🪚 **Carpenter Services**\n\nWe cover: furniture assembly, wardrobes, kitchen cabinets, wooden flooring, false ceiling.\n\n💰 Rate: ₹300–900/hr\n📐 Custom furniture available\n\nGo to **Find Workers** → select Carpenter!'
  },
  {
    patterns: ['mechanic','car','bike','vehicle','service','oil','brake','battery','tyre'],
    reply: () => '🔩 **Mechanic Services**\n\nDoorstep service for cars & bikes: servicing, oil change, brake repair, battery, tyre puncture.\n\n💰 Rate: ₹300–1000/hr\n🚗 We come to your location!\n\nGo to **Find Workers** → select Mechanic!'
  },
  {
    patterns: ['tutor','teach','study','math','science','jee','neet','english','coaching'],
    reply: () => '📚 **Tutor Services**\n\nSubjects: all school subjects, JEE/NEET, English speaking, programming, music.\n\n💰 Rate: ₹200–800/hr\n💻 Online & in-person sessions\n\nGo to **Find Workers** → select Tutor!'
  },
  {
    patterns: ['painter','paint','wall','texture','waterproof','polish'],
    reply: () => '🎨 **Painter Services**\n\nInterior, exterior, texture painting, waterproofing, wood polishing.\n\n💰 Rate: ₹15–50/sq ft\n🏠 Free color consultation\n\nGo to **Find Workers** → select Painter!'
  },
  {
    patterns: ['cleaner','clean','deep clean','maid','sweep','sofa','carpet','office'],
    reply: () => '🧹 **Cleaning Services**\n\nHome deep cleaning, kitchen, bathroom, sofa/carpet, office, post-construction.\n\n💰 Rate: ₹1500–5000/session\n🌿 Eco-friendly products used\n\nGo to **Find Workers** → select Cleaner!'
  },
  {
    patterns: ['gardener','garden','lawn','plant','landscape','terrace','irrigation'],
    reply: () => '🌱 **Gardener Services**\n\nLawn mowing, pruning, landscaping, irrigation setup, terrace garden design.\n\n💰 Rate: ₹500–2000/session\n🌿 Organic methods preferred\n\nGo to **Find Workers** → select Gardener!'
  },
  {
    patterns: ['book','booking','schedule','appointment','how to book'],
    reply: () => '📋 **How to Book a Worker**\n\n1. Go to **Find Workers** in the menu\n2. Select your service type\n3. Allow location access for nearby results\n4. Browse AI-ranked worker cards\n5. Click **Book Now** on your chosen worker\n6. Fill in date, time, and amount\n7. Confirm your booking!\n\nYou\'ll get a notification when the worker accepts.'
  },
  {
    patterns: ['pay','payment','upi','cash','card','razorpay','how to pay'],
    reply: () => '💳 **Payment Options**\n\n• 💵 **Cash** — Pay directly after work is done\n• 📱 **UPI** — Pay online via UPI\n• 💳 **Card/Net Banking** — Secure online payment\n\n🔒 All online payments are secured.\n📄 You get a digital receipt after payment.\n\nFor cash bookings, confirm payment from the Bookings page after work is done.'
  },
  {
    patterns: ['cancel','cancellation','cancel booking'],
    reply: () => '❌ **Cancellation Policy**\n\n• You can cancel a **pending** booking for free\n• Once a worker accepts, cancellation may affect your rating\n• Go to **Bookings** → find the booking → click **Cancel**\n\nFor issues after job completion, use the **Dispute** option instead.'
  },
  {
    patterns: ['review','rating','feedback','rate worker'],
    reply: () => '⭐ **Leaving a Review**\n\nAfter a job is marked **Completed**:\n1. Go to **Bookings**\n2. Find the completed booking\n3. Click **Leave Review**\n4. Give a star rating (1–5)\n5. Write your feedback\n\n✅ Only verified customers who completed a booking can review. Our AI analyzes review sentiment to monitor quality!'
  },
  {
    patterns: ['dispute','complaint','problem','issue','bad service','refund'],
    reply: () => '⚠️ **Raising a Dispute**\n\nIf you\'re unhappy with a completed job:\n1. Go to **Bookings**\n2. Find the booking → click **Dispute**\n3. Select a reason and describe the issue\n4. Our admin team reviews within 24 hours\n\nRefunds are processed based on admin decision. You can also contact us at contact@ansoftio.com'
  },
  {
    patterns: ['emergency','urgent','asap','immediately','now'],
    reply: () => '🚨 **Emergency Booking**\n\nFor urgent jobs:\n1. Go to **Find Workers**\n2. Book any available worker\n3. Check **Emergency Booking** in the form\n4. A ₹100 priority fee is added\n\n⚡ Emergency bookings get priority matching and faster response times!'
  },
  {
    patterns: ['register','signup','join','create account','new account'],
    reply: () => '👤 **Creating an Account**\n\n**As a Customer:**\n• Register → Choose Customer → Fill details\n• Start booking workers immediately!\n\n**As a Worker:**\n• Register → Choose Worker → Add skills & rate\n• Wait for admin verification (24 hrs)\n• Start receiving bookings!\n\n🛡️ First-time admin setup is available on the Register page.'
  },
  {
    patterns: ['verify','verification','approved','pending','rejected','admin'],
    reply: () => '✅ **Worker Verification**\n\nAll workers go through admin verification:\n1. Register as a Worker\n2. Fill in your skills, experience, and rate\n3. Admin reviews your profile\n4. You get notified when approved\n\n⏱ Usually takes within 24 hours.\n\nIf rejected, contact admin at contact@ansoftio.com'
  },
  {
    patterns: ['price','cost','rate','charge','fee','expensive','cheap'],
    reply: () => '💰 **Pricing Information**\n\nPrices vary by service and worker:\n\n• Electrician: ₹200–700/hr\n• Plumber: ₹200–600/hr\n• Carpenter: ₹300–900/hr\n• Mechanic: ₹300–1000/hr\n• Tutor: ₹200–800/hr\n• Painter: ₹15–50/sq ft\n• Cleaner: ₹1500–5000/session\n\n🤖 Our AI shows a **Price Fairness** indicator on each worker card!'
  },
  {
    patterns: ['loyalty','points','reward','discount','coupon'],
    reply: () => '🏅 **Loyalty Points**\n\nEarn points on every completed booking:\n• 1 point per ₹10 spent\n• 100 points = ₹50 discount\n\nCheck your points in your **Dashboard**!\n\nMore rewards coming soon — referral bonuses, first-booking discounts, and seasonal offers.'
  },
  {
    patterns: ['trust','score','reliable','safe','trustworthy'],
    reply: () => '🛡️ **Worker Trust Score**\n\nEvery worker has an AI-calculated Trust Score (0–100):\n\n• 💎 **Platinum** (85+) — Top verified workers\n• 🥇 **Gold** (70–84) — Highly reliable\n• 🥈 **Silver** (50–69) — Good track record\n• 🥉 **Bronze** (<50) — New or limited history\n\nThe score is based on verification, rating, jobs done, completion rate, and experience.'
  },
  {
    patterns: ['location','address','near','nearby','gps','map'],
    reply: () => '📍 **Location & Maps**\n\nWe use GPS to find workers near you:\n1. Allow location access when prompted\n2. Workers are sorted by distance\n3. See them on the map with markers\n4. Click a marker to see worker details\n\nYou can also update your saved address in **Profile** → **Update Location**.'
  },
  {
    patterns: ['contact','support','help','email','phone','reach'],
    reply: () => '📞 **Contact & Support**\n\n• 📧 Email: contact@ansoftio.com\n• 📞 Phone: 8767823948\n• 🌐 Website: ansoftio.com\n\nFor booking issues, use the **Dispute** feature.\nFor general queries, use the **Contact Us** page.\n\nBuilt by Ashwini Lokhande 💙'
  },
];

const getReply = (input) => {
  const lower = input.toLowerCase().trim();
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => lower.includes(p))) return intent.reply();
  }
  // Fuzzy fallback
  if (lower.length < 3) return 'Please type a question and I\'ll do my best to help! 😊';
  return `I'm not sure about "${input}". Try asking about:\n\n• A specific service (electrician, plumber, etc.)\n• How to book a worker\n• Payment options\n• Disputes or reviews\n\nOr contact us at contact@ansoftio.com 📧`;
};

const QUICK_REPLIES = ['How to book?', 'Payment options', 'Emergency booking', 'Trust score', 'Contact support'];

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! 👋 I\'m **HyperBot**, your AI assistant.\n\nAsk me about services, booking, payments, or anything about Hyperlocal Jobs!', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: msg, time: new Date() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: getReply(msg), time: new Date() }]);
    }, 600 + Math.random() * 400);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div style={{ position:'fixed', bottom:'1.25rem', right:'1.25rem', zIndex:9999, fontFamily:'Inter, sans-serif' }}>
      {open && (
        <div style={{ width:'min(360px, calc(100vw - 2rem))', height:'min(520px, calc(100vh - 120px))', background:'white', borderRadius:20, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', overflow:'hidden', marginBottom:'1rem', animation:'fadeIn 0.2s ease' }}>
          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{ width:40, height:40, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', border:'2px solid rgba(255,255,255,0.3)' }}>🤖</div>
              <div>
                <div style={{ color:'white', fontWeight:700, fontSize:'0.95rem' }}>HyperBot</div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
                  <div style={{ width:7, height:7, background:'#4ade80', borderRadius:'50%', animation:'pulse 2s infinite' }}></div>
                  <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.72rem' }}>AI Assistant · Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', cursor:'pointer', fontSize:'1rem', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem', background:'#fafafa' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start', gap:'0.5rem', alignItems:'flex-end' }}>
                {m.from === 'bot' && (
                  <div style={{ width:28, height:28, background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', flexShrink:0 }}>🤖</div>
                )}
                <div style={{ maxWidth:'78%', padding:'0.75rem 1rem', borderRadius: m.from==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.from==='user' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'white', color: m.from==='user' ? 'white' : '#1f2937', fontSize:'0.85rem', lineHeight:'1.6', boxShadow: m.from==='bot' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
                  {formatText(m.text)}
                  <div style={{ fontSize:'0.65rem', opacity:0.6, marginTop:'0.35rem', textAlign:'right' }}>
                    {m.time.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-end' }}>
                <div style={{ width:28, height:28, background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem' }}>🤖</div>
                <div style={{ background:'white', padding:'0.75rem 1rem', borderRadius:'16px 16px 16px 4px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', gap:'4px', alignItems:'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, background:'#9ca3af', borderRadius:'50%', animation:`pulse 1.2s ${i*0.2}s infinite` }}></div>)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Replies */}
          <div style={{ padding:'0.5rem 0.75rem', background:'white', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
            {QUICK_REPLIES.map(q => (
              <button key={q} onClick={() => send(q)} style={{ padding:'0.3rem 0.65rem', background:'#ede9fe', color:'#7c3aed', border:'none', borderRadius:50, cursor:'pointer', fontSize:'0.72rem', fontWeight:600, whiteSpace:'nowrap' }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:'0.75rem', background:'white', borderTop:'1px solid #f3f4f6', display:'flex', gap:'0.5rem' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Ask me anything..."
              style={{ flex:1, padding:'0.6rem 1rem', border:'2px solid #e5e7eb', borderRadius:50, fontSize:'0.875rem', outline:'none', transition:'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='#e5e7eb'} />
            <button onClick={() => send()} style={{ width:38, height:38, background:'linear-gradient(135deg,#667eea,#764ba2)', border:'none', borderRadius:'50%', color:'white', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>→</button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button onClick={() => setOpen(!open)}
        style={{ width:56, height:56, background:'linear-gradient(135deg,#667eea,#764ba2)', border:'none', borderRadius:'50%', color:'white', cursor:'pointer', fontSize:'1.5rem', boxShadow:'0 8px 24px rgba(102,126,234,0.5)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', position:'relative' }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(102,126,234,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(102,126,234,0.5)'; }}>
        {open ? '✕' : '🤖'}
        {!open && (
          <div style={{ position:'absolute', top:-2, right:-2, width:14, height:14, background:'#4ade80', borderRadius:'50%', border:'2px solid white', animation:'pulse 2s infinite' }}></div>
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;
