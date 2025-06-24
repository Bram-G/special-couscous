"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  authFetch: async () => new Response(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true); // Ensure loading state is true at the start

      try {
        const storedToken = localStorage.getItem("token");

        if (!storedToken) {
          // No token found, clearly not authenticated
          setIsAuthenticated(false);
          setToken(null);
          setUser(null);
          setIsLoading(false);

          return;
        }

        // Token exists, verify it with the backend
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          // Token is valid
          const userData = await response.json();

          setToken(storedToken);
          setIsAuthenticated(true);

          // Make sure we have user data with at least a username
          if (userData.user) {
            setUser({
              id: userData.user.id,
              username: userData.user.username,
              email: userData.user.email,
            });
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // On error, assume not authenticated and clean up
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    // User data will be fetched on next page load
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    };

    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        user,
        login,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};