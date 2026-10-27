"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@/components/Alert";
import { api, formatDate } from "@/lib/api";

export default function EventRegistrationsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(
    () =>
      Promise.all([api(`/api/events/${id}`), api(`/api/registrations?eventId=${id}`)])
        .then(([ev, regs]) => {
          setEvent(ev);
          setRegistrations(regs);
        })
        .catch((err) => setMessage({ type: "error", text: err.message }))
        .finally(() => setLoading(false)),
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);

  async function cancel(reg) {
    if (!confirm(`Cancel registration for ${reg.studentName} (${reg.usn})?`)) return;
    setCancelling(reg._id);
    try {
      await api(`/api/registrations/${reg._id}`, { method: "DELETE" });
      setMessage({ type: "success", text: `Cancelled registration for ${reg.studentName}` });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <p className="animate-pulse text-slate-500">Loading registrations…</p>;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Back to dashboard</Link>

      {event && (
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="mt-1 text-slate-500">
            {formatDate(event.date)} · {event.venue} · {event.registrationCount} / {event.capacity} registered ({event.seatsLeft} seats left)
          </p>
        </div>
      )}

      {message && <Alert type={message.type}>{message.text}</Alert>}

      {event && (
        <section className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">USN</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Registered at</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No registrations yet.</td>
                </tr>
              )}
              {registrations.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.studentName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.usn}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email}</td>
                  <td className="px-4 py-3 text-slate-600">{r.department}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.registeredAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-danger px-3 py-1.5" onClick={() => cancel(r)} disabled={cancelling === r._id}>
                      {cancelling === r._id ? "Cancelling…" : "Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
