/**
 * Authentication types
 * Matches backend API models
 */

export type UserRole = "admin" | "biller";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string; // ISO datetime string
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// AuthMeResponse is just the User object (backend returns User directly)
export type AuthMeResponse = User;
