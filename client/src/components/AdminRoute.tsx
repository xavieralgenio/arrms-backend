import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLocation("/admin/login");
    }
  }, [user]);

  // Prevent render while checking
  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}