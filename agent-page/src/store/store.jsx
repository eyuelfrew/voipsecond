
import { create } from 'zustand';
import axios from 'axios';
import { getApiUrl } from "../config";

const baseUrl = getApiUrl();


// Detect if running in a browser (web) or in an app (mobile/electron/react-native)
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const useStore = create((set, get) => ({
  tickets: [],
  customers: [],
  articles: [],
  selectedArticle: null,
  cannedResponses: [],
  agent: null,
  token: !isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  shift: null,
  call: null,
  selectedTicket: null,

  // Knowledge Base state
  kbArticles: [],
  kbCategories: [],
  selectedKBArticle: null,
  kbPanelOpen: false,
  kbSearchQuery: '',
  kbFilterCategory: 'all',

  // Auth actions
  setAuth: ({ agent, token }) => {
    if (!isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      set({ agent, token });
    } else {
      set({ agent }); // token is managed by cookie for web
    }
  },
  refreshToken: async () => {
    // Call backend refresh endpoint, update agent and SIP credentials
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.agent) {
        const agentWithSip = { ...data.agent, sip: data.sip };
        set({ agent: agentWithSip });
        // Optionally update token if you use it on frontend
        if (data.token) set({ token: data.token });
      } else {
        set({ agent: null });
      }
    } catch (err) {
      set({ agent: null });
    }
  },
  logout: async () => {
    try {
      // Preserve call history before clearing localStorage
      const callHistoryKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('voip_call_history_')
      );
      const callHistoryData = {};
      callHistoryKeys.forEach(key => {
        callHistoryData[key] = localStorage.getItem(key);
      });

      const res = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        timeout: 5000,
      });

      // Clear client-side state
      localStorage.clear();
      sessionStorage.clear();

      // Restore call history
      Object.keys(callHistoryData).forEach(key => {
        localStorage.setItem(key, callHistoryData[key]);
      });

      set({ agent: null, token: null, shift: null, call: null });

      if (!res.ok) {
        console.error('Logout request failed, but client state cleared');
      }

      console.log('✅ Logout complete - Call history preserved');
    } catch (error) {
      // Even if logout fails, clear client-side state but preserve call history
      console.error('Logout error:', error);

      // Preserve call history before clearing
      const callHistoryKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('voip_call_history_')
      );
      const callHistoryData = {};
      callHistoryKeys.forEach(key => {
        callHistoryData[key] = localStorage.getItem(key);
      });

      localStorage.clear();
      sessionStorage.clear();

      // Restore call history
      Object.keys(callHistoryData).forEach(key => {
        localStorage.setItem(key, callHistoryData[key]);
      });

      set({ agent: null, token: null, shift: null, call: null });
    }
  },

  // Helper for auth check
  isAuthenticated: () => {
    if (isWeb) {
      // On web, rely on agent presence (cookie-based session)
      return !!get().agent;
    } else {
      // On app, require token
      return !!get().token;
    }
  },

  // Actions
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  fetchTickets: async () => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/tickets`, config);
    set({ tickets: data });
  },
  fetchCustomers: async () => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/customers`, config);
    set({ customers: data });
  },
  searchArticles: async (query) => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/kb/search?q=${query}`, config);
    set({ articles: data });
  },
  fetchArticleById: async (id) => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/kb/${id}`, config);
    set({ selectedArticle: data });
  },
  fetchCannedResponses: async (query = '') => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/canned-responses?keyword=${query}`, config);
    set({ cannedResponses: data });
  },
  startShift: async (agentId) => {
    // Use agent from store if agentId not provided
    if (!agentId) {
      const agent = get().agent;
      // Support both agent.id and agent._id
      const id = agent && (agent.id || agent._id);
      if (!id) throw new Error('Agent ID is required (no id or _id on agent)');
      agentId = id;
    }
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/shifts/start`, { agentId }, config);
    set({ shift: data });
  },
  endShift: async (shiftId) => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/shifts/end`, { shiftId }, config);
    set({ shift: data });
  },
  // Restore agent from cookie/session
  fetchCurrentAgent: async () => {
    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();

        // Validate response structure
        if (data && data.agent) {
          // Attach SIP credentials if present
          const agentWithSip = data.sip ? { ...data.agent, sip: data.sip } : data.agent;
          set({ agent: agentWithSip });
          return true;
        } else {
          console.error('Invalid authentication response structure');
          set({ agent: null });
          return false;
        }
      } else if (res.status === 401) {
        // Unauthorized - clear state
        console.log('Authentication failed: Unauthorized');
        set({ agent: null, token: null });
        return false;
      } else {
        console.error('Authentication check failed:', res.status);
        set({ agent: null });
        return false;
      }
    } catch (err) {
      console.error('Error fetching current agent:', err);
      set({ agent: null });
      return false;
    }
  },

  // Knowledge Base actions
  fetchKBArticles: async (params = {}) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== 'all') queryParams.append('category', params.category);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.favorites) queryParams.append('favorites', 'true');

      const { data } = await axios.get(`${baseUrl}/kb?${queryParams.toString()}`, config);
      set({ kbArticles: data.articles || [] });

      // Also fetch categories
      const categoriesRes = await axios.get(`${baseUrl}/kb/categories`, config);
      set({ kbCategories: categoriesRes.data.categories || [] });
    } catch (error) {
      console.error('Error fetching KB articles:', error);
      set({ kbArticles: [] });
    }
  },

  createKBArticle: async (articleData) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      const { data } = await axios.post(`${baseUrl}/kb`, articleData, config);

      if (data.success) {
        const currentArticles = get().kbArticles;
        set({ kbArticles: [data.article, ...currentArticles] });
        return data.article;
      }
    } catch (error) {
      console.error('Error creating KB article:', error);
      throw error;
    }
  },

  updateKBArticle: async (id, articleData) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      const { data } = await axios.put(`${baseUrl}/kb/${id}`, articleData, config);

      if (data.success) {
        const currentArticles = get().kbArticles;
        const updatedArticles = currentArticles.map(a =>
          a._id === id ? data.article : a
        );
        set({ kbArticles: updatedArticles });

        // Update selected article if it's the one being edited
        if (get().selectedKBArticle?._id === id) {
          set({ selectedKBArticle: data.article });
        }

        return data.article;
      }
    } catch (error) {
      console.error('Error updating KB article:', error);
      throw error;
    }
  },

  deleteKBArticle: async (id) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      await axios.delete(`${baseUrl}/kb/${id}`, config);

      const currentArticles = get().kbArticles;
      set({ kbArticles: currentArticles.filter(a => a._id !== id) });

      // Clear selected article if it's the one being deleted
      if (get().selectedKBArticle?._id === id) {
        set({ selectedKBArticle: null });
      }
    } catch (error) {
      console.error('Error deleting KB article:', error);
      throw error;
    }
  },

  toggleKBFavorite: async (id) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      const { data } = await axios.patch(`${baseUrl}/kb/${id}/favorite`, {}, config);

      if (data.success) {
        const currentArticles = get().kbArticles;
        const updatedArticles = currentArticles.map(a =>
          a._id === id ? data.article : a
        );
        set({ kbArticles: updatedArticles });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  incrementKBUsage: async (id) => {
    try {
      const token = get().token;
      const config = isWeb
        ? { withCredentials: true }
        : { headers: token ? { Authorization: `Bearer ${token}` } : {} };

      await axios.post(`${baseUrl}/kb/${id}/use`, {}, config);

      // Optionally update local state
      const currentArticles = get().kbArticles;
      const updatedArticles = currentArticles.map(a => {
        if (a._id === id) {
          return {
            ...a,
            usageCount: (a.usageCount || 0) + 1,
            lastUsed: new Date()
          };
        }
        return a;
      });
      set({ kbArticles: updatedArticles });
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  },

  toggleKBPanel: () => {
    set({ kbPanelOpen: !get().kbPanelOpen });
  },

  setKBPanelOpen: (isOpen) => {
    set({ kbPanelOpen: isOpen });
  },

  setSelectedKBArticle: (article) => {
    set({ selectedKBArticle: article });
  },
}));

export default useStore;
