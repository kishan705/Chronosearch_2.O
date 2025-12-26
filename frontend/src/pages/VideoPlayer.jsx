//..........................Videoplayer.jsx >>>>>>>>>>>>>>
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Loader2, Play, Sparkles, AlertCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';

export default function VideoPlayer() {
  const { videoId } = useParams();
  const [videoUrl, setVideoUrl] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isIndexed, setIsIndexed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 👇 NEW: State for the Custom Modal
  const [showRepairModal, setShowRepairModal] = useState(false);
  
  const videoRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setVideoUrl(api.getVideoUrl(videoId)); 
    checkIndexStatus();
    return () => { isMountedRef.current = false; };
  }, [videoId]);

  const checkIndexStatus = async () => {
    if (!isMountedRef.current) return;
    const meta = await api.getVideoStatus(videoId);
    if (!isMountedRef.current) return;
    
    setIsIndexed(meta.indexed);
    
    if (!meta.indexed) {
      setTimeout(() => {
        if (isMountedRef.current) checkIndexStatus();
      }, 5000);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const hits = await api.searchInVideo(query, videoId);
      setResults(hits);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // 👇 1. Trigger the Modal (Instead of confirm())
  const handleRepairClick = () => {
    setShowRepairModal(true);
  };

  // 👇 2. Actually Run the Repair (Called by Modal Button)
  const confirmRepair = async () => {
    try {
        setShowRepairModal(false); // Close modal
        await api.reindexVideo(videoId);
        alert("✅ Repair Started!\n\nThe system is re-scanning this video. The status will update automatically.");
        window.location.reload(); 
    } catch (err) {
        alert(`❌ Cannot start repair: ${err.response?.data?.error || "Unknown error"}`);
    }
  };

  const jumpToTimestamp = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-black flex flex-col md:flex-row overflow-hidden pt-16 relative">
      
      {/* 👇 CUSTOM REPAIR MODAL */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm relative mx-4 animate-in zoom-in-95 duration-200">
                
                {/* Close X */}
                <button 
                  onClick={() => setShowRepairModal(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                        <RefreshCw className="w-6 h-6 text-purple-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">Run Repair?</h3>
                    <p className="text-zinc-400 text-sm mb-6">
                        This will re-scan the video to fix missing search results. 
                        It takes about 1-2 minutes.
                    </p>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setShowRepairModal(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmRepair}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Run Repair
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Video Area */}
      <div className="flex-1 flex flex-col relative bg-black items-center justify-center">
          <video 
            ref={videoRef}
            src={videoUrl} 
            controls 
            className="w-full h-full max-h-[90vh] object-contain"
            autoPlay
            onError={(e) => console.log("Video Error:", e)}
          />
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold text-lg">Deep Search</h2>
            </div>

            {/* 👇 BUTTON TRIGGERS MODAL */}
            <button 
                onClick={handleRepairClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-zinc-700 group"
                title="Fix stuck video or broken search"
            >
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                Repair
            </button>
          </div>

          {!isIndexed ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
              <div className="text-xs text-yellow-200">
                <span className="font-bold block">AI Processing Video...</span>
                <span className="opacity-70">Search will unlock automatically.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search inside this video..." 
                className="w-full bg-black/50 border border-zinc-700 text-white rounded-xl py-3 pl-10 pr-4 focus:border-purple-500 focus:outline-none transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isSearching && (
            <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                <p className="text-zinc-500 text-sm mt-2">Analyzing frames...</p>
            </div>
          )}

          {!isSearching && results.length === 0 && query && isIndexed && (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500 space-y-2">
              <AlertCircle className="w-8 h-8 opacity-50" />
              <span className="text-sm">No matches found for "{query}"</span>
              {/* Optional Link Trigger */}
              <button onClick={handleRepairClick} className="text-xs text-blue-400 hover:underline mt-1">
                 Results missing? Try Repair.
              </button>
            </div>
          )}

          {results.map((hit, idx) => (
            <button 
              key={idx}
              onClick={() => jumpToTimestamp(hit.timestamp)}
              className="w-full bg-black/20 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/30 rounded-xl p-3 flex items-center gap-4 transition-all group text-left"
            >
              <div className="w-16 h-12 bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-purple-600/20 transition-colors shrink-0">
                <Play className="w-5 h-5 text-zinc-500 group-hover:text-purple-400" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-purple-400 font-mono text-sm font-bold">
                        {new Date(hit.timestamp * 1000).toISOString().substr(14, 5)}
                   </span>
                   <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                     Visual Match
                   </span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${hit.score}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}