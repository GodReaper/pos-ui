/**
 * Authentication and Authorization utilities
 * Handles RBAC (Role-Based Access Control) for admin and biller roles
 */

import type { UserRole, User } from "./auth/types";

export type { UserRole, User } from "./auth/types";

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;

  // Admin has access to everything
  if (user.role === "admin") return true;

  return user.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}

/**
 * Check if user is biller
 */
export function isBiller(user: User | null): boolean {
  if (!user) return false;
  return user.role === "biller";
}

/**
 * Require role - throws error if user doesn't have required role
 */
export function requireRole(user: User | null, role: UserRole): void {
  if (!hasRole(user, role)) {
    throw new Error(`Access denied: ${role} role required`);
  }
}

