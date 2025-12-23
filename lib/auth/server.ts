/**
 * Server-side authentication utilities
 * Handles token retrieval from cookies for server components
 */

import { cookies } from "next/headers";
import type { AuthMeResponse, User } from "./types";

const TOKEN_KEY = "pos_auth_token";

/**
 * Get token from cookies (server-side)
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value || null;
}

/**
 * Get current user from server-side API call
 * Backend returns User directly (not wrapped in { user: ... })
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const token = await getServerToken();
    if (!token) return null;

    // For server-side, we need to manually pass the token
    // Since apiClient uses localStorage (client-side only),
    // we'll make the request directly here
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    // Backend returns User directly
    const user: AuthMeResponse = await response.json();
    return user;
  } catch (error) {
    return null;
  }
}

