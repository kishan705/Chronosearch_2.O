//..........................App.jsx >>>>>>>>>>>>>>

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import Profile from './pages/Profile';
import Login from './pages/Login'; 
import UploadModal from './components/UploadModal';

// 🛡️ Guard Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// 🎨 Layout Component
// We accept onSearch here to pass it down to Navbar
const Layout = ({ children, onSearch, onUploadClick }) => {
  const location = useLocation();
  if (location.pathname === '/login') return children;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      <Navbar 
        onSearch={onSearch} 
        onUpload={() => onUploadClick(true)} 
      />
      <div className="pt-0"> 
        {children}
      </div>
    </div>
  );
};

function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // 👇 NEW: State to hold the global search text
  const [searchQuery, setSearchQuery] = useState('');

  const handleUploadSuccess = () => {
    console.log("Upload successful, refreshing views...");
    // Ideally, trigger a refresh in Home, but for now a reload works or Home will auto-update if logic allows
    window.location.reload(); 
  };

  return (
    <Router>
      {/* 🌍 Global Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* 🏠 HOME ROUTE: Connected to Search State */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout 
              onUploadClick={setIsUploadOpen} 
              onSearch={setSearchQuery} // 👈 Pass Search Handler
            >
              <Home searchQuery={searchQuery} /> {/* 👈 Pass Search State */}
            </Layout>
          </PrivateRoute>
        } />

        {/* 👤 PROFILE ROUTE */}
        <Route path="/profile" element={
          <PrivateRoute>
            <Layout onUploadClick={setIsUploadOpen}>
              {/* No onSearch passed here -> Navbar will navigate to Home?q=... */}
              <Profile />
            </Layout>
          </PrivateRoute>
        } />

        {/* 🎥 VIDEO PLAYER ROUTE */}
        <Route path="/video/:videoId" element={
          <PrivateRoute>
            <Layout onUploadClick={setIsUploadOpen}>
              {/* No onSearch passed here -> Navbar will navigate to Home?q=... */}
              <VideoPlayer />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;