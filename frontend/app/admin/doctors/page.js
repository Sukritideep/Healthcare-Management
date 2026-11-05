"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../components/AppShell";

const initialForm = { full_name: "", email: "", password: "", license_number: "", phone: "", specialization_ids: [] };

export default function DoctorManagementPage() {
  const { user } = useSession();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [doctorResult, specializationResult] = await Promise.all([
      apiFetch("/api/doctors"), apiFetch("/api/specializations"),
    ]);
    setDoctors(doctorResult.doctors);
    setSpecializations(specializationResult.specializations);
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    async function load() {
      try { await refresh(); }
      catch (requestError) { if (active) setError(requestError.message); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user, refresh]);

  async function createDoctor(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      await apiFetch("/api/doctors", { method: "POST", body: JSON.stringify(form) });
      setForm(initialForm); setMessage("Doctor account created and activated."); await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function setDoctorActive(doctor, is_active) {
    setError(""); setMessage("");
    try {
      await apiFetch(`/api/doctors/${doctor.doctor_id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
      setMessage(`${doctor.full_name} ${is_active ? "activated" : "deactivated"}.`); await refresh();
    } catch (requestError) { setError(requestError.message); }
  }

  if (user?.role !== "admin") return <section className="panel"><div className="panel-body">Administrator access is required.</div></section>;

  return <>
    <section className="page-heading"><div><div className="eyebrow">ADMIN WORKSPACE</div><h1 className="page-title">Doctor management</h1><p className="page-description">Create secure doctor accounts and control which doctors patients can book.</p></div></section>
    {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
    {message && <p className="auth-alert" role="status">{message}</p>}
    <section className="panel"><div className="panel-header"><div><h2 className="panel-title">Provision a doctor</h2><p className="panel-subtitle">Accounts receive the doctor role and must use this password to sign in.</p></div></div>
      <form className="auth-form appointment-booking-form" onSubmit={createDoctor}>
        <div className="auth-field"><label htmlFor="doctor-name">Full name</label><input id="doctor-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} required /></div>
        <div className="auth-field"><label htmlFor="doctor-email">Email</label><input id="doctor-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} required /></div>
        <div className="auth-field"><label htmlFor="doctor-password">Temporary password</label><input id="doctor-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={12} maxLength={72} autoComplete="new-password" required /></div>
        <div className="auth-field"><label htmlFor="doctor-license">License number</label><input id="doctor-license" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} maxLength={100} required /></div>
        <div className="auth-field"><label htmlFor="doctor-phone">Phone (optional)</label><input id="doctor-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={40} /></div>
        <div className="auth-field"><label htmlFor="doctor-specialization">Specialization</label><select id="doctor-specialization" value={form.specialization_ids[0] || ""} onChange={(e) => setForm({ ...form, specialization_ids: e.target.value ? [e.target.value] : [] })}><option value="">None</option>{specializations.map((s) => <option key={s.specialization_id} value={s.specialization_id}>{s.name}</option>)}</select></div>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create doctor account"}</button>
      </form>
    </section>
    <section className="panel appointments-panel"><div className="panel-header"><div><h2 className="panel-title">Doctor accounts</h2><p className="panel-subtitle">Only active accounts appear in the patient booking selector.</p></div></div>
      {loading ? <div className="panel-body">Loading doctors…</div> : doctors.length === 0 ? <div className="panel-body">No doctor accounts found.</div> : <div className="table-wrapper"><table className="data-table"><thead><tr><th>Doctor</th><th>Specialization</th><th>State</th><th>Action</th></tr></thead><tbody>{doctors.map((doctor) => <tr key={doctor.doctor_id}><td>{doctor.full_name}</td><td>{doctor.specializations.join(", ") || "—"}</td><td>{doctor.is_active ? "Active" : "Inactive"}</td><td><button className="secondary-button" type="button" onClick={() => setDoctorActive(doctor, !doctor.is_active)}>{doctor.is_active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
