"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import { api, formatDate } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);

    // Debounce typing so we don't call the API on every keystroke.
    const timer = setTimeout(() => {
      setLoading(true);
      api(`/api/events?${params}`)
        .then((data) => active && (setEvents(data), setError("")))
        .catch((err) => active && setError(err.message))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming College Events</h1>
        <p className="mt-1 text-slate-500">Find an event you like and register in seconds.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          aria-label="Search events"
          placeholder="Search by title, description or venue…"
          className="input sm:flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Filter by category" className="input sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Alert>{error}</Alert>

      {loading ? (
        <p className="animate-pulse text-slate-500">Loading events…</p>
      ) : events.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No events found. {!search && !category && <>Go to <Link href="/admin" className="text-indigo-600 underline">Admin</Link> to add or seed some.</>}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <div key={ev._id} className="card flex flex-col p-5 transition hover:shadow-md">
              <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{ev.category}</span>
              <h2 className="mt-3 text-lg font-semibold">{ev.title}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">{ev.description}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-500">
                <p>📅 {formatDate(ev.date)}</p>
                <p>📍 {ev.venue}</p>
                <p>👥 Capacity {ev.capacity}</p>
              </div>
              <Link href={`/events/${ev._id}`} className="btn-primary mt-5">View & Register</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
