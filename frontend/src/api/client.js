import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get tokens from storage
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Singleton: only one refresh call in flight at a time.
// Any concurrent 401 waits for the same promise instead of firing a second POST /auth/refresh
let refreshPromise = null;

// Response interceptor: handle 401 & refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        // If no refresh is in flight, start one. Otherwise, reuse the existing promise.
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${apiClient.defaults.baseURL}/auth/refresh`, { refresh: refreshToken })
            .then((res) => {
              const { access } = res.data;
              localStorage.setItem('access_token', access);
              // Server rotates refresh tokens — save the new one
              if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
              return access;
            })
            .catch((err) => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.dispatchEvent(new Event('auth-unauthorized'));
              return Promise.reject(err);
            })
            .finally(() => {
              refreshPromise = null; // Reset so a future genuine expiry triggers a fresh refresh
            });
        }

        try {
          const newAccess = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      } else {
         // No refresh token found
         window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
