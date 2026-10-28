import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectInfo from './pages/ProjectInfo';
import ChatbotWidget from './components/ChatbotWidget';
import ProfileSetupPrompt from './components/ProfileSetupPrompt';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', fontFamily:'Inter,system-ui,sans-serif' }}>
          <div style={{ textAlign:'center', padding:'2rem', maxWidth:400 }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
            <h2 style={{ color:'#1f2937', marginBottom:'0.5rem' }}>Something went wrong</h2>
            <p style={{ color:'#6b7280', fontSize:'0.875rem', marginBottom:'1.5rem' }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.href = '/dashboard'} style={{ padding:'0.6rem 1.5rem', background:'#6366f1', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, marginRight:'0.5rem' }}>Retry</button>
            <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} style={{ padding:'0.6rem 1.5rem', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Login Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load heavy pages for faster initial load
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const WorkerSearch    = lazy(() => import('./pages/WorkerSearch'));
const Bookings        = lazy(() => import('./pages/Bookings'));
const Profile         = lazy(() => import('./pages/Profile'));
const Messages        = lazy(() => import('./pages/Messages'));
const AboutUs         = lazy(() => import('./pages/AboutUs'));
const ContactUs       = lazy(() => import('./pages/ContactUs'));
const ServicePage     = lazy(() => import('./pages/ServicePage'));
const FeaturePage     = lazy(() => import('./pages/FeaturePage'));
const AdminSetup      = lazy(() => import('./pages/AdminSetup'));
const DisputePage     = lazy(() => import('./pages/DisputePage'));
const QuotePage       = lazy(() => import('./pages/QuotePage'));
const WorkerRequests  = lazy(() => import('./pages/WorkerRequests'));
const SupportTickets  = lazy(() => import('./pages/SupportTickets'));
const WorkerEarnings  = lazy(() => import('./pages/WorkerEarnings'));
const CustomerFinance = lazy(() => import('./pages/CustomerFinance'));
const AdminFinance    = lazy(() => import('./pages/AdminFinance'));
const AdminProfile    = lazy(() => import('./pages/AdminProfile'));
const Notifications   = lazy(() => import('./pages/Notifications'));

const PageLoader = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:40, height:40, border:'4px solid #e5e7eb', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }}></div>
      <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>Loading...</p>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppInner() {
  const { showSetupPrompt } = useAuth();
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />          <Route path="/about" element={<AboutUs />} />
        <Route path="/project-info" element={<ProjectInfo />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/service/:service" element={<ServicePage />} />
        <Route path="/feature/:feature" element={<FeaturePage />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><WorkerSearch /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/messages/:bookingId" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/disputes" element={<PrivateRoute><DisputePage /></PrivateRoute>} />
        <Route path="/quotes" element={<PrivateRoute><QuotePage /></PrivateRoute>} />
        <Route path="/worker-requests" element={<PrivateRoute><WorkerRequests /></PrivateRoute>} />
        <Route path="/support" element={<PrivateRoute><SupportTickets /></PrivateRoute>} />
        <Route path="/earnings" element={<PrivateRoute><WorkerEarnings /></PrivateRoute>} />
        <Route path="/my-payments" element={<PrivateRoute><CustomerFinance /></PrivateRoute>} />
        <Route path="/admin/finance" element={<PrivateRoute><AdminFinance /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/admin/profile" element={<PrivateRoute><AdminProfile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <ChatbotWidget />
      {showSetupPrompt && <ProfileSetupPrompt />}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <AppInner />
      </Router>
    </AuthProvider>
  );
}

export default App;
