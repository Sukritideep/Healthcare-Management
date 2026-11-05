"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSession } from "../components/AppShell";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function HomePage() {
  const { user } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const result = await apiFetch("/api/appointments");
    setAppointments(result.appointments);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      apiFetch("/api/appointments"),
      user.role === "patient" ? apiFetch("/api/doctors") : Promise.resolve({ doctors: [] }),
    ]).then(([appointmentResult, doctorResult]) => {
      if (!active) return;
      setAppointments(appointmentResult.appointments);
      setDoctors(doctorResult.doctors);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  async function bookAppointment(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId, appointment_date: new Date(appointmentDate).toISOString() }),
      });
      setAppointmentDate("");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(appointmentId) {
    setError("");
    try {
      await apiFetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Cancelled" }),
      });
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">{user?.role?.toUpperCase()} WORKSPACE</div>
          <h1 className="page-title">Appointment schedule</h1>
          <p className="page-description">Appointments shown here are loaded from the hospital database.</p>
        </div>
        <span className="secondary-button"><CalendarDays size={16} /> {appointments.length} appointments</span>
      </section>

      {error && <p className="auth-alert auth-error" role="alert">{error}</p>}

      {user?.role === "patient" && (
        <section className="panel" aria-labelledby="book-appointment-heading">
          <div className="panel-header"><div><h2 className="panel-title" id="book-appointment-heading">Book an appointment</h2><p className="panel-subtitle">Choose a doctor and a future time.</p></div></div>
          <form className="auth-form appointment-booking-form" onSubmit={bookAppointment}>
            <div className="auth-field"><label htmlFor="doctor">Doctor</label><select id="doctor" value={doctorId} onChange={(event) => setDoctorId(event.target.value)} required><option value="">Select a doctor</option>{doctors.map((doctor) => <option value={doctor.doctor_id} key={doctor.doctor_id}>{doctor.full_name}{doctor.specializations?.length ? ` — ${doctor.specializations.join(", ")}` : ""}</option>)}</select></div>
            <div className="auth-field"><label htmlFor="appointment-date">Date and time</label><input id="appointment-date" type="datetime-local" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} required /></div>
            <button className="primary-button" type="submit" disabled={saving || !doctors.length}><Plus size={17} />{saving ? "Booking…" : "Book appointment"}</button>
            {!doctors.length && <p className="panel-subtitle">No doctors are currently available to book.</p>}
          </form>
        </section>
      )}

      <section className="panel appointments-panel" id="appointments">
        <div className="panel-header"><div><h2 className="panel-title">Appointments</h2><p className="panel-subtitle">Your access is scoped by your authenticated role.</p></div></div>
        {loading ? <div className="panel-body">Loading appointments…</div> : appointments.length === 0 ? <div className="panel-body">No appointments found.</div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Date and time</th><th>Patient</th><th>Doctor</th><th>Status</th>{user?.role === "patient" && <th>Action</th>}</tr></thead>
              <tbody>{appointments.map((appointment) => <tr key={appointment.appointment_id}>
                <td>{formatDate(appointment.appointment_datetime)}</td>
                <td>{appointment.patient_name}</td>
                <td>{appointment.doctor_name}</td>
                <td><span className={`status-badge status-${appointment.appointment_status.toLowerCase()}`}>{appointment.appointment_status}</span></td>
                {user?.role === "patient" && <td>{appointment.appointment_status.toLowerCase() === "scheduled" ? <button type="button" className="secondary-button" onClick={() => cancelAppointment(appointment.appointment_id)}>Cancel</button> : "—"}</td>}
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
