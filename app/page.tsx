"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentRole = window.localStorage.getItem("edexcel-auth-role");
    if (currentRole === "admin") router.replace("/admin");
    if (currentRole === "student") router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resolve-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      const data = (await response.json()) as {
        email?: string;
        fullName?: string | null;
        role?: "admin" | "student";
        error?: string;
      };

      if (!response.ok || !data.role || !data.email) {
        throw new Error(data.error ?? "Unable to login.");
      }

      window.localStorage.setItem("edexcel-auth-role", data.role);
      window.localStorage.setItem("edexcel-auth-email", data.email);
      if (data.fullName) {
        window.localStorage.setItem("edexcel-auth-name", data.fullName);
      } else {
        window.localStorage.removeItem("edexcel-auth-name");
      }
      router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">
            <img className="brand-logo" src="/logo.png" alt="" />
          </span>
          <div>
            <p>EdexcelEasy</p>
            <h1>Recorded lesson login</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
              type="password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" disabled={isSubmitting} type="submit">
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? "Checking..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
