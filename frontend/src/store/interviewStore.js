import { create } from 'zustand';
import apiClient from '../services/apiClient';

export const useInterviewStore = create((set) => ({
  currentInterview: null,
  interviewHistory: [],
  totalInterviewCount: 0,
  loading: false,
  error: null,

  startInterview: async (type, level, duration = 'standard', analysisType = 'basic') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/interview/start', {
        interviewType: type,
        difficultyLevel: level,
        duration,
        analysisType,
      });
      set({ currentInterview: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start interview';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  startLiveInterview: async (type, level, duration = 'standard', analysisType = 'basic', resumeText = '', jobDescription = '', coachMode = false) => {
    set({ loading: true, error: null });
    try {
      const body = {
        interviewType: type,
        difficultyLevel: level,
        duration,
        analysisType,
      };
      if (resumeText) body.resumeText = resumeText;
      if (jobDescription) body.jobDescription = jobDescription;
      if (coachMode) body.coachMode = true;

      const response = await apiClient.post('/interview/start-live', body);
      set({ currentInterview: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start live interview';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getInterview: async (interviewId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/interview/${interviewId}`);
      set({ currentInterview: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch interview';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  processAudio: async (interviewId, audioBlob) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await apiClient.post(
        `/interview/${interviewId}/process-audio`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      set({ currentInterview: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to process audio';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getHistory: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/interview/user/history', {
        params: { page, limit },
      });
      const data = response.data.data;
      set({
        interviewHistory: data.interviews || data,
        totalInterviewCount: data.total || (data.interviews || data).length,
        loading: false,
      });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch history';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  clearCurrent: () => {
    set({ currentInterview: null });
  },
}));
