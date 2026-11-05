"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, HeartPulse } from "lucide-react";
import { apiFetch } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", dob: "", gender: "", phone: "", blood_group: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon"><Activity size={25} /></span>
          <span><strong>MediCare</strong><small>Healthcare Portal</small></span>
        </Link>
        <div className="auth-visual-content">
          <span className="auth-pill"><HeartPulse size={15} /> YOUR HEALTH, OUR PRIORITY</span>
          <h1>Care starts<br />with a connection.</h1>
          <p>Create a patient account to manage appointments and access your care information.</p>
        </div>
        <div className="auth-visual-footer">Designed to make healthcare simpler.</div>
        <div className="auth-decoration auth-decoration-one" />
        <div className="auth-decoration auth-decoration-two" />
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="auth-brand-icon"><Activity size={23} /></span><strong>MediCare</strong></div>
          <div className="auth-heading">
            <span className="auth-eyebrow">PATIENT REGISTRATION</span>
            <h2>Create your account</h2>
            <p>Your password must contain at least 12 characters.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field"><label htmlFor="full_name">Full name</label><input id="full_name" name="full_name" value={form.full_name} onChange={update} autoComplete="name" required maxLength={200} /></div>
            <div className="auth-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={update} autoComplete="email" required maxLength={254} /></div>
            <div className="auth-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" value={form.password} onChange={update} autoComplete="new-password" required minLength={12} maxLength={72} /></div>
            <div className="auth-field"><label htmlFor="dob">Date of birth (optional)</label><input id="dob" name="dob" type="date" value={form.dob} onChange={update} /></div>
            <div className="auth-field"><label htmlFor="gender">Gender (optional)</label><input id="gender" name="gender" value={form.gender} onChange={update} maxLength={50} /></div>
            <div className="auth-field"><label htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" maxLength={40} /></div>
            <div className="auth-field"><label htmlFor="blood_group">Blood group (optional)</label><input id="blood_group" name="blood_group" value={form.blood_group} onChange={update} maxLength={10} /></div>
            {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create patient account"}<ArrowRight size={17} /></button>
          </form>
          <p className="auth-terms">Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
