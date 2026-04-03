import { useLocation } from "wouter";

export default function PostLogin() {
  const [, setLocation] = useLocation();

  return (
    <div>
      <h2>What would you like to do?</h2>

      <button onClick={() => setLocation("/")}>
        Go back to Home
      </button>

      <button onClick={() => setLocation("/register")}>
        Create Account
      </button>
    </div>
  );
}