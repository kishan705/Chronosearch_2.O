// Login.jsx ///////////////////////////////////////////////////////////////////

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google'; // 👈 Import this

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(username, password);
        if (data.error) setError(data.error);
        else navigate('/'); 
      } else {
        const data = await api.register(username, password);
        if (data.error) setError(data.error);
        else {
          setIsLogin(true);
          setError("Account created! Please log in.");
        }
      }
    } catch (err) {
      setError("Connection failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log("Sending Google token to backend..."); // Debug log
      const data = await api.googleLogin(credentialResponse.credential);
      
      console.log("Backend response:", data); // Debug log

      if (data.error) {
        setError(data.error);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error("Google Login Error:", err); // See full error in Console
      setError("Google Login failed. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
        </div>

        {/* 👇 GOOGLE LOGIN BUTTON */}
        <div className="flex justify-center mb-6">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="filled_black"
                shape="pill"
                width="300"
            />
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-zinc-900 text-zinc-500">Or use email</span></div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Username / Email"
                className="w-full bg-black/50 border border-zinc-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full bg-black/50 border border-zinc-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Continue' : 'Sign Up')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}


// Login.jsx  END.   ///////////////////////////////////////////////////////////////////