import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RequireAuth from './components/RequireAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import { SIPProvider } from './components/SIPProvider';
import CallHistory from './pages/CallHistory';
import Analytics from './pages/Analytics';
import PhoneNumbers from './pages/PhoneNumbers';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
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
              path="/call-history" 
              element={
                <RequireAuth>
                  <Layout>
                    <CallHistory />
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
              path="/settings" 
              element={
                <RequireAuth>
                  <Layout>
                    <Settings />
                  </Layout>
                </RequireAuth>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SIPProvider>
    </Router>
  );
}

export default App;
