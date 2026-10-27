"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import CategoryTag from "@/components/CategoryTag";
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
    <>
      <section className="band">
        <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <p className="eyebrow text-brand-green">Student Event Registration</p>
            <h1 className="mt-4 text-[36px] leading-[1.1] font-medium tracking-[-1.5px] sm:text-5xl lg:text-[64px] xl:text-[72px]">
              Every campus event. One place.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Discover hackathons, workshops, fests and seminars happening in college, and grab your seat in seconds.
            </p>
            <div className="relative mt-8 max-w-xl">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-steel">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.63 3.64a.75.75 0 1 0 1.06-1.06l-3.63-3.64A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
              </svg>
              <input
                type="search"
                aria-label="Search events"
                placeholder="Search by title, description or venue"
                className="input h-14 pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <QueryMockup search={search.trim()} category={category} count={loading ? null : events.length} />
        </div>
      </section>

      <section className="container-page space-y-8 py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {["", ...CATEGORIES].map((c) => (
              <button
                key={c || "all"}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`pill-tab ${category === c ? "pill-tab-active" : ""}`}
              >
                {c || "All events"}
              </button>
            ))}
          </div>
          {!loading && <p className="text-sm text-steel">{events.length} event{events.length === 1 ? "" : "s"}</p>}
        </div>

        <Alert>{error}</Alert>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="card h-64 animate-pulse bg-surface" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg bg-surface px-6 py-16 text-center">
            <p className="text-lg font-semibold">No events found</p>
            <p className="mt-1 text-steel">
              {search || category ? "Try a different search or category." : <>Head to <Link href="/admin" className="link text-base">Admin</Link> to add events or seed sample data.</>}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link
                key={ev._id}
                href={`/events/${ev._id}`}
                className="card group flex flex-col p-6 transition duration-150 hover:border-hairline-strong hover:shadow-card"
              >
                <CategoryTag category={ev.category} />
                <h2 className="mt-4 text-lg leading-[1.4] font-semibold">{ev.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate">{ev.description}</p>
                <dl className="mt-auto space-y-1 pt-5 text-sm text-steel">
                  <div className="flex gap-2"><dt className="sr-only">Date</dt><dd>{formatDate(ev.date)}</dd></div>
                  <div className="flex gap-2"><dt className="sr-only">Venue</dt><dd>{ev.venue}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between border-t border-hairline-soft pt-4">
                  <span className="text-[13px] text-stone">{ev.capacity} seats</span>
                  <span className="text-sm font-medium text-brand-green-dark group-hover:underline">View & register →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// Terminal-style card that mirrors the MongoDB query the filters produce.
function QueryMockup({ search, category, count }) {
  const str = (s) => <span className="text-brand-green">{s}</span>;
  return (
    <div className="hidden rounded-lg border border-white/10 bg-teal-deep/80 font-mono text-sm leading-[1.55] shadow-mockup sm:block">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-5 py-3">
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="ml-3 text-xs text-muted">mongosh · event_registration</span>
      </div>
      <pre className="overflow-x-auto p-5 text-white">
        <span className="text-muted">{"> "}</span>db.events.find({"{"}
        {category && <>{"\n    "}category: {str(`"${category}"`)},</>}
        {search && <>{"\n    "}$or: [{"{"} title: {str(`/${search}/i`)} {"}"}, …],</>}
        {(category || search) && "\n  "}
        {"}"}).sort({"{"} date: <span className="text-brand-green-soft">1</span> {"}"})
        {"\n\n"}
        <span className="text-muted">{count === null ? "// running…" : `// ${count} document${count === 1 ? "" : "s"} returned`}</span>
      </pre>
    </div>
  );
}
