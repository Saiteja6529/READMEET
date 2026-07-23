import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        if (data.connected && data.user) {
          setUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // Fallback to localStorage if server check fails (offline/dev)
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved auth_user:", e);
          localStorage.removeItem('auth_user');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleMessage = (event: MessageEvent) => {
      // Validate origin matches our own frontend origin
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.user) {
          setUser(event.data.user);
          localStorage.setItem('auth_user', JSON.stringify(event.data.user));
        } else {
          checkAuthStatus();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const data = await response.json();
      
      // If we are in demo mode (missing Google client ID)
      if (data.isDemo || !data.url) {
        const demoRes = await fetch('/api/auth/login-demo', { method: 'POST' });
        if (demoRes.ok) {
          const demoData = await demoRes.json();
          setUser(demoData.user);
          localStorage.setItem('auth_user', JSON.stringify(demoData.user));
          window.location.href = '/dashboard';
        }
        return;
      }

      const url = data.url;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'google_auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Login error, attempting demo fallback:', error);
      try {
        const demoRes = await fetch('/api/auth/login-demo', { method: 'POST' });
        if (demoRes.ok) {
          const demoData = await demoRes.json();
          setUser(demoData.user);
          localStorage.setItem('auth_user', JSON.stringify(demoData.user));
          window.location.href = '/dashboard';
        }
      } catch (e) {
        console.error('Demo authentication fallback failed:', e);
      }
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
