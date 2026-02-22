import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount and persist across browser restarts
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Verify token is still valid
        const response = await authAPI.getMe();
        const userData = response.data.user;
        
        // Update user state with fresh data from server
        setUser(userData);
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Session validation failed:', error);
        // Token invalid or expired, clear authentication
        clearAuth();
      }
    } else {
      // No stored credentials
      clearAuth();
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    // Store token and user data for session persistence
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Clear all authentication data
    clearAuth();
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuth // Expose for manual refresh if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
