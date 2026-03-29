"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient, { serviceUrls } from "@/lib/api/client";
import { toast } from "sonner";

interface User {
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for tokens in localStorage
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`${serviceUrls.auth}/api/v1/auth/login`, {
        username: email,
        password,
      });

      const { access_token, cognito_id_token } = response.data;
      const userObj = { email };

      localStorage.setItem("auth_token", access_token);
      localStorage.setItem("auth_user", JSON.stringify(userObj));

      setUser(userObj);
      toast.success("Login successful", {
        description: `Welcome back, ${email}`,
      });
      router.push("/");
    } catch (error) {
      // Error is handled by apiClient interceptor toast
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      await apiClient.post(`${serviceUrls.auth}/api/v1/auth/signup`, {
        username: email, // Use email as username
        email,
        password,
        fullName: name,
      });

      toast.success("Registration successful", {
        description: "Please sign in with your new account.",
      });
      router.push("/login");
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
