import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import API_BASE_URL from './apiBase';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh'];

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || '';
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path));
    const token = useAuthStore.getState().token;

    if (token && !isPublicAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path));

    if (isPublicAuthRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { token } = useAuthStore.getState();
        if (!token) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        useAuthStore.getState().setToken(response.data.data.token);
        originalRequest.headers.Authorization = `Bearer ${response.data.data.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
