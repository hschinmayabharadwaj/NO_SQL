"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@/components/Alert";
import CategoryTag from "@/components/CategoryTag";
import PageHeader from "@/components/PageHeader";
import { api, formatDate } from "@/lib/api";
import { DEPARTMENTS, USN_PATTERN } from "@/lib/constants";

const emptyForm = { studentName: "", usn: "", email: "", department: "" };
const back = { href: "/", label: "All events" };

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
      setMessage({ type: "success", text: `You're in! Registered ${form.studentName} successfully.` });
      setForm(emptyForm);
      load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || loadError) {
    return (
      <>
        <PageHeader back={back} title={loading ? "Loading event…" : "Event unavailable"} />
        <div className="container-page py-12"><Alert>{loadError}</Alert></div>
      </>
    );
  }

  const full = event.seatsLeft === 0;
  const pct = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

  return (
    <>
      <PageHeader
        back={back}
        eyebrow={<CategoryTag category={event.category} />}
        title={event.title}
        subtitle={`${formatDate(event.date)} · ${event.venue}`}
      />

      <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-5">
        <section className="space-y-6 lg:col-span-3">
          <div className="card p-6 sm:p-8">
            <h2 className="text-[22px] leading-[1.35] font-medium">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-slate">{event.description}</p>

            <dl className="mt-8 grid gap-6 border-t border-hairline-soft pt-6 sm:grid-cols-3">
              {[
                ["Date & time", formatDate(event.date)],
                ["Venue", event.venue],
                ["Capacity", `${event.capacity} seats`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow text-stone">{label}</dt>
                  <dd className="mt-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-stone">Availability</p>
                <p className="mt-1 text-[36px] leading-[1.25] font-medium tracking-[-0.5px]">
                  {event.seatsLeft} <span className="text-lg font-normal text-steel">seats left</span>
                </p>
              </div>
              {full ? (
                <span className="rounded-full bg-warning-bg px-2.5 py-1 text-[13px] font-semibold text-warning-text">Event full</span>
              ) : (
                <span className="rounded-full bg-brand-green-soft px-2.5 py-1 text-[13px] font-semibold text-brand-green-dark">Open</span>
              )}
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-hairline-soft"
              role="progressbar"
              aria-label="Seats filled"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-brand-green-mid transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-steel">{event.registrationCount} of {event.capacity} registered</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="card h-fit space-y-5 p-6 sm:p-8 lg:sticky lg:top-24 lg:col-span-2">
          <div>
            <p className="eyebrow text-brand-green-dark">Registration</p>
            <h2 className="mt-1 text-lg font-semibold">Reserve your seat</h2>
          </div>
          {message && <Alert type={message.type}>{message.text}</Alert>}

          <fieldset disabled={full || submitting} className="space-y-5">
            <div>
              <label className="label" htmlFor="studentName">Full name</label>
              <input id="studentName" name="studentName" className="input" value={form.studentName} onChange={set} required minLength={2} />
            </div>
            <div>
              <label className="label" htmlFor="usn">USN</label>
              <input id="usn" name="usn" className="input font-mono uppercase" placeholder="1RV21CS001" value={form.usn} onChange={set} required pattern={USN_PATTERN} title="USN format, e.g. 1RV21CS001" />
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
              {full ? "Registrations closed" : submitting ? "Registering…" : "Register now"}
            </button>
          </fieldset>
        </form>
      </div>
    </>
  );
}
