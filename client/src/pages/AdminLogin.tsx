import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");

  function login() {
    // TEMP MVP AUTH
    if (password === "arrmsadmin") {
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "admin" })
      );

      setLocation("/admin");
    } else {
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

      <button onClick={login}>Login</button>
    </div>
  );
}