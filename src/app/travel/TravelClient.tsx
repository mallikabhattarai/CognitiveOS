"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetch";

const COMMON_TZ = [
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

type Trip = {
  id: string;
  departure_city: string;
  departure_tz: string;
  arrival_city: string;
  arrival_tz: string;
  departure_datetime: string;
  arrival_datetime: string;
};

type Impact = {
  timezoneShiftHours: number;
  circadianRisk: string;
  recoveryDays: number;
  dayImpacts: { dayOffset: number; strategicClarityDeltaPct: number; notes: string }[];
  recommendations: {
    lightExposure: string;
    caffeineTiming: string;
    napTiming: string;
    bedtimeShift: string;
  };
};

export function TravelClient({ className }: { className?: string }) {
  const [trips, setTrips] = useState<(Trip & { impact?: Impact })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [depCity, setDepCity] = useState("");
  const [depTz, setDepTz] = useState("America/Los_Angeles");
  const [arrCity, setArrCity] = useState("");
  const [arrTz, setArrTz] = useState("Europe/London");
  const [depDateTime, setDepDateTime] = useState("");
  const [arrDateTime, setArrDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth("/api/travel");
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetchWithAuth("/api/travel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departure_city: depCity || "Departure",
        departure_tz: depTz,
        arrival_city: arrCity || "Arrival",
        arrival_tz: arrTz,
        departure_datetime: depDateTime,
        arrival_datetime: arrDateTime,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setTrips((prev) => [data, ...prev]);
      setShowForm(false);
      setDepCity("");
      setArrCity("");
      setDepDateTime("");
      setArrDateTime("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add trip");
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className ?? ""}`}>
        <div className="h-32 animate-pulse rounded-2xl bg-bg-card" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-bg-card px-4 py-3 text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-muted"
      >
        {showForm ? "Cancel" : "+ Add trip"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-risk-muted p-3 text-sm text-risk">
              {error}
            </div>
          )}
          <label className="block text-sm font-medium text-text-primary">
            Departure city
          </label>
          <input
            type="text"
            value={depCity}
            onChange={(e) => setDepCity(e.target.value)}
            placeholder="e.g. San Francisco"
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Departure timezone
          </label>
          <select
            value={depTz}
            onChange={(e) => setDepTz(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {COMMON_TZ.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Arrival city
          </label>
          <input
            type="text"
            value={arrCity}
            onChange={(e) => setArrCity(e.target.value)}
            placeholder="e.g. London"
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Arrival timezone
          </label>
          <select
            value={arrTz}
            onChange={(e) => setArrTz(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {COMMON_TZ.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Departure date & time
          </label>
          <input
            type="datetime-local"
            value={depDateTime}
            onChange={(e) => setDepDateTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Arrival date & time
          </label>
          <input
            type="datetime-local"
            value={arrDateTime}
            onChange={(e) => setArrDateTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Calculating…" : "Get impact"}
          </button>
        </form>
      )}

      {trips.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-text-muted">
            No trips yet. Add a flight to see projected cognitive impact and recovery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: Trip & { impact?: Impact } }) {
  const [expanded, setExpanded] = useState(false);
  const [impact, setImpact] = useState<Impact | undefined>(trip.impact);

  useEffect(() => {
    if (expanded && !impact && trip.id) {
      fetchWithAuth(`/api/travel/${trip.id}/impact`)
        .then((res) => res.ok && res.json())
        .then((data) => data && setImpact(data))
        .catch(() => {});
    }
  }, [expanded, impact, trip.id]);

  const depDate = new Date(trip.departure_datetime);
  const arrDate = new Date(trip.arrival_datetime);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="font-medium text-text-primary">
        {trip.departure_city} → {trip.arrival_city}
      </p>
      <p className="mt-1 text-sm text-text-muted">
        {depDate.toLocaleDateString()} – {arrDate.toLocaleDateString()}
      </p>
      {impact ? (
        <>
          <p className="mt-3 text-sm text-text-primary">
            Time zone shift: {impact.timezoneShiftHours > 0 ? "+" : ""}{impact.timezoneShiftHours}h · Recovery: {impact.recoveryDays} days
          </p>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm font-medium text-accent"
          >
            {expanded ? "Hide details" : "Show impact"}
          </button>
          {expanded && (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">Projected Cognitive Impact</p>
                {impact.dayImpacts.map((d) => (
                  <p key={d.dayOffset} className="mt-1 text-text-muted">
                    Day {d.dayOffset}: {d.strategicClarityDeltaPct}% Strategic Clarity · {d.notes}
                  </p>
                ))}
              </div>
              <div>
                <p className="font-medium text-text-primary">Recommendations</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-text-muted">
                  <li>{impact.recommendations.lightExposure}</li>
                  <li>{impact.recommendations.caffeineTiming}</li>
                  <li>{impact.recommendations.napTiming}</li>
                  <li>{impact.recommendations.bedtimeShift}</li>
                </ul>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-text-muted">
          Add a new trip to see impact (existing trips need to be re-added).
        </p>
      )}
    </div>
  );
}
