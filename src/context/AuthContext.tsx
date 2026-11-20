'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../lib/types';
import { apiFetch, getToken, removeToken, setToken } from '../lib/api';



interface RegisterInput {
  name: string;
  email: string;
  password: string;
  interests: string[];
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch<User>('/auth/me');
        setUser(res.data);
      } catch {
        removeToken();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  //login function to handle user authentication
  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  // Register function to handle user registration
  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  // Logout function to clear the token and user state
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx){
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}