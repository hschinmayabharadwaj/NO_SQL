"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Alert from "@/components/Alert";
import EventForm from "@/components/EventForm";
import { api, formatDate } from "@/lib/api";

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold">{value}</p>
    </div>
  );
}

function ChartCard({ title, data, dataKey }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey={dataKey} width={130} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="registrations" fill="#4f46e5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={seed} disabled={seeding}>
            {seeding ? "Seeding…" : "Seed sample data"}
          </button>
          <button className="btn-primary" onClick={() => setEditing("new")}>+ Add event</button>
        </div>
      </div>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      {editing && (
        <EventForm
          key={editing === "new" ? "new" : editing._id}
          initial={editing === "new" ? null : editing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <p className="animate-pulse text-slate-500">Loading dashboard…</p>
      ) : (
        <>
          {stats && (
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total events" value={stats.totalEvents} />
                <StatCard label="Total registrations" value={stats.totalRegistrations} />
                <StatCard label="Departments participating" value={stats.perDepartment.length} />
                <StatCard label="Most popular event" value={stats.perEvent[0]?.registrations ? stats.perEvent[0].title : "—"} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Registrations per event" data={stats.perEvent} dataKey="title" />
                <ChartCard title="Registrations per department" data={stats.perDepartment} dataKey="department" />
              </div>
            </section>
          )}

          <section className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No events yet. Add one or click “Seed sample data”.
                    </td>
                  </tr>
                )}
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{ev.title}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(ev.date)}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.category}</td>
                    <td className="px-4 py-3 text-slate-600">{counts[ev._id] ?? 0} / {ev.capacity}</td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/admin/events/${ev._id}`} className="btn-secondary px-3 py-1.5">Registrations</Link>
                      <button className="btn-secondary px-3 py-1.5" onClick={() => setEditing(ev)}>Edit</button>
                      <button className="btn-danger px-3 py-1.5" onClick={() => remove(ev)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
