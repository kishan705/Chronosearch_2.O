import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Lock, Globe, Loader2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username') || "User";

  useEffect(() => {
    loadMyVideos();
  }, []);

  const loadMyVideos = async () => {
    try {
      const data = await api.getMyVideos();
      setVideos(data);
    } catch (e) {
      console.error("Failed to load profile videos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-12 border-b border-zinc-800 pb-8">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-black shadow-xl">
            <User className="w-12 h-12 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">{username}</h1>
            <div className="flex gap-4 text-zinc-500 text-sm">
                <span>{videos.length} Videos</span>
                <span>•</span>
                <span>Member since 2024</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-zinc-600 pl-1" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No videos yet</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                    Upload your first video to see it here. It will be stored safely in the cloud.
                </p>
            </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.video_id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors">
              
              {/* Thumbnail / Player Wrapper */}
              <div className="aspect-video bg-black relative">
                <Link to={`/video/${video.video_id}`}>
                    <video 
                        src={api.getVideoUrl(video.video_id)} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        preload="metadata"
                        // Note: We don't use 'controls' here to make it look like a clean thumbnail
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 text-white pl-1" />
                        </div>
                    </div>
                </Link>

                {/* Privacy Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-white/10">
                    {video.visibility === 'private' ? (
                        <>
                            <Lock className="w-3 h-3 text-red-400" />
                            <span className="text-red-100 font-medium capitalize">Private</span>
                        </>
                    ) : (
                        <>
                            <Globe className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-100 font-medium capitalize">Public</span>
                        </>
                    )}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4">
                <Link to={`/video/${video.video_id}`}>
                    <h3 className="font-bold text-lg truncate hover:text-blue-400 transition-colors">
                        {video.filename}
                    </h3>
                </Link>
                <div className="flex justify-between items-center mt-2 text-xs text-zinc-500">
                    <span className="font-mono">{video.video_id.substring(0, 8)}...</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}