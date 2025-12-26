
//..........................UploadModal.jsx >>>>>>>>>>>>>>

import React, { useState, useCallback } from 'react'; // Added useCallback for stability
import { Upload, X, Lock, Globe, Loader2, Tag, Type, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
        // Basic validation for project safety
        if (selected.size > 100 * 1024 * 1024) {
            setError("File too large. Max 50MB allowed.");
            return;
        }
        setFile(selected);
        setError('');
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    // 🛑 1. Guard against empty files or double-clicks
    if (!file || loading) return;

    setLoading(true);
    setError('');

    try {
      console.log("🚀 Initializing AI Indexing for:", title);
      
      // 2. We pass the file + metadata to your service
      // Ensure your api.uploadVideo matches this signature
      await api.uploadVideo(file, title, tags, visibility);
      
      console.log("✅ Server Accepted Video. AI Processing started.");
      
      // 3. Prevent 429 by clearing state BEFORE notifying parent
      setFile(null); 
      setTitle(''); 
      setTags('');
      
      onUploadSuccess(); // Update list in dashboard
      onClose(); // Close the modal
      
    } catch (err) {
      console.error("Upload Error:", err);
      
      // 🛑 4. Check specifically for the 429 error
      if (err.response?.status === 429) {
        setError("Rate limit reached. Please wait 2 minutes before next upload.");
      } else {
        setError(err.response?.data?.detail || "Upload failed. Is the Backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg relative shadow-2xl animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          disabled={loading} // Prevent closing while uploading
          className="absolute top-4 right-4 text-neutral-400 hover:text-white disabled:opacity-0"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Upload Video</h2>

        {!file ? (
            <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer relative group">
                <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-neutral-400 group-hover:text-blue-400" />
                    </div>
                    <span className="text-white font-medium text-lg">Click to upload Video</span>
                    <span className="text-neutral-500 text-sm mt-2">MP4 only (Max 50MB)</span>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-800/50 p-3 rounded-lg border border-neutral-700">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-blue-400 text-sm font-mono truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => setFile(null)} 
                      disabled={loading}
                      className="text-neutral-400 hover:text-red-400 text-xs disabled:opacity-0"
                    >
                        Change
                    </button>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-neutral-400 ml-1 flex items-center gap-1"><Type className="w-3 h-3"/> Video Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        placeholder="e.g. Cinematic Dragon Scene"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-neutral-400 ml-1 flex items-center gap-1"><Tag className="w-3 h-3"/> AI Search Tags</label>
                    <input 
                        type="text" 
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={loading}
                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        placeholder="fire, green, fantasy..."
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setVisibility('public')}
                        disabled={loading}
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${visibility === 'public' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-neutral-700 text-neutral-500 hover:bg-neutral-800'}`}
                    >
                        <Globe className="w-4 h-4" /> Public
                    </button>
                    <button 
                        onClick={() => setVisibility('private')}
                        disabled={loading}
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${visibility === 'private' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-neutral-700 text-neutral-500 hover:bg-neutral-800'}`}
                    >
                        <Lock className="w-4 h-4" /> Private
                    </button>
                </div>
            </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className={`w-full mt-6 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${loading ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black hover:bg-neutral-200'}`}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Content...
                </>
            ) : (
                'Generate AI Index'
            )}
        </button>
      </div>
    </div>
  );
}