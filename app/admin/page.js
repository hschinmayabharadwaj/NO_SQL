"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Alert from "@/components/Alert";
import CategoryTag from "@/components/CategoryTag";
import EventForm from "@/components/EventForm";
import PageHeader from "@/components/PageHeader";
import { api, formatDate } from "@/lib/api";

// Recharts takes raw colours: brand-green-mid, hairline-soft, steel, hairline, surface-soft from DESIGN.md.
const CHART = { bar: "#00a35c", grid: "#eceff1", tick: "#5c6c7a", border: "#e1e5e8", cursor: "#f4f7f6" };

function StatCard({ label, value, featured }) {
  return (
    <div className={`rounded-lg p-6 ${featured ? "border-2 border-brand-green bg-surface-feature" : "border border-hairline bg-white"}`}>
      <p className="eyebrow text-stone">{label}</p>
      {typeof value === "number" ? (
        <p className="mt-2 text-[36px] leading-[1.25] font-medium tracking-[-0.5px]">{value}</p>
      ) : (
        <p className="mt-2 line-clamp-2 text-lg leading-[1.4] font-semibold">{value}</p>
      )}
    </div>
  );
}

function ChartCard({ title, data, dataKey }) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-steel">No data yet</p>
      ) : (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey={dataKey} width={140} tick={{ fill: CHART.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: CHART.cursor }} contentStyle={{ borderRadius: 8, border: `1px solid ${CHART.border}`, fontSize: 13 }} />
              <Bar dataKey="registrations" fill={CHART.bar} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | event object
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([api("/api/events"), api("/api/stats")])
        .then(([ev, st]) => {
          setEvents(ev);
          setStats(st);
        })
        .catch((err) => setMessage({ type: "error", text: err.message }))
        .finally(() => setLoading(false)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);

  async function save(data) {
    if (editing === "new") await api("/api/events", { method: "POST", body: data });
    else await api(`/api/events/${editing._id}`, { method: "PUT", body: data });
    setMessage({ type: "success", text: editing === "new" ? "Event created" : "Event updated" });
    setEditing(null);
    load();
  }

  async function remove(ev) {
    if (!confirm(`Delete "${ev.title}" and all its registrations?`)) return;
    try {
      const res = await api(`/api/events/${ev._id}`, { method: "DELETE" });
      setMessage({ type: "success", text: `Deleted "${ev.title}" and ${res.registrationsDeleted} registration(s)` });
      load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function seed() {
    setSeeding(true);
    try {
      const res = await api("/api/seed", { method: "POST" });
      setMessage({ type: "success", text: `Seeded ${res.events} events and ${res.registrations} registrations` });
      load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSeeding(false);
    }
  }

  const counts = Object.fromEntries((stats?.perEvent ?? []).map((e) => [e._id, e.registrations]));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Dashboard" subtitle="Manage events and registrations, with live stats from MongoDB aggregation pipelines.">
        <button className="btn-secondary-dark" onClick={seed} disabled={seeding}>
          {seeding ? "Seeding…" : "Seed sample data"}
        </button>
        <button className="btn-primary" onClick={() => setEditing("new")}>+ Add event</button>
      </PageHeader>

      {editing && (
        <EventForm
          key={editing === "new" ? "new" : editing._id}
          initial={editing === "new" ? null : editing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="container-page space-y-12 py-12 sm:py-16">
        {message && <Alert type={message.type}>{message.text}</Alert>}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 animate-pulse bg-surface" />)}
          </div>
        ) : (
          <>
            {stats && (
              <section className="space-y-6">
                <h2 className="text-[28px] leading-[1.3] font-medium">Overview</h2>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard label="Total events" value={stats.totalEvents} />
                  <StatCard label="Total registrations" value={stats.totalRegistrations} featured />
                  <StatCard label="Departments" value={stats.perDepartment.length} />
                  <StatCard label="Most popular" value={stats.perEvent[0]?.registrations ? stats.perEvent[0].title : "—"} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Registrations per event" data={stats.perEvent} dataKey="title" />
                  <ChartCard title="Registrations per department" data={stats.perDepartment} dataKey="department" />
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[28px] leading-[1.3] font-medium">Events</h2>
                <span className="text-sm text-steel">{events.length} total</span>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-hairline bg-surface">
                    <tr className="eyebrow text-stone">
                      <th className="px-5 py-3 font-semibold">Event</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Registered</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-steel">
                          No events yet. Add one or click “Seed sample data”.
                        </td>
                      </tr>
                    )}
                    {events.map((ev) => {
                      const n = counts[ev._id] ?? 0;
                      return (
                        <tr key={ev._id} className="hover:bg-surface">
                          <td className="px-5 py-4">
                            <p className="font-medium">{ev.title}</p>
                            <div className="mt-1.5"><CategoryTag category={ev.category} /></div>
                          </td>
                          <td className="px-5 py-4 text-slate">{formatDate(ev.date)}</td>
                          <td className="px-5 py-4">
                            <p className="text-slate">{n} / {ev.capacity}</p>
                            <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-hairline-soft">
                              <div className="h-full rounded-full bg-brand-green-mid" style={{ width: `${Math.min(100, (n / ev.capacity) * 100)}%` }} />
                            </div>
                          </td>
                          <td className="space-x-2 px-5 py-4 text-right whitespace-nowrap">
                            <Link href={`/admin/events/${ev._id}`} className="btn-secondary btn-sm">Registrations</Link>
                            <button className="btn-secondary btn-sm" onClick={() => setEditing(ev)}>Edit</button>
                            <button className="btn-danger btn-sm" onClick={() => remove(ev)}>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
