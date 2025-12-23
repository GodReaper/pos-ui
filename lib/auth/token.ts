/**
 * Token management utilities
 * Handles storage and retrieval of authentication token
 */

const TOKEN_KEY = "pos_auth_token";

/**
 * Get token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear token from localStorage and cookies
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Clear cookie
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null;
}

