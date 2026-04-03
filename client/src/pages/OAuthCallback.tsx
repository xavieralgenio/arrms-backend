import { useEffect } from "react";
import { useLocation } from "wouter";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // After OAuth, just redirect to home (or dashboard)
    setTimeout(() => {
      setLocation("/");
    }, 1000);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Signing you in...</p>
    </div>
  );
}