"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@/components/Alert";
import { api, formatDate } from "@/lib/api";
import { DEPARTMENTS, USN_PATTERN } from "@/lib/constants";

const emptyForm = { studentName: "", usn: "", email: "", department: "" };

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(
    () =>
      api(`/api/events/${id}`)
        .then(setEvent)
        .catch((err) => setLoadError(err.message))
        .finally(() => setLoading(false)),
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api("/api/registrations", { method: "POST", body: { ...form, eventId: id } });
      setMessage({ type: "success", text: `🎉 Registered ${form.studentName} successfully!` });
      setForm(emptyForm);
      load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="animate-pulse text-slate-500">Loading event…</p>;
  if (loadError) return <Alert>{loadError}</Alert>;

  const full = event.seatsLeft === 0;
  const pct = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to events</Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{event.category}</span>
          <h1 className="mt-3 text-2xl font-bold">{event.title}</h1>
          <p className="mt-3 whitespace-pre-line text-slate-600">{event.description}</p>
          <div className="mt-5 space-y-1 text-sm text-slate-600">
            <p>📅 {formatDate(event.date)}</p>
            <p>📍 {event.venue}</p>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{full ? "Event full" : `${event.seatsLeft} seats left`}</span>
              <span className="text-slate-500">{event.registrationCount} / {event.capacity} registered</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full ${full ? "bg-red-500" : "bg-indigo-600"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Register for this event</h2>
          {message && <Alert type={message.type}>{message.text}</Alert>}

          <fieldset disabled={full || submitting} className="space-y-4">
            <div>
              <label className="label" htmlFor="studentName">Full name</label>
              <input id="studentName" name="studentName" className="input" value={form.studentName} onChange={set} required minLength={2} />
            </div>
            <div>
              <label className="label" htmlFor="usn">USN</label>
              <input id="usn" name="usn" className="input uppercase" placeholder="1RV21CS001" value={form.usn} onChange={set} required pattern={USN_PATTERN} title="USN format, e.g. 1RV21CS001" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" value={form.email} onChange={set} required />
            </div>
            <div>
              <label className="label" htmlFor="department">Department</label>
              <select id="department" name="department" className="input" value={form.department} onChange={set} required>
                <option value="" disabled>Select department</option>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              {full ? "Registrations closed" : submitting ? "Registering…" : "Register"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
