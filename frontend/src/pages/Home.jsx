//..........................Home.jsx >>>>>>>>>>>>>>
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Play, Clock, Eye, Sparkles } from 'lucide-react';

export default function Home({ searchQuery }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams(); // Handle ?q=Dragon from URL

  useEffect(() => {
    loadVideos();
  }, [searchQuery, searchParams]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      // 1. Check if there is a query from Props (Navbar) OR URL
      const query = searchQuery || searchParams.get('q');

      if (query) {
        // 🚀 GLOBAL HYBRID SEARCH
        const results = await api.searchGlobal(query);
        setVideos(results);
      } else {
        // 🏠 STANDARD FEED
        const feed = await api.getFeed();
        setVideos(feed);
      }
    } catch (error) {
      console.error("Failed to load videos", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-8">
        {searchQuery || searchParams.get('q') ? (
            <>
                <Sparkles className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-white">Search Results</h1>
            </>
        ) : (
            <h1 className="text-2xl font-bold text-white">Latest Videos</h1>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="bg-zinc-900 aspect-video rounded-xl" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.length === 0 && (
             <div className="col-span-full text-center py-20 text-zinc-500">
                No videos found. Upload one to get started!
             </div>
          )}

          {videos.map((video) => (
            <Link 
              key={video.video_id} 
              to={`/video/${video.video_id}`} 
              className="group bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-all hover:scale-[1.02]"
            >
              {/* Thumbnail / Preview */}
              <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                <video 
                   src={api.getVideoUrl(video.video_id)} 
                   className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                   muted
                   onMouseOver={e => e.target.play()}
                   onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Play className="w-12 h-12 text-white fill-current" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-white truncate pr-2">{video.title || "Untitled Video"}</h3>
                
                {/* 👇 Show "Visual Match" Badge if found via search */}
                {video.match_type && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                        <Sparkles className="w-3 h-3" />
                        {video.match_type} 
                        {video.timestamp > 0 && <span className="text-white/50 ml-1">at {Math.floor(video.timestamp)}s</span>}
                    </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}