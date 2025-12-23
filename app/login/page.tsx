"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, User, Lock, Eye, EyeOff, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import { setToken, getToken } from "@/lib/auth/token";
import type { LoginRequest, LoginResponse, AuthMeResponse } from "@/lib/auth/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if already logged in
  useEffect(() => {
    const token = getToken();
    if (token) {
      // If token exists, verify it and redirect
      apiClient
        .get<AuthMeResponse>("/auth/me")
        .then((user) => {
          if (user.role === "admin") {
            router.push("/admin");
          } else if (user.role === "biller") {
            router.push("/biller");
          }
        })
        .catch(() => {
          // Token is invalid, continue with login form
        });
    }
  }, [router]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = "Username, Operator ID, or Email is required";
    } else {
      const trimmedUsername = username.trim();
      // Allow: emails, Operator IDs (e.g., OP-4829), or usernames (alphanumeric + underscores/hyphens, 3+ chars)
      const isValid =
        /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(trimmedUsername) || // Email
        /^[A-Z]{2}-\d+$/i.test(trimmedUsername) || // Operator ID (OP-4829)
        /^[a-zA-Z0-9_-]{3,}$/.test(trimmedUsername); // Username (alphanumeric + underscore/hyphen, 3+ chars)
      
      if (!isValid) {
        newErrors.username = "Please enter a valid username, email, or Operator ID (e.g., OP-4829)";
      }
    }

    if (!password) {
      newErrors.password = "Password or PIN is required";
    } else if (password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Login request
      const loginData: LoginRequest = {
        username: username.trim(),
        password,
      };

      const response = await apiClient.post<LoginResponse>("/auth/login", loginData, {
        requireAuth: false,
      });

      // Store token in localStorage (backend returns access_token)
      setToken(response.access_token);

      // Also set token in cookie for server-side access
      document.cookie = `pos_auth_token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`;

      // Fetch user profile (backend returns User directly, not wrapped)
      const user = await apiClient.get<AuthMeResponse>("/auth/me");

      // Route based on role or redirect parameter
      const redirectTo = searchParams.get("redirect");
      if (redirectTo && (redirectTo.startsWith("/admin") || redirectTo.startsWith("/biller"))) {
        router.push(redirectTo);
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "biller") {
        router.push("/biller");
      } else {
        router.push("/");
      }
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        const apiError = error as { status: number; message: string };
        if (apiError.status === 401) {
          setErrors({ general: "Invalid username or password" });
        } else if (apiError.status === 429) {
          setErrors({ general: apiError.message || "Too many login attempts. Please try again later." });
        } else {
          setErrors({ general: apiError.message || "Login failed. Please try again." });
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {/* Header with blurred background effect */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <div className="h-6 w-6 text-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 8l4-4 4 4M8 16l4 4 4-4" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CulinaryPOS</h1>
                <p className="text-sm text-muted-foreground">ENTERPRISE EDITION</p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="px-6 pb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-1">Sign In</h2>
              <p className="text-sm text-muted-foreground">
                Enter your Username, Operator ID, or Email and PIN to access the terminal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* General Error */}
              {errors.general && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {errors.general}
                </div>
              )}

              {/* Email/Operator ID/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-muted-foreground">
                  Operator ID / Email / Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="ex. username, OP-4829, or email@example.com"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: undefined });
                    }}
                    className={`pl-10 ${errors.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password/PIN Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  Password / PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your PIN"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Logging in..."
                ) : (
                  <>
                    Login to Terminal
                    <LogIn className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Footer Links */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                  disabled={isLoading}
                >
                  <HeadphonesIcon className="h-4 w-4" />
                  Support
                </button>
              </div>
            </form>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>System Online</span>
              </div>
              <span>v3.4.1 (Build 290)</span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          © 2024 Culinary Systems Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

