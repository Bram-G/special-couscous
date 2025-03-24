'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  login: () => {},
  logout: () => {},
  authFetch: async () => new Response(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true); // Ensure loading state is true at the start
      
      try {
        const storedToken = localStorage.getItem('token');
        
        if (!storedToken) {
          // No token found, clearly not authenticated
          setIsAuthenticated(false);
          setToken(null);
          setIsLoading(false);
          return;
        }
        
        // Token exists, verify it with the backend
        const response = await fetch('http://localhost:8000/auth/verify', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          // Token is valid
          setToken(storedToken);
          setIsAuthenticated(true);
          setVerificationAttempts(0);
        } else if (response.status === 401) {
          // Token is invalid or expired - clear it
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setToken(null);
        } else {
          // Handle network issues or server problems gracefully
          console.warn('Token verification returned status:', response.status);
          // Keep current token on network/server issues but increment attempts
          if (verificationAttempts >= 2) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setToken(null);
          } else {
            // Temporarily assume token is valid until we can verify
            setToken(storedToken);
            setIsAuthenticated(true);
            setVerificationAttempts(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error during authentication initialization:', error);
        // On connection error, keep user logged in if they had a token
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
        }
        setVerificationAttempts(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
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
        // Token might be expired, logout
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
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);