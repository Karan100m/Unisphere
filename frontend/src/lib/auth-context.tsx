import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { UserResponse, AuthResponse, UserSignupInput } from "@/lib/types";

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserResponse>;
  signup: (data: UserSignupInput) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: UserResponse | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "unisphere_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiGet<UserResponse>("/auth/me");
        setUser(me);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiPost<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    void queryClient.invalidateQueries();
    return res.user;
  };

  const signup = async (data: UserSignupInput) => {
    const res = await apiPost<AuthResponse>("/auth/signup", data);
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    void queryClient.invalidateQueries();
    return res.user;
  };

  const logout = async () => {
    try {
      await apiPost("/auth/logout");
    } catch {
      // Non-blocking: local session is cleared regardless
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
  };

  const refreshUser = async () => {
    try {
      const me = await apiGet<UserResponse>("/auth/me");
      setUser(me);
    } catch {
      // keep prior state
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
