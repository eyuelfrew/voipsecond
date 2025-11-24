import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RequireAuth from './components/RequireAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import { SIPProvider } from './components/SIPProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { ShiftProvider } from './contexts/ShiftContext';
import Analytics from './pages/Analytics';
import PhoneNumbers from './pages/PhoneNumbers';
import ShiftManagement from './pages/ShiftManagement';
import CustomerTimeline from './pages/CustomerTimeline';
import QualityMonitoring from './pages/QualityMonitoring';
import TeamCollaboration from './pages/TeamCollaboration';
import { setupAxiosInterceptors } from './utils/axiosInterceptor';
import useStore from './store/store';
import './App.css';

// Wrapper component to access router hooks
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const agent = useStore(state => state.agent);

  useEffect(() => {
    // Setup axios interceptors on mount
    const handleUnauthorized = () => {
      useStore.getState().logout();
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location } });
      }
    };
    
    setupAxiosInterceptors(handleUnauthorized);
  }, [navigate, location]);

  return (
    <SIPProvider>
      <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/analytics"
              element={
                <RequireAuth>
                  <Layout>
                    <Analytics />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/phone-numbers"
              element={
                <RequireAuth>
                  <Layout>
                    <PhoneNumbers />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/shift-management"
              element={
                <RequireAuth>
                  <Layout>
                    <ShiftManagement />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/customer-timeline"
              element={
                <RequireAuth>
                  <Layout>
                    <CustomerTimeline />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/quality-monitoring"
              element={
                <RequireAuth>
                  <Layout>
                    <QualityMonitoring />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/team-collaboration"
              element={
                <RequireAuth>
                  <Layout>
                    <TeamCollaboration />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SIPProvider>
    );
  }

function App() {
  return (
    <ThemeProvider>
      <ShiftProvider>
        <Router>
          <AppContent />
        </Router>
      </ShiftProvider>
    </ThemeProvider>
  );
}

export default App;
