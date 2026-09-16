import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-load every page
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const PostJob          = lazy(() => import('./pages/PostJob'));
const JobFeed          = lazy(() => import('./pages/JobFeed'));
const JobDetail        = lazy(() => import('./pages/JobDetail'));
const ProviderProfile  = lazy(() => import('./pages/ProviderProfile'));
const Chat             = lazy(() => import('./pages/Chat'));
const AdminPanel       = lazy(() => import('./pages/AdminPanel'));
const BrowseProviders  = lazy(() => import('./pages/BrowseProviders'));
const MapView             = lazy(() => import('./pages/MapView'));
const VerificationPage    = lazy(() => import('./pages/VerificationPage'));
const AdminVerification   = lazy(() => import('./pages/AdminVerification'));
const LandingPage         = lazy(() => import('./pages/LandingPage'));
const Navbar           = lazy(() => import('./components/Navbar'));

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('WorkBridge Error:', err, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 16 }}>⚠️ WorkBridge — Runtime Error</h2>
          <pre style={{ background: '#fee2e2', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', color: '#7f1d1d', fontSize: 13 }}>
            {String(this.state.error)}
            {'\n\n--- Stack ---\n'}
            {this.state.error?.stack}
          </pre>
          <button
            style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}>
            ↩ Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Page-level error boundary (wraps each lazy page) ─────────────────────────
class PageErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', margin: 24, background: '#fff1f2', borderRadius: 12 }}>
          <h3 style={{ color: '#dc2626' }}>Page Error: {this.props.name}</h3>
          <pre style={{ fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Suspense fallback spinner (inline styles — no Tailwind dependency)
const Spinner = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'wb-spin 0.7s linear infinite' }} />
    <style>{`@keyframes wb-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Wrap each lazy page with its own error boundary + suspense
const Page = ({ component: C, name }) => (
  <PageErrorBoundary name={name}>
    <Suspense fallback={<Spinner />}>
      <C />
    </Suspense>
  </PageErrorBoundary>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── Dashboard redirect ────────────────────────────────────────────────────────
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role === 'admin')    return <Navigate to="/admin" />;
  if (user.role === 'provider') return <Navigate to="/provider/dashboard" />;
  return <Navigate to="/customer/dashboard" />;
};

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user && (
        <PageErrorBoundary name="Navbar">
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
        </PageErrorBoundary>
      )}
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"       element={!user ? <Page component={LandingPage} name="LandingPage" /> : <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'provider' ? '/provider/dashboard' : '/customer/dashboard'} replace />} />
          {/* Old auth pages permanently redirected to landing page */}
          <Route path="/login"  element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />

          {/* Smart redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          {/* Customer */}
          <Route path="/customer/dashboard" element={<ProtectedRoute roles={['customer']}><Page component={CustomerDashboard} name="CustomerDashboard" /></ProtectedRoute>} />
          <Route path="/post-job"           element={<ProtectedRoute roles={['customer']}><Page component={PostJob}           name="PostJob"           /></ProtectedRoute>} />

          {/* Provider */}
          <Route path="/provider/dashboard" element={<ProtectedRoute roles={['provider']}><Page component={ProviderDashboard} name="ProviderDashboard" /></ProtectedRoute>} />
          <Route path="/jobs/feed"          element={<ProtectedRoute roles={['provider']}><Page component={JobFeed}           name="JobFeed"           /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/jobs/:id"          element={<ProtectedRoute><Page component={JobDetail}       name="JobDetail"       /></ProtectedRoute>} />
          <Route path="/providers"         element={<ProtectedRoute><Page component={BrowseProviders} name="BrowseProviders" /></ProtectedRoute>} />
          <Route path="/providers/:id"     element={<ProtectedRoute><Page component={ProviderProfile} name="ProviderProfile" /></ProtectedRoute>} />
          <Route path="/chat"              element={<ProtectedRoute><Page component={Chat}            name="Chat"            /></ProtectedRoute>} />
          <Route path="/chat/:otherUserId" element={<ProtectedRoute><Page component={Chat}            name="Chat"            /></ProtectedRoute>} />
          <Route path="/map"               element={<ProtectedRoute><Page component={MapView}         name="MapView"         /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"              element={<ProtectedRoute roles={['admin']}><Page component={AdminPanel}        name="AdminPanel"        /></ProtectedRoute>} />
          <Route path="/admin/verification" element={<ProtectedRoute roles={['admin']}><Page component={AdminVerification} name="AdminVerification" /></ProtectedRoute>} />

          {/* Verification */}
          <Route path="/verify" element={<ProtectedRoute><Page component={VerificationPage} name="VerificationPage" /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
