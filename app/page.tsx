"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";

const ADMIN_EMAIL = "admin@edexceleasy.com";
const ADMIN_PASSWORD = "admin123";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [error, setError] = useState("");

  useEffect(() => {
    const currentRole = window.localStorage.getItem("edexcel-auth-role");
    if (currentRole === "admin") router.replace("/admin");
    if (currentRole === "student") router.replace("/dashboard");
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (role === "admin") {
      if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        setError("Admin email or password is incorrect.");
        return;
      }

      window.localStorage.setItem("edexcel-auth-role", "admin");
      window.localStorage.setItem("edexcel-auth-email", normalizedEmail);
      router.push("/admin");
      return;
    }

    window.localStorage.setItem("edexcel-auth-role", "student");
    window.localStorage.setItem("edexcel-auth-email", normalizedEmail);
    router.push("/dashboard");
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

        <div className="role-switch" aria-label="Choose login type">
          <button className={role === "student" ? "active" : ""} onClick={() => setRole("student")} type="button">
            <UserRound size={17} aria-hidden="true" />
            Student
          </button>
          <button className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")} type="button">
            <ShieldCheck size={17} aria-hidden="true" />
            Admin
          </button>
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
              placeholder={role === "admin" ? ADMIN_EMAIL : "student@gmail.com"}
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
              placeholder={role === "admin" ? "admin123" : "Enter password"}
              type="password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" type="submit">
            <LogIn size={18} aria-hidden="true" />
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
