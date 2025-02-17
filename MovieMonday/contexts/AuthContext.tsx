'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const getTokenData = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log('Token expired, logging out');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setToken(null);
          } else {
            // Token is valid
            setToken(storedToken);
            setIsAuthenticated(true);
            
            // Optional: Log token data for debugging
            const tokenData = getTokenData(storedToken);
            console.log('Token valid until:', new Date(tokenData?.exp * 1000).toLocaleString());
          }
        } else {
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up token expiration check interval
    const checkTokenInterval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpired(currentToken)) {
        console.log('Token expired during session, logging out');
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTokenInterval);
  }, [router]);

  const login = (newToken: string) => {
    // Validate token before storing
    if (!newToken || isTokenExpired(newToken)) {
      console.error('Invalid or expired token provided');
      return;
    }

    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);

    // Check for redirect after login
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('redirectAfterLogin'); // Clean up any pending redirects
    setToken(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      token,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};