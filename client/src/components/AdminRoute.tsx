import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type Props = {
  children: ReactNode;
};

export default function AdminRoute({ children }: Props) {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: false,
  });

  const [, setLocation] = useLocation();

  // 🔥 Handle redirects SAFELY after loading
  useEffect(() => {
    if (loading) return;

    // ❌ Not logged in
    if (!user) {
      setLocation("/login");
      return;
    }

    // ❌ Not admin
    if (user.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [user, loading, setLocation]);

  // ⏳ Wait for auth check
  if (loading) {
    return <div>Loading...</div>;
  }

  // 🔥 Prevent render while redirecting
  if (!user || user.role !== "admin") {
    return null;
  }

  // ✅ Admin allowed
  return <>{children}</>;
}