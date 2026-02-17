"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetch";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

type SleepRecord = {
  date: string;
  duration_minutes: number | null;
  quality_rating: number | null;
};

type CheckIn = {
  date: string;
  sleep_quality: number | null;
  mental_clarity: number | null;
};

type InsightsData = {
  sleep: SleepRecord[];
  checkIns: CheckIn[];
  sleepDebtMinutes: number;
  sleepDebtByDate: { date: string; debt: number }[];
  dailyScores?: { date: string; edge_score: number }[];
  drift?: { status: string; drift_pct_5d: number; drift_pct_14d: number } | null;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InsightsClient({ className }: { className?: string }) {
  const [range, setRange] = useState(14);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchWithAuth(`/api/insights?range=${range}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setData(null);
      }
      setLoading(false);
    }
    load();
  }, [range]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className ?? ""}`}>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-accent-muted" />
        <div className="h-48 w-full animate-pulse rounded-2xl bg-bg-card" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-bg-card" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-6 shadow-[var(--shadow-soft)] ${className ?? ""}`}>
        <p className="text-sm text-text-muted">
          Unable to load insights.
        </p>
      </div>
    );
  }

  const sleepChartData = [...data.sleep]
    .reverse()
    .map((r) => ({
      date: formatDate(r.date),
      fullDate: r.date,
      hours: r.duration_minutes != null ? r.duration_minutes / 60 : 0,
      quality: r.quality_rating ?? 0,
    }));

  const clarityByDate = new Map(
    data.checkIns.map((c) => [c.date, c.mental_clarity ?? 0])
  );
  const combinedData = sleepChartData.map((s) => ({
    ...s,
    clarity: clarityByDate.get(s.fullDate) ?? null,
  }));

  const debtChartData = data.sleepDebtByDate.map((d) => ({
    date: formatDate(d.date),
    debt: Math.round(d.debt / 60 * 10) / 10,
  }));

  const edgeChartData = (data.dailyScores ?? []).map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    edge: d.edge_score,
  }));

  return (
    <div className={`space-y-8 ${className ?? ""}`}>
      {data.drift && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-4 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-medium text-text-muted">
            Performance Drift (14-day trend)
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-text-primary">
            {data.drift.status.replace(/_/g, " ")}
          </p>
          {data.drift.drift_pct_5d < 0 && (
            <p className="mt-1 text-sm text-text-muted">
              Your cognitive edge has declined {Math.abs(Math.round(data.drift.drift_pct_5d))}% over the last 5 days.
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {[7, 14, 30].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
              range === r
                ? "bg-accent text-white"
                : "border border-[var(--border-subtle)] text-text-muted hover:bg-accent-muted"
            }`}
          >
            {r}d
          </button>
        ))}
      </div>

      {sleepChartData.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-text-muted">
            Log sleep to see trends.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-sm font-medium text-text-primary">
              Sleep duration (hours)
            </h2>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      value != null ? `${value.toFixed(1)}h` : "—",
                      "Hours",
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {edgeChartData.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-primary">
                Edge Score (14-day trend)
              </h2>
              <div className="mt-2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={edgeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value != null ? value : "—",
                        "Edge",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="edge"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {debtChartData.length > 0 && data.sleepDebtMinutes > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-primary">
                Sleep debt (hours)
              </h2>
              <div className="mt-2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={debtChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value != null ? `${value}h` : "—",
                        "Debt",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="debt"
                      stroke="var(--caution)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {combinedData.some((d) => d.clarity != null && d.clarity > 0) && (
            <div>
              <h2 className="text-sm font-medium text-text-primary">
                Sleep vs. mental clarity
              </h2>
              <div className="mt-2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 10]}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="hours"
                      fill="var(--accent)"
                      name="Hours"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="clarity"
                      stroke="var(--success)"
                      strokeWidth={2}
                      name="Clarity"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
