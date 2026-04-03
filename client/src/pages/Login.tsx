import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ TRPC login mutation
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async () => {
    // ✅ prevent empty login
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const user = await loginMutation.mutateAsync({
        email,
        password,
      });

      if (!user) return;

      // 🔥 IMPORTANT: FULL PAGE RELOAD (fixes auth state issue)
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/post-login";
      }
    } catch (err) {
      console.error(err);
      alert("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {/* Email */}
        <input
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loginMutation.isPending}
          className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>

        {/* OPTIONS */}
        <div className="flex flex-col gap-2 pt-2 text-center">
          <button
            onClick={() => setLocation("/register")}
            className="text-emerald-600 hover:underline"
          >
            Create Account
          </button>

          <button
            onClick={() => setLocation("/")}
            className="text-slate-500 hover:underline"
          >
            Go back to Home
          </button>
        </div>
      </div>
    </div>
  );
}