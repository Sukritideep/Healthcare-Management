"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../components/AppShell";

export default function PatientPrescriptionsPage() {
  const { user } = useSession();
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "patient") return;
    let active = true;
    apiFetch("/api/prescriptions")
      .then(({ prescriptions: rows }) => { if (active) setPrescriptions(rows); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (user?.role !== "patient") return <section className="panel"><div className="panel-body">Patient access is required.</div></section>;
  return <>
    <section className="page-heading"><div><div className="eyebrow">PATIENT PORTAL</div><h1 className="page-title">My prescriptions</h1><p className="page-description">This list is scoped by your authenticated patient account.</p></div><button className="secondary-button" type="button" onClick={() => window.print()}>Print</button></section>
    {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
    {loading ? <section className="panel"><div className="panel-body">Loading prescriptions…</div></section> : prescriptions.length === 0 ? <section className="panel"><div className="panel-body">No prescriptions found.</div></section> : prescriptions.map((prescription) => <section className="panel appointments-panel" key={prescription.prescription_id}>
      <div className="panel-header"><div><h2 className="panel-title">Prescription</h2><p className="panel-subtitle">Issued {new Date(prescription.created_at).toLocaleString()}</p></div></div>
      <div className="table-wrapper"><table className="data-table"><thead><tr><th>Medicine</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Quantity</th><th>Dispensed</th></tr></thead><tbody>{prescription.medicines.map((medicine) => <tr key={medicine.medicine_id}><td>{medicine.name}</td><td>{medicine.dosage}</td><td>{medicine.route || "—"}</td><td>{medicine.frequency || "—"}</td><td>{medicine.duration_days} days</td><td>{medicine.quantity_prescribed ?? "Not specified"}</td><td>{medicine.quantity_dispensed}/{medicine.quantity_prescribed ?? "—"}</td></tr>)}</tbody></table></div>
    </section>)}
  </>;
}
