import { create } from 'zustand';
import apiClient from '../services/apiClient';

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
      const errorMessage = error.response?.data?.message || 'Registration failed';
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
      const errorMessage = error.response?.data?.message || 'Login failed';
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
      const errorMessage = error.response?.data?.message || 'Google sign-in failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getMe: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({ currentUser: response.data.data });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch user' });
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
      const { user } = response.data.data;
      set({ currentUser: user, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept terms';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
