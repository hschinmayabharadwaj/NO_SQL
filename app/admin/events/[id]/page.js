"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@/components/Alert";
import PageHeader from "@/components/PageHeader";
import { api, formatDate } from "@/lib/api";

const back = { href: "/admin", label: "Dashboard" };

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

  return (
    <>
      <PageHeader
        back={back}
        eyebrow="Registrations"
        title={event?.title ?? (loading ? "Loading…" : "Event unavailable")}
        subtitle={event && `${formatDate(event.date)} · ${event.venue}`}
      >
        {event && (
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm">
            <span className="font-semibold text-brand-green">{event.registrationCount}</span> / {event.capacity} registered ·{" "}
            {event.seatsLeft} seats left
          </span>
        )}
      </PageHeader>

      <div className="container-page space-y-6 py-12 sm:py-16">
        {message && <Alert type={message.type}>{message.text}</Alert>}

        {loading ? (
          <div className="card h-48 animate-pulse bg-surface" />
        ) : event && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-hairline bg-surface">
                <tr className="eyebrow text-stone">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">USN</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Registered at</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-steel">No registrations yet.</td>
                  </tr>
                )}
                {registrations.map((r) => (
                  <tr key={r._id} className="hover:bg-surface">
                    <td className="px-5 py-4">
                      <p className="font-medium">{r.studentName}</p>
                      <p className="text-[13px] text-steel">{r.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <code className="rounded-sm bg-surface-soft px-1.5 py-0.5 font-mono text-[13px]">{r.usn}</code>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-brand-green-soft px-2.5 py-1 text-[13px] font-semibold text-brand-green-dark">{r.department}</span>
                    </td>
                    <td className="px-5 py-4 text-slate">{formatDate(r.registeredAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="btn-danger btn-sm" onClick={() => cancel(r)} disabled={cancelling === r._id}>
                        {cancelling === r._id ? "Cancelling…" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
