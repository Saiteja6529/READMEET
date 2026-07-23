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
      // 1. Check local storage first for fast persistence across refreshes
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved auth_user:", e);
          localStorage.removeItem('auth_user');
        }
      }

      // 2. Check server session if backend endpoint is available
      const response = await fetch('/api/auth/status');
      const contentType = response.headers.get('content-type') || '';
      
      // Ensure backend returned JSON (not SPA HTML rewrite from Vercel/Netlify)
      if (response.ok && contentType.includes('application/json')) {
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
      console.warn('Backend auth check skipped/failed:', error);
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
    const executeFallbackLogin = (customUser?: User) => {
      const userToSave: User = customUser || {
        id: 'usr_' + Date.now(),
        email: 'user@readmeet.app',
        name: 'READMEET User',
        picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
      };
      setUser(userToSave);
      localStorage.setItem('auth_user', JSON.stringify(userToSave));
      window.location.href = '/dashboard';
    };

    try {
      const response = await fetch('/api/auth/google/url');
      const contentType = response.headers.get('content-type') || '';
      
      // If backend server returns JSON with OAuth URL
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.url) {
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          
          window.open(
            data.url,
            'google_auth',
            `width=${width},height=${height},left=${left},top=${top}`
          );
          return;
        }

        // If backend is in demo mode
        if (data.isDemo) {
          const demoRes = await fetch('/api/auth/login-demo', { method: 'POST' });
          const demoContentType = demoRes.headers.get('content-type') || '';
          if (demoRes.ok && demoContentType.includes('application/json')) {
            const demoData = await demoRes.json();
            executeFallbackLogin(demoData.user);
            return;
          }
        }
      }

      // If on Vercel / Static host without Node server (returns HTML index), execute instant login
      executeFallbackLogin();
    } catch (error) {
      console.warn('Backend OAuth unavailable, performing instant authentication:', error);
      executeFallbackLogin();
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        await response.json();
      }
    } catch (error) {
      console.warn('Backend logout skipped:', error);
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

