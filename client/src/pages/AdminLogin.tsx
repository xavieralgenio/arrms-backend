import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");

  // ✅ tRPC login mutation
  const loginMutation = trpc.auth.login.useMutation();

  async function login() {
    try {
      await loginMutation.mutateAsync({ password });

      // ✅ Redirect after successful login
      setLocation("/admin");
    } catch (err) {
      alert("Wrong password");
    }
  }

  return (
    <div>
      <h2>Admin Login</h2>

      <input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login} disabled={loginMutation.isLoading}>
        {loginMutation.isLoading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}