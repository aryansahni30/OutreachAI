import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
  email: string;
  name: string;
  picture: string;
}

interface UseAuthReturn {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for session token in URL (after OAuth callback redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');

    if (session) {
      localStorage.setItem('cold_reach_session', session);
      setSessionToken(session);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      const stored = localStorage.getItem('cold_reach_session');
      if (stored) {
        setSessionToken(stored);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch user info when we have a token
  useEffect(() => {
    if (!sessionToken) {
      setUser(null);
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('cold_reach_session');
          setSessionToken(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        localStorage.removeItem('cold_reach_session');
        setSessionToken(null);
      });
  }, [sessionToken]);

  const login = useCallback(() => {
    window.location.href = `${API_BASE}/auth/google/login`;
  }, []);

  const logout = useCallback(() => {
    if (sessionToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem('cold_reach_session');
    setSessionToken(null);
    setUser(null);
  }, [sessionToken]);

  return { user, sessionToken, isLoading, login, logout };
}
