import { useState, type PropsWithChildren } from 'react';
import type { User, AuthResponse } from '../types/api';
import { AuthContext } from './auth-context';
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Failed to parse stored user:', e);
      localStorage.removeItem('user');
      return null;
    }
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = (data: AuthResponse) => {
    console.log('AuthContext: login called with', data);
    setUser(data.user);
    setToken(data.accessToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    console.log('AuthContext: state updated', { user: data.user, token: data.accessToken });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated: !!token 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


