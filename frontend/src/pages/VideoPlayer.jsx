import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Loader2, Play, Sparkles, AlertCircle } from 'lucide-react';

export default function VideoPlayer() {
  const { videoId } = useParams();
  const [videoUrl, setVideoUrl] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isIndexed, setIsIndexed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const videoRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    // 👇 Use new Smart Streamer URL
    setVideoUrl(api.getVideoUrl(videoId)); 
    checkIndexStatus();
    return () => { isMountedRef.current = false; };
  }, [videoId]);

  const checkIndexStatus = async () => {
    if (!isMountedRef.current) return;
    const status = await api.getVideoStatus(videoId);
    if (!isMountedRef.current) return;
    
    setIsIndexed(status.indexed); // Ensure backend returns { indexed: true }
    
    if (!status.indexed) {
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

  const jumpToTimestamp = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-black flex flex-col md:flex-row overflow-hidden pt-16">
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
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-lg">Deep Search</h2>
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
                   {/* Badge */}
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