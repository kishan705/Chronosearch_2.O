import React, { useState } from 'react';
import { Search, Upload, Home, LogOut, Menu, X, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Navbar({ onSearch, onUpload }) {
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // If we are on the Home page, this triggers the live search
    if (onSearch) {
      onSearch(query);
    } 
    // If we are in the Video Player, we should go back to Home to search globally
    else {
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-neutral-950 border-b border-white/10 z-50 px-4 flex items-center justify-between">
      
      {/* Logo & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden md:block">
            ChronoSearch
          </span>
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:flex relative">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-neutral-900 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:bg-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
            placeholder="Search for 'Dragons', 'Red Car'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* 🏠 NEW: Home Button */}
        <Link to="/" className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Home Feed">
            <Home className="w-5 h-5" />
        </Link>

        <button 
          onClick={onUpload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-900/20"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        <Link to="/profile" className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
           <User className="w-5 h-5" />
        </Link>
        
        <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}