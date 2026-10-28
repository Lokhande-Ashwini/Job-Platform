import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const STATUS_CONFIG = {
  pending:     { bg:'#fef3c7', color:'#92400e', label:'Pending Review' },
  accepted:    { bg:'#d1fae5', color:'#065f46', label:'Accepted' },
  rejected:    { bg:'#fee2e2', color:'#991b1b', label:'Rejected' },
  resubmitted: { bg:'#e0f2fe', color:'#0369a1', label:'Resubmitted' },
  completed:   { bg:'#d1fae5', color:'#065f46', label:'Completed ✓' },
};

const PRIORITY_CONFIG = {
  low:    { color:'#6b7280', label:'Low' },
  medium: { color:'#f59e0b', label:'Medium' },
  high:   { color:'#ef4444', label:'High' },
};

const WorkerRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondModal, setRespondModal] = useState(null);
  const [response, setResponse] = useState('');
  const [action, setAction] = useState('accept');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/worker-requests/my');
      setRequests(data);
      // Mark any admin message threads as read
      try {
        const { data: threads } = await api.get('/support/threads');
        threads.forEach(t => {
          api.patch(`/support/threads/${t._id}/read`).catch(() => {});
        });
      } catch {}
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/worker-requests/${respondModal._id}/respond`, { action, workerResponse: response });
      toast.success(action === 'accept' ? '✅ Change accepted and applied!' : 'Request rejected');
      setRespondModal(null);
      setResponse('');
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const others  = requests.filter(r => r.status !== 'pending');

  return (
    <div className="dashboard" style={{paddingTop:0}}>
      <Navbar />
      <div style={{ padding:'1.5rem 1rem', maxWidth:900, margin:'0 auto' }}>
        <div style={{ marginBottom:'2rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem', padding:0 }}>← Back</button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1f2937' }}>📋 Admin Change Requests</h2>
              <p style={{ color:'#9ca3af', fontSize:'0.875rem', marginTop:'0.25rem' }}>Review and respond to profile change requests from admin</p>
            </div>
            <button onClick={() => navigate('/messages?tab=admin')} style={{ padding:'0.5rem 1.25rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
              💬 Chat with Admin
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#9ca3af' }}>
            <div style={{ width:40, height:40, border:'4px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }}></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
            <h3 style={{ color:'#1f2937', marginBottom:'0.5rem' }}>No change requests</h3>
            <p style={{ color:'#9ca3af' }}>Admin hasn't sent any profile change requests yet.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom:'2rem' }}>
                <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1f2937', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  ⏳ Pending ({pending.length})
                  <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.15rem 0.6rem', borderRadius:50, fontSize:'0.75rem', fontWeight:700 }}>Action Required</span>
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {pending.map(r => <RequestCard key={r._id} r={r} onRespond={() => { setRespondModal(r); setAction('accept'); setResponse(''); }} />)}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1f2937', marginBottom:'1rem' }}>📜 History ({others.length})</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {others.map(r => <RequestCard key={r._id} r={r} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {respondModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:'2rem', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ color:'#1f2937', fontWeight:700, marginBottom:'1.5rem' }}>Respond to Change Request</h3>
            <div style={{ background:'#f9fafb', padding:'1rem', borderRadius:10, marginBottom:'1.5rem', border:'1px solid #e5e7eb' }}>
              <div style={{ fontSize:'0.78rem', color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:'0.5rem' }}>Requested Change</div>
              <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'0.25rem' }}>{respondModal.fieldName}</div>
              <div style={{ display:'flex', gap:'1rem', fontSize:'0.875rem', flexWrap:'wrap' }}>
                {respondModal.oldValue && <span style={{ color:'#ef4444' }}>Old: {respondModal.oldValue}</span>}
                <span style={{ color:'#10b981' }}>New: {respondModal.suggestedValue}</span>
              </div>
              <p style={{ color:'#6b7280', fontSize:'0.85rem', marginTop:'0.5rem', fontStyle:'italic' }}>Admin note: {respondModal.reason}</p>
            </div>
            <form onSubmit={handleRespond} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                {['accept','reject'].map(a => (
                  <button key={a} type="button" onClick={() => setAction(a)}
                    style={{ flex:1, padding:'0.75rem', border:`2px solid ${action===a?(a==='accept'?'#10b981':'#ef4444'):'#e5e7eb'}`, borderRadius:10, background:action===a?(a==='accept'?'#d1fae5':'#fee2e2'):'white', color:action===a?(a==='accept'?'#065f46':'#991b1b'):'#6b7280', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', transition:'all 0.2s' }}>
                    {a === 'accept' ? '✓ Accept Change' : '✗ Reject'}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Your Response (optional)</label>
                <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="Add a note to admin..."
                  style={{ width:'100%', padding:'0.875rem', border:'2px solid #e5e7eb', borderRadius:10, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button type="submit" style={{ flex:1, padding:'0.875rem', background:action==='accept'?'#10b981':'#ef4444', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                  {action === 'accept' ? '✓ Confirm Accept' : '✗ Confirm Reject'}
                </button>
                <button type="button" onClick={() => setRespondModal(null)} style={{ flex:1, padding:'0.875rem', background:'#f3f4f6', color:'#6b7280', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ r, onRespond }) => {
  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
  const pc = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.medium;
  return (
    <div style={{ background:'white', borderRadius:14, padding:'1.25rem 1.5rem', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${sc.color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.75rem', marginBottom:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ background:sc.bg, color:sc.color, padding:'0.2rem 0.75rem', borderRadius:50, fontSize:'0.78rem', fontWeight:700 }}>{sc.label}</span>
          <span style={{ background:pc.color+'15', color:pc.color, padding:'0.2rem 0.6rem', borderRadius:50, fontSize:'0.75rem', fontWeight:600 }}>{pc.label} Priority</span>
        </div>
        <span style={{ fontSize:'0.78rem', color:'#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      <div style={{ fontWeight:700, color:'#1f2937', marginBottom:'0.35rem', fontSize:'0.95rem' }}>
        Change requested: <span style={{ color:'#6366f1' }}>{r.fieldName}</span>
      </div>
      <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.875rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
        {r.oldValue && <span style={{ color:'#ef4444' }}>Current: <strong>{r.oldValue}</strong></span>}
        <span style={{ color:'#10b981' }}>Requested: <strong>{r.suggestedValue}</strong></span>
      </div>
      <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom: onRespond ? '1rem' : 0, fontStyle:'italic' }}>Admin note: "{r.reason}"</p>
      {r.workerResponse && <p style={{ color:'#374151', fontSize:'0.82rem', background:'#f9fafb', padding:'0.5rem 0.75rem', borderRadius:8 }}>Your response: {r.workerResponse}</p>}
      {onRespond && r.status === 'pending' && (
        <button onClick={onRespond} style={{ padding:'0.6rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>
          Respond →
        </button>
      )}
    </div>
  );
};

export default WorkerRequests;
