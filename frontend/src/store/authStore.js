import { create } from 'zustand';
import apiClient from '../services/apiClient';
import API_BASE_URL from '../services/apiBase';

const getAuthErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.status) return `${fallback}. API returned ${error.response.status}.`;
  if (error.request) return `${fallback}. Could not reach API at ${API_BASE_URL}.`;
  return fallback;
};

export const useAuthStore = create((set) => ({
  currentUser: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  register: async (email, password, name, termsAccepted = false, termsVersion = '1.0') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        termsAccepted,
        termsVersion,
      });
      const { token, user } = response.data.data;
      set({ token, currentUser: user, loading: false });
      localStorage.setItem('token', token);
      return response.data.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error, 'Registration failed');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      const { token, user } = response.data.data;
      set({ token, currentUser: user, loading: false });
      localStorage.setItem('token', token);
      return response.data.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error, 'Login failed');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, token: null, error: null });
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/google', { credential });
      const { token, user, requiresTermsAcceptance } = response.data.data;
      set({ token, currentUser: user, loading: false });
      localStorage.setItem('token', token);
      return { ...response.data.data, requiresTermsAcceptance };
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error, 'Google sign-in failed');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getMe: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/auth/me');
      set({ currentUser: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: getAuthErrorMessage(error, 'Failed to fetch user'), loading: false });
      throw error;
    }
  },

  acceptTerms: async (termsAccepted = true, termsVersion = '1.0') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/accept-terms', {
        termsAccepted,
        termsVersion,
      });
      const { token, user } = response.data.data;
      if (token) {
        localStorage.setItem('token', token);
      }
      set({ token: token || localStorage.getItem('token'), currentUser: user, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error, 'Failed to accept terms');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteAccount: async ({ currentPassword = '', confirmation = 'DELETE' } = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/delete-account', {
        currentPassword,
        confirmation,
      });
      localStorage.removeItem('token');
      set({ currentUser: null, token: null, loading: false, error: null });
      return response.data.data;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error, 'Account deletion failed');
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));

