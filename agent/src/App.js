import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RequireAuth from './components/RequireAuth';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import { SIPProvider } from './components/SIPProvider';
import './App.css';

function App() {
  return (
    <Router>
      <SIPProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <RequireAuth>
                  <Dashboard />
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
