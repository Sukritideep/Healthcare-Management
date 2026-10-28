
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  CalendarCheck,
  Stethoscope,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setMessage(
      "Your form is valid. Sign-in will be enabled when the backend API is connected."
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon">
            <Activity size={25} />
          </span>
          <span>
            <strong>MediCare</strong>
            <small>Healthcare Portal</small>
          </span>
        </Link>

        <div className="auth-visual-content">
          <span className="auth-pill">
            <HeartPulse size={15} />
            YOUR HEALTH, OUR PRIORITY
          </span>

          <h1>
            Better care.
            <br />
            Healthier lives.
          </h1>

          <p>
            Your healthcare journey, all in one place. Manage
            appointments, access prescriptions and stay connected
            with your care team.
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">
              <CalendarCheck size={21} />
            </span>
            <span>
              <strong>Easy appointment management</strong>
              <small>Book and manage your visits with ease.</small>
            </span>
          </div>

          <div className="auth-feature">
            <span className="auth-feature-icon">
              <ShieldCheck size={21} />
            </span>
            <span>
              <strong>Care in one secure place</strong>
              <small>Access your health information conveniently.</small>
            </span>
          </div>
        </div>

        <div className="auth-visual-footer">
          Designed to make healthcare simpler.
        </div>

        <div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" />
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon">
              <Activity size={23} />
            </span>
            <strong>MediCare</strong>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Enter your details to access your healthcare portal.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-role">Sign in as</label>
              <select
                id="login-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={() =>
                    setError(
                      "Password recovery will be connected to the backend."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="auth-alert auth-error">{error}</p>
            )}

            {message && (
              <p className="auth-alert auth-success">{message}</p>
            )}

            <button className="auth-submit" type="submit">
              Sign in
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="auth-divider">
            <span>NEW TO MEDICARE?</span>
          </div>

          <Link href="/register" className="auth-outline-button">
            Create a patient account
          </Link>

          <p className="auth-terms">
            By continuing, you agree to the applicable terms and privacy
            policy.
          </p>

          <div className="auth-help">
            <Stethoscope size={17} />
            <span>Healthcare Management Portal</span>
          </div>
        </div>
      </section>
    </main>
  );
}
