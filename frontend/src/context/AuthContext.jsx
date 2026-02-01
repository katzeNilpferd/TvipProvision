import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginAPI, register as registerAPI, validateToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedData = localStorage.getItem('authData');
      if (storedData) {
        try {
          const authData = JSON.parse(storedData);
          const token = authData.token?.access_token;
          
          if (token) {
            // Validate the token with the backend
            await validateToken(token);
            setUser(authData.user);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Token is invalid or expired, remove it
          localStorage.removeItem('authData');
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginAPI(username, password);
      
      // Store the complete auth data including user info and token
      localStorage.setItem('authData', JSON.stringify(response.data));
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Invalid credentials';
      
      // Check if it's a blocked account error
      if (error.response?.status === 403 && error.response?.data?.detail === 'User account is blocked') {
        return { success: false, error: errorMessage, isBlocked: true };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, password) => {
    try {
      await registerAPI(username, password);
      // Registration successful, but user needs to login
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('authData');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Handle 401 unauthorized errors
  const handleUnauthorized = () => {
    logout();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    handleUnauthorized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};