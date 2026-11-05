"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../components/AppShell";

function newTransactionKey() {
  return crypto.randomUUID();
}

export default function InventoryPage() {
  const { user } = useSession();
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dispensingQueue, setDispensingQueue] = useState([]);
  const [dispenseValues, setDispenseValues] = useState({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ medicine_id: "", batch_number: "", expiry_date: "", quantity: "", reorder_level: "0", supplier_name: "" });

  const refresh = useCallback(async () => {
    const [stock, catalogue, queue] = await Promise.all([
      apiFetch(`/api/inventory?search=${encodeURIComponent(search)}`),
      apiFetch("/api/medicines"),
      apiFetch("/api/dispensing"),
    ]);
    setInventory(stock.inventory);
    setMedicines(catalogue.medicines);
    setDispensingQueue(queue.dispensing_queue);
  }, [search]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    async function loadInventory() {
      try {
        await refresh();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadInventory();
    return () => { active = false; };
  }, [user, refresh]);

  async function receiveStock(event) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      await apiFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "stock_in", transaction_key: newTransactionKey(),
          medicine_id: form.medicine_id, batch_number: form.batch_number,
          expiry_date: form.expiry_date, quantity: Number(form.quantity),
          reorder_level: Number(form.reorder_level), supplier_name: form.supplier_name,
        }),
      });
      setMessage("Stock received and recorded.");
      setForm((current) => ({ ...current, batch_number: "", expiry_date: "", quantity: "", supplier_name: "" }));
      await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function stockOut(batch) {
    const quantity = Number(window.prompt(`Quantity to dispense from ${batch.batch_number}:`, "1"));
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    setError(""); setMessage("");
    try {
      await apiFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify({ action: "stock_out", transaction_key: newTransactionKey(), inventory_batch_id: batch.inventory_batch_id, quantity, note: "Manual inventory issue" }),
      });
      setMessage("Stock-out transaction recorded.");
      await refresh();
    } catch (requestError) { setError(requestError.message); }
  }

  async function dispense(item, key) {
    setError(""); setMessage("");
    const values = dispenseValues[key] || {};
    try {
      await apiFetch("/api/dispensing", { method: "POST", body: JSON.stringify({
        transaction_key: newTransactionKey(), prescription_id: item.prescription_id,
        medicine_id: item.medicine_id, inventory_batch_id: values.inventory_batch_id,
        quantity: Number(values.quantity),
      }) });
      setMessage("Prescription quantity dispensed and inventory updated.");
      await refresh();
    } catch (requestError) { setError(requestError.message); }
  }

  if (user?.role !== "admin") {
    return <section className="panel"><div className="panel-header"><div><h1 className="panel-title">Inventory management</h1><p className="panel-subtitle">Administrator access is required.</p></div></div></section>;
  }

  return (
    <>
      <section className="page-heading"><div><div className="eyebrow">ADMIN WORKSPACE</div><h1 className="page-title">Pharmacy inventory</h1><p className="page-description">Development inventory is recorded per medicine batch and movement.</p></div></section>
      {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
      {message && <p className="auth-alert" role="status">{message}</p>}
      <section className="panel">
        <div className="panel-header"><div><h2 className="panel-title">Receive stock</h2><p className="panel-subtitle">Use fictional inventory for development demonstrations.</p></div></div>
        {!medicines.length && !loading ? <div className="panel-body">Add a medicine to the catalogue before receiving stock.</div> : (
          <form className="auth-form appointment-booking-form" onSubmit={receiveStock}>
            <div className="auth-field"><label htmlFor="inventory-medicine">Medicine</label><select id="inventory-medicine" value={form.medicine_id} onChange={(event) => setForm({ ...form, medicine_id: event.target.value })} required><option value="">Select a medicine</option>{medicines.map((medicine) => <option key={medicine.medicine_id} value={medicine.medicine_id}>{medicine.name}</option>)}</select></div>
            <div className="auth-field"><label htmlFor="inventory-batch">Batch number</label><input id="inventory-batch" value={form.batch_number} onChange={(event) => setForm({ ...form, batch_number: event.target.value })} maxLength={100} required /></div>
            <div className="auth-field"><label htmlFor="inventory-expiry">Expiry date</label><input id="inventory-expiry" type="date" value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} required /></div>
            <div className="auth-field"><label htmlFor="inventory-quantity">Quantity received</label><input id="inventory-quantity" type="number" min="1" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></div>
            <div className="auth-field"><label htmlFor="inventory-reorder">Low-stock threshold</label><input id="inventory-reorder" type="number" min="0" step="1" value={form.reorder_level} onChange={(event) => setForm({ ...form, reorder_level: event.target.value })} /></div>
            <div className="auth-field"><label htmlFor="inventory-supplier">Supplier (optional)</label><input id="inventory-supplier" value={form.supplier_name} onChange={(event) => setForm({ ...form, supplier_name: event.target.value })} maxLength={200} /></div>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Recording…" : "Receive stock"}</button>
          </form>
        )}
      </section>
      <section className="panel appointments-panel">
        <div className="panel-header"><div><h2 className="panel-title">Stock by batch</h2><p className="panel-subtitle">Low-stock and near-expiry flags are computed from current batch data.</p></div><input aria-label="Search medicine inventory" placeholder="Search name or batch" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {loading ? <div className="panel-body">Loading inventory…</div> : inventory.length === 0 ? <div className="panel-body">No inventory batches found.</div> : (
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th>On hand</th><th>Threshold</th><th>Alerts</th><th>Action</th></tr></thead><tbody>{inventory.map((batch) => <tr key={batch.inventory_batch_id}><td>{batch.medicine_name}</td><td>{batch.batch_number}</td><td>{new Date(`${batch.expiry_date}T00:00:00`).toLocaleDateString()}</td><td>{batch.quantity_on_hand}</td><td>{batch.reorder_level}</td><td>{batch.low_stock ? "Low stock " : ""}{batch.expiring_soon ? "Near expiry" : ""}{!batch.low_stock && !batch.expiring_soon ? "—" : ""}</td><td><button type="button" className="secondary-button" disabled={!batch.quantity_on_hand} onClick={() => stockOut(batch)}>Record stock-out</button></td></tr>)}</tbody></table></div>
        )}
      </section>
      <section className="panel appointments-panel">
        <div className="panel-header"><div><h2 className="panel-title">Prescription dispensing</h2><p className="panel-subtitle">Only prescribed quantities are eligible; stock and prescription limits are checked atomically.</p></div></div>
        {loading ? <div className="panel-body">Loading dispensing queue…</div> : dispensingQueue.length === 0 ? <div className="panel-body">No prescriptions with a specified remaining quantity are ready to dispense.</div> : (
          <div className="table-wrapper"><table className="data-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Medicine</th><th>Remaining</th><th>Batch</th><th>Quantity</th><th>Action</th></tr></thead><tbody>{dispensingQueue.map((item) => {
            const key = `${item.prescription_id}:${item.medicine_id}`;
            const values = dispenseValues[key] || {};
            return <tr key={key}><td>{item.patient_name}</td><td>{item.doctor_name}</td><td>{item.medicine_name}</td><td>{item.quantity_remaining}</td><td><select aria-label={`Batch for ${item.medicine_name}`} value={values.inventory_batch_id || ""} onChange={(e) => setDispenseValues({ ...dispenseValues, [key]: { ...values, inventory_batch_id: e.target.value } })}><option value="">Choose batch</option>{item.available_batches.map((batch) => <option key={batch.inventory_batch_id} value={batch.inventory_batch_id}>{batch.batch_number} · {batch.quantity_on_hand} available · exp {new Date(`${batch.expiry_date}T00:00:00`).toLocaleDateString()}</option>)}</select></td><td><input aria-label={`Quantity for ${item.medicine_name}`} type="number" min="1" max={Math.min(item.quantity_remaining, item.available_batches.find((batch) => batch.inventory_batch_id === values.inventory_batch_id)?.quantity_on_hand || 0)} value={values.quantity || ""} onChange={(e) => setDispenseValues({ ...dispenseValues, [key]: { ...values, quantity: e.target.value } })} /></td><td><button type="button" className="secondary-button" disabled={!values.inventory_batch_id || !Number(values.quantity)} onClick={() => dispense(item, key)}>Dispense</button></td></tr>;
          })}</tbody></table></div>
        )}
      </section>
    </>
  );
}
