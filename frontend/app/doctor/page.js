"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../components/AppShell";

export default function DoctorWorkspacePage() {
  const { user } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [clinical, setClinical] = useState({});
  const [prescription, setPrescription] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const refresh = useCallback(async () => {
    const [appointmentResult, consultationResult, medicineResult] = await Promise.all([
      apiFetch("/api/appointments"), apiFetch("/api/consultations"), apiFetch("/api/medicines"),
    ]);
    setAppointments(appointmentResult.appointments);
    setConsultations(consultationResult.consultations);
    setMedicines(medicineResult.medicines);
  }, []);

  useEffect(() => {
    if (user?.role !== "doctor") return;
    let active = true;
    async function load() {
      try { await refresh(); }
      catch (requestError) { if (active) setError(requestError.message); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user, refresh]);

  async function recordConsultation(event, appointmentId) {
    event.preventDefault(); setSaving(appointmentId); setError(""); setMessage("");
    const values = clinical[appointmentId] || {};
    try {
      await apiFetch("/api/consultations", { method: "POST", body: JSON.stringify({ appointment_id: appointmentId, ...values }) });
      setMessage("Consultation saved."); await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(""); }
  }

  async function issuePrescription(event, consultationId, key) {
    event.preventDefault(); setSaving(key); setError(""); setMessage("");
    const values = prescription[key] || {};
    try {
      await apiFetch("/api/prescriptions", { method: "POST", body: JSON.stringify({
        consultation_id: consultationId,
        medicines: [{ ...values, duration_days: Number(values.duration_days), quantity_prescribed: Number(values.quantity_prescribed) }],
      }) });
      setPrescription((current) => ({ ...current, [key]: {} })); setMessage("Prescription issued."); await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(""); }
  }

  if (user?.role !== "doctor") return <section className="panel"><div className="panel-body">Doctor access is required.</div></section>;

  return <>
    <section className="page-heading"><div><div className="eyebrow">DOCTOR WORKSPACE</div><h1 className="page-title">Care schedule</h1><p className="page-description">Appointments and patient records are scoped to your authenticated doctor account.</p></div></section>
    {error && <p className="auth-alert auth-error" role="alert">{error}</p>}{message && <p className="auth-alert" role="status">{message}</p>}
    {loading ? <section className="panel"><div className="panel-body">Loading your schedule…</div></section> : appointments.length === 0 ? <section className="panel"><div className="panel-body">No appointments are assigned to you.</div></section> : appointments.map((appointment) => {
      const consultation = consultations.find((item) => item.appointment_id === appointment.appointment_id);
      const key = consultation?.consultation_id || appointment.appointment_id;
      const clinicalValues = clinical[appointment.appointment_id] || {};
      const rxValues = prescription[key] || {};
      return <section className="panel appointments-panel" key={appointment.appointment_id}>
        <div className="panel-header"><div><h2 className="panel-title">{appointment.patient_name}</h2><p className="panel-subtitle">{new Date(appointment.appointment_datetime).toLocaleString()} · {appointment.appointment_status}</p></div></div>
        {consultation ? <div className="panel-body"><strong>Consultation recorded</strong><p>Diagnosis: {consultation.diagnosis || "—"}</p><p>Symptoms: {consultation.symptoms || "—"}</p>
          <form className="auth-form appointment-booking-form" onSubmit={(event) => issuePrescription(event, consultation.consultation_id, key)}>
            <h3>Issue prescription</h3>
            <div className="auth-field"><label htmlFor={`medicine-${key}`}>Medicine</label><select id={`medicine-${key}`} required value={rxValues.medicine_id || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, medicine_id: e.target.value } })}><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine.medicine_id} value={medicine.medicine_id}>{medicine.name}</option>)}</select></div>
            <div className="auth-field"><label htmlFor={`dosage-${key}`}>Dosage</label><input id={`dosage-${key}`} required maxLength={200} value={rxValues.dosage || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, dosage: e.target.value } })} /></div>
            <div className="auth-field"><label htmlFor={`route-${key}`}>Route</label><input id={`route-${key}`} maxLength={100} value={rxValues.route || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, route: e.target.value } })} /></div>
            <div className="auth-field"><label htmlFor={`frequency-${key}`}>Frequency</label><input id={`frequency-${key}`} maxLength={100} value={rxValues.frequency || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, frequency: e.target.value } })} /></div>
            <div className="auth-field"><label htmlFor={`duration-${key}`}>Duration (days)</label><input id={`duration-${key}`} type="number" min="1" max="3650" required value={rxValues.duration_days || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, duration_days: e.target.value } })} /></div>
            <div className="auth-field"><label htmlFor={`quantity-${key}`}>Quantity to dispense</label><input id={`quantity-${key}`} type="number" min="1" max="100000" required value={rxValues.quantity_prescribed || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, quantity_prescribed: e.target.value } })} /></div>
            <div className="auth-field"><label htmlFor={`instructions-${key}`}>Instructions</label><textarea id={`instructions-${key}`} maxLength={2000} value={rxValues.instructions || ""} onChange={(e) => setPrescription({ ...prescription, [key]: { ...rxValues, instructions: e.target.value } })} /></div>
            <button className="primary-button" disabled={saving === key}>{saving === key ? "Issuing…" : "Issue prescription"}</button>
          </form>
        </div> : <form className="auth-form appointment-booking-form" onSubmit={(event) => recordConsultation(event, appointment.appointment_id)}>
          <h3>Record consultation</h3>
          <div className="auth-field"><label htmlFor={`symptoms-${key}`}>Symptoms</label><textarea id={`symptoms-${key}`} maxLength={10000} value={clinicalValues.symptoms || ""} onChange={(e) => setClinical({ ...clinical, [appointment.appointment_id]: { ...clinicalValues, symptoms: e.target.value } })} /></div>
          <div className="auth-field"><label htmlFor={`diagnosis-${key}`}>Diagnosis</label><textarea id={`diagnosis-${key}`} maxLength={10000} value={clinicalValues.diagnosis || ""} onChange={(e) => setClinical({ ...clinical, [appointment.appointment_id]: { ...clinicalValues, diagnosis: e.target.value } })} /></div>
          <div className="auth-field"><label htmlFor={`notes-${key}`}>Clinical notes</label><textarea id={`notes-${key}`} maxLength={20000} value={clinicalValues.notes || ""} onChange={(e) => setClinical({ ...clinical, [appointment.appointment_id]: { ...clinicalValues, notes: e.target.value } })} /></div>
          <button className="primary-button" disabled={saving === appointment.appointment_id}>{saving === appointment.appointment_id ? "Saving…" : "Save consultation"}</button>
        </form>}
      </section>;
    })}
  </>;
}
