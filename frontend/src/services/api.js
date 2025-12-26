import axios from 'axios';

// 👇 Vite Proxy handles the /api prefix
const API_BASE_URL = "/api";

const api_client = axios.create({
  baseURL: API_BASE_URL,
});

api_client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  // --- AUTH ---
  login: async (username, password) => {
    const response = await api_client.post('/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('username', response.data.username);
    }
    return response.data;
  },

  register: async (username, password) => {
    const response = await api_client.post('/register', { username, password });
    return response.data;
  },
  
  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },

  // --- VIDEO DATA ---
  getVideoStatus: async (videoId) => {
    try {
      const res = await api_client.get(`/status?video_id=${videoId}`);
      return res.data; 
    } catch (e) {
      return { status: 'error', indexed: false };
    }
  },

  getFeed: async () => {
    const res = await api_client.get('/feed');
    return res.data;
  },
  
  getMyVideos: async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return []; 
    const res = await api_client.get(`/my_videos?user_id=${userId}`);
    return res.data;
  },

  // 👇 NEW: Hybrid Global Search (Titles + Visuals)
  searchGlobal: async (query) => {
    // Points to our new backend endpoint
    const res = await api_client.get(`/search_global?query=${encodeURIComponent(query)}`);
    return res.data.results || [];
  },

  // 👇 OLD: Deep Search (Inside Video Player)
  searchInVideo: async (query, videoId) => {
    const res = await api_client.get(`/search?query=${encodeURIComponent(query)}&video_id=${videoId}`);
    return res.data.results || [];
  },

  uploadVideo: async (file, title, tags, visibility) => { 
    const userId = localStorage.getItem('user_id'); 
    if (!userId) throw new Error("User not logged in");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    formData.append('title', title || file.name);
    formData.append('tags', tags || "");
    formData.append('visibility', visibility);

    const res = await api_client.post('/upload', formData);
    return res.data;
  },

  // 👇 NEW: Smart Streamer URL (Fixes 404s)
  getVideoUrl: (videoId) => `/api/stream/${videoId}`
};