"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Updated User interface to include Groups
interface Group {
  id: number;
  name: string;
  createdById?: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  Groups?: Group[]; 
}

// Updated AuthContextType to include currentGroupId
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  currentGroupId: number | null;
  setCurrentGroupId: (groupId: number | null) => void; 
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  authFetch: async () => new Response(),
  currentGroupId: null, 
  setCurrentGroupId: () => {}, 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const storedToken = localStorage.getItem("token");

        if (!storedToken) {
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
          const userData = await response.json();

          setToken(storedToken);
          setIsAuthenticated(true);

          if (userData.user) {
            setUser({
              id: userData.user.id,
              username: userData.user.username,
              email: userData.user.email,
              Groups: userData.user.Groups,
            });
          }
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
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

  // Separate useEffect to set currentGroupId when user changes
  useEffect(() => {
    if (user?.Groups && user.Groups.length > 0) {
      // Try to load saved group ID from localStorage
      const savedGroupId = localStorage.getItem('currentGroupId');
      
      if (savedGroupId) {
        const groupIdNum = parseInt(savedGroupId);
        // Check if saved group ID is still valid for this user
        if (user.Groups.some(g => g.id === groupIdNum)) {
          setCurrentGroupId(groupIdNum);
          return;
        }
      }
      
      // If no saved group or saved group is invalid, use first group
      setCurrentGroupId(user.Groups[0].id);
      localStorage.setItem('currentGroupId', user.Groups[0].id.toString());
    } else {
      // User has no groups
      setCurrentGroupId(null);
      localStorage.removeItem('currentGroupId');
    }
  }, [user]); // Run when user changes

  // Save currentGroupId to localStorage when it changes
  useEffect(() => {
    if (currentGroupId !== null) {
      localStorage.setItem('currentGroupId', currentGroupId.toString());
    }
  }, [currentGroupId]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentGroupId");
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setCurrentGroupId(null);
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
        currentGroupId,
        setCurrentGroupId,
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