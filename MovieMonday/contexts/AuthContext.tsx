'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          // Verify token validity with your backend
          const response = await fetch('http://localhost:8000/auth/verify', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            // Token is valid
            setToken(storedToken);
            setIsAuthenticated(true);
            // Reset verification attempts on success
            setVerificationAttempts(0);
          } else if (response.status === 401) {
            // Token is invalid or expired
            console.log('Token invalid or expired, logging out');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setToken(null);
          } else {
            // Other error (server issue, network problem, etc.)
            console.warn('Token verification returned non-401 error:', response.status);
            // Only clear token after multiple failed attempts
            if (verificationAttempts >= 2) {
              console.warn('Multiple verification failures, clearing token');
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setToken(null);
            } else {
              // Assume token is valid for now, but track the attempt
              setToken(storedToken);
              setIsAuthenticated(true);
              setVerificationAttempts(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // On network error, assume token is still valid
          setToken(storedToken);
          setIsAuthenticated(true);
          // But track the attempt
          setVerificationAttempts(prev => prev + 1);
        }
      } else {
        setIsAuthenticated(false);
        setToken(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [verificationAttempts]);

  // Global fetch with auth handling
  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Add authorization header
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
    
    try {
      const response = await fetch(url, authOptions);
      
      // Handle 401 Unauthorized errors
      if (response.status === 401) {
        // Token might be expired, try to refresh or logout
        logout();
        throw new Error('Authentication token expired');
      }
      
      return response;
    } catch (error) {
      console.error('Auth fetch error:', error);
      throw error;
    }
  };

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    setVerificationAttempts(0);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      token, 
      login, 
      logout, 
      authFetch // Add the authFetch method to the context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Update the context type interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const useAuth = () => useContext(AuthContext);