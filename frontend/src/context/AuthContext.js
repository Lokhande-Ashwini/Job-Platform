import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Cache key for persisted user
const USER_KEY = 'cached_user';

export const AuthProvider = ({ children }) => {
  // Initialise from cache so PrivateRoute renders immediately — no blank screen
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  // loading=false immediately if we have a cached user; true only for cold start
  const [loading, setLoading] = useState(() => !localStorage.getItem(USER_KEY) && !!localStorage.getItem('token'));
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Always refresh in background to keep data fresh / validate token
      fetchProfile(true);
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async (background = false) => {
    try {
      const { data } = await api.get('/auth/profile');
      const userData = { ...data, id: data._id || data.id };
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      setUser(null);
    } finally {
      if (!background) setLoading(false);
      else setLoading(false); // always clear loading
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    await fetchProfile();
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    await fetchProfile();
    setShowSetupPrompt(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setShowSetupPrompt(false);
  };

  const refreshUser = async () => { await fetchProfile(); };

  const dismissSetupPrompt = async () => {
    setShowSetupPrompt(false);
    try { await api.patch('/profile/dismiss-new-user'); } catch {}
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, loading, refreshUser,
      showSetupPrompt, setShowSetupPrompt, dismissSetupPrompt
    }}>
      {children}
    </AuthContext.Provider>
  );
};
