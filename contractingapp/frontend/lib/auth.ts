import type { AuthUser } from './types';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getDecodedToken(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = getDecodedToken();
    if (!decoded) return false;

    // Check token expiry if 'exp' field exists
    const tokenWithExp = decoded as AuthUser & { exp?: number };
    if (tokenWithExp.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (tokenWithExp.exp < now) {
        removeToken();
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
