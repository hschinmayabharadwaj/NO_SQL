"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@/components/Alert";
import { CATEGORIES } from "@/lib/constants";

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Rendered as a native modal <dialog>: focus trapping and Esc-to-close come for free.
export default function EventForm({ initial, onSubmit, onCancel }) {
  const dialogRef = useRef(null);
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

  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

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
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      aria-labelledby="event-form-title"
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg bg-white p-0 text-ink shadow-modal backdrop:bg-teal-deep/60"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
        <div>
          <p className="eyebrow text-brand-green-dark">{initial ? "Edit" : "New"} event</p>
          <h2 id="event-form-title" className="mt-1 text-[22px] leading-[1.35] font-medium">
            {initial ? initial.title : "Add a new event"}
          </h2>
        </div>
        <Alert>{error}</Alert>

        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" className="input" value={form.title} onChange={set} required minLength={3} maxLength={100} />
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="input" value={form.description} onChange={set} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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

        <div className="flex justify-end gap-3 border-t border-hairline-soft pt-5">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Create event"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
