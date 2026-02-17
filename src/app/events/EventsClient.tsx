"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetch";
import { EVENT_TYPES } from "@/lib/events/optimizer";

type Event = {
  id: string;
  event_type: string;
  event_label: string | null;
  target_date: string;
  target_edge_score: number;
  sleep_target_minutes: number | null;
  optimal_bedtime: string | null;
  recovery_days: number | null;
};

function formatEventLabel(type: string, label: string | null): string {
  if (type === "custom" && label) return label;
  const found = EVENT_TYPES.find((e) => e.value === type);
  return found?.label ?? type;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EventsClient({ className }: { className?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState("board_meeting");
  const [customLabel, setCustomLabel] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetchWithAuth("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        event_label: eventType === "custom" ? customLabel : undefined,
        target_date: targetDate,
        target_edge_score: 85,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setEvents((prev) => [...prev, data].sort((a, b) => a.target_date.localeCompare(b.target_date)));
      setShowForm(false);
      setTargetDate("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create event");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

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
        {showForm ? "Cancel" : "+ Add event"}
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
            Event type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {EVENT_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          {eventType === "custom" && (
            <>
              <label className="mt-4 block text-sm font-medium text-text-primary">
                Custom label
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Investor pitch"
                className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </>
          )}
          <label className="mt-4 block text-sm font-medium text-text-primary">
            Target date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={today}
            required
            className="mt-1 block w-full rounded-xl border border-[var(--border-subtle)] bg-bg-base px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Get plan"}
          </button>
        </form>
      )}

      {events.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-text-muted">
            No upcoming events. Add one to get a Performance Target Plan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <p className="font-medium text-text-primary">
                {formatEventLabel(ev.event_type, ev.event_label)}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {formatDate(ev.target_date)} · Target ≥{ev.target_edge_score} Edge Score
              </p>
              {ev.sleep_target_minutes != null && (
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-text-primary">
                    <strong>Sleep target:</strong> {Math.floor(ev.sleep_target_minutes / 60)}h {ev.sleep_target_minutes % 60}m for next 2 nights
                  </p>
                  {ev.optimal_bedtime && (
                    <p className="text-text-primary">
                      <strong>Optimal bedtime:</strong> {ev.optimal_bedtime}
                    </p>
                  )}
                  {ev.recovery_days != null && ev.recovery_days > 0 && (
                    <p className="text-text-primary">
                      <strong>Travel buffer:</strong> +{ev.recovery_days} recovery day(s) required
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
