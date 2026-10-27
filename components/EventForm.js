"use client";

import { useState } from "react";
import Alert from "@/components/Alert";
import { CATEGORIES } from "@/lib/constants";

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EventForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial ? toLocalInput(initial.date) : "",
    venue: initial?.venue ?? "",
    category: initial?.category ?? CATEGORIES[0],
    capacity: initial?.capacity ?? 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Convert the browser's local time to an absolute ISO date before sending.
      await onSubmit({ ...form, date: new Date(form.date).toISOString(), capacity: Number(form.capacity) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">{initial ? "Edit event" : "Add new event"}</h2>
      <Alert>{error}</Alert>

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" value={form.title} onChange={set} required minLength={3} maxLength={100} />
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} className="input" value={form.description} onChange={set} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">Date & time</label>
          <input id="date" name="date" type="datetime-local" className="input" value={form.date} onChange={set} required />
        </div>
        <div>
          <label className="label" htmlFor="venue">Venue</label>
          <input id="venue" name="venue" className="input" value={form.venue} onChange={set} required />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" className="input" value={form.category} onChange={set}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="capacity">Capacity</label>
          <input id="capacity" name="capacity" type="number" min={1} max={10000} step={1} className="input" value={form.capacity} onChange={set} required />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  );
}
