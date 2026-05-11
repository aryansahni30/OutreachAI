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

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cold_reach_session');
    if (stored) {
      setSessionToken(stored);
    }
    setIsLoading(false);
  }, []);

  // Fetch user info when token exists
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

  const login = useCallback(async () => {
    try {
      // Get OAuth config from backend
      const configRes = await fetch(`${API_BASE}/auth/google/config`);
      const config = await configRes.json();

      // Build Google OAuth URL
      const redirectUri = window.location.origin;
      const params = new URLSearchParams({
        client_id: config.client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes,
        access_type: 'offline',
        prompt: 'consent',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // Open popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      if (!popup) {
        // Popup blocked — fall back to redirect
        window.location.href = authUrl;
        return;
      }

      // Poll popup for auth code in URL
      const pollInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval);
            return;
          }

          const popupUrl = popup.location.href;
          if (!popupUrl.startsWith(window.location.origin)) return;

          clearInterval(pollInterval);
          popup.close();

          const popupParams = new URLSearchParams(new URL(popupUrl).search);
          const code = popupParams.get('code');

          if (!code) return;

          // Exchange code for session via backend
          const exchangeRes = await fetch(`${API_BASE}/auth/google/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          });

          if (!exchangeRes.ok) {
            const err = await exchangeRes.json();
            throw new Error(err.detail || 'Auth failed');
          }

          const data = await exchangeRes.json();
          localStorage.setItem('cold_reach_session', data.session_token);
          setSessionToken(data.session_token);
          setUser(data.user);
        } catch {
          // Cross-origin — popup still on Google's domain, keep polling
        }
      }, 500);
    } catch {
      // Config fetch failed
    }
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
