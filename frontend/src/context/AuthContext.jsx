import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid or expired, client.js handles removal/refresh if possible
          console.error('Failed to fetch user profile on init');
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access, refresh } = res.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Fetch profile after login
    const profileRes = await apiClient.get('/auth/me');
    setUser(profileRes.data);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
         // Best effort server-side logout to blacklist token
         await apiClient.post('/auth/logout', { refresh });
      }
    } catch (e) {
      console.error("Logout API failed, continuing client logout.");
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
