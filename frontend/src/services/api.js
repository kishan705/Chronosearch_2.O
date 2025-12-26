import axios from 'axios';

// 🛑 IMPORTANT: Replace this with your ACTUAL Modal Backend URL
// It usually looks like: https://kishanamaliya--chronosearch-v8-golden-chrono-api.modal.run
// Do NOT include the trailing slash or "/api" here.
const CLOUD_URL =import.meta.env.VITE_API_URL;

const api_client = axios.create({
  baseURL: `${CLOUD_URL}/api`, // We append /api here automatically
});

api_client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  // --- AUTH ---
  login: async (username, password) => {
    // Note: We use URLSearchParams for OAuth2 compatibility if needed, 
    // but JSON body is fine given your backend setup.
    const response = await api_client.post('/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('username', response.data.username);
    }
    return response.data;
  },

  // 👇 ADDED THIS (Missing in your code)
  googleLogin: async (token) => {
    const response = await api_client.post('/google_login', { token });
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

  searchGlobal: async (query) => {
    const res = await api_client.get(`/search_global?query=${encodeURIComponent(query)}`);
    return res.data.results || [];
  },

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
  
  reindexVideo: async (videoId) => {
    const userId = localStorage.getItem('user_id');
    const formData = new FormData();
    formData.append('user_id', userId);

    // We send video_id in URL, and user_id in Body (Form)
    const res = await api_client.post(`/reindex?video_id=${videoId}`, formData);
    return res.data;
  },

  // 👇 UPDATED: Uses the Full Cloud URL to avoid Proxy Issues
  getVideoUrl: (videoId) => `${CLOUD_URL}/api/stream/${videoId}`
};