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
  Cell,
  ReferenceLine,
  ReferenceArea,
  Area,
  AreaChart,
  Legend,
} from "recharts";

type SleepRecord = {
  date: string;
  duration_minutes: number | null;
  quality_rating: number | null;
  bedtime?: string | null;
  wake_time?: string | null;
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

function barColorByHours(hours: number): string {
  if (hours >= 7) return "var(--success)";
  if (hours >= 6) return "var(--caution)";
  return "var(--risk)";
}

function driftBadgeColor(status: string): string {
  if (status === "stable") return "bg-success-muted text-success";
  if (status === "slight_compression") return "bg-caution-muted text-caution";
  return "bg-risk-muted text-risk";
}

const CARD_CLASS =
  "rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]";

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
      <div className={`${CARD_CLASS} ${className ?? ""}`}>
        <p className="text-sm text-text-muted">Unable to load insights.</p>
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
    fullDate: d.date,
    debt: Math.round((d.debt / 60) * 10) / 10,
  }));

  const edgeChartData = (data.dailyScores ?? []).map((d) => ({
    date: formatDate(d.date),
    fullDate: d.date,
    edge: d.edge_score,
  }));

  const hoursWithData = sleepChartData
    .filter((s) => s.hours > 0)
    .map((s) => s.hours);
  const avgSleep =
    hoursWithData.length > 0
      ? hoursWithData.reduce((a, b) => a + b, 0) / hoursWithData.length
      : 0;
  const bestNight = hoursWithData.length > 0 ? Math.max(...hoursWithData) : 0;
  const worstNight =
    hoursWithData.length > 0 ? Math.min(...hoursWithData) : 0;
  const debtHours = Math.round((data.sleepDebtMinutes / 60) * 10) / 10;

  const midpoints: number[] = [];
  for (const r of data.sleep) {
    if (r.bedtime && r.wake_time) {
      const b = new Date(r.bedtime).getTime();
      const w = new Date(r.wake_time).getTime();
      const mid = (b + w) / 2;
      const d = new Date(mid);
      midpoints.push(d.getHours() * 60 + d.getMinutes());
    }
  }
  const midpointRangeMinutes =
    midpoints.length >= 2 ? Math.max(...midpoints) - Math.min(...midpoints) : 0;
  const midpointVariance =
    midpointRangeMinutes >= 60
      ? `${Math.round(midpointRangeMinutes / 60)}h`
      : midpointRangeMinutes > 0
        ? `${midpointRangeMinutes} min`
        : null;

  const debtAccumulating =
    debtChartData.length >= 2 &&
    (debtChartData[debtChartData.length - 1]?.debt ?? 0) >
      (debtChartData[0]?.debt ?? 0);

  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      <div className="flex gap-2">
        {[7, 14, 30].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              range === r
                ? "bg-accent text-white"
                : "border border-[var(--border-subtle)] text-text-muted hover:bg-accent-muted"
            }`}
          >
            {r}d
          </button>
        ))}
      </div>

      {sleepChartData.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className={CARD_CLASS}>
            <p className="text-xs font-medium text-text-muted">Avg sleep</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
              {avgSleep.toFixed(1)}h
            </p>
          </div>
          <div className={CARD_CLASS}>
            <p className="text-xs font-medium text-text-muted">Best</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-success">
              {bestNight.toFixed(1)}h
            </p>
          </div>
          <div className={CARD_CLASS}>
            <p className="text-xs font-medium text-text-muted">Worst</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-risk">
              {worstNight.toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {debtHours > 0 && (
        <div className={CARD_CLASS}>
          <p className="text-xs font-medium text-text-muted">Current debt</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-caution">
            {debtHours}h
            {debtAccumulating && (
              <span className="ml-2 text-sm font-normal">Accumulating</span>
            )}
          </p>
        </div>
      )}

      {data.drift && (
        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-text-muted">
                Performance Drift (14-day)
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${driftBadgeColor(
                  data.drift.status
                )}`}
              >
                {data.drift.status.replace(/_/g, " ")}
              </span>
              {data.drift.drift_pct_5d < 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  −{Math.abs(Math.round(data.drift.drift_pct_5d))}% over 5 days
                </p>
              )}
            </div>
            {edgeChartData.length > 0 && (
              <div className="h-12 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={edgeChartData}>
                    <Line
                      type="monotone"
                      dataKey="edge"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {sleepChartData.length === 0 ? (
        <div className={CARD_CLASS}>
          <p className="text-sm text-text-muted">Log sleep to see trends.</p>
        </div>
      ) : (
        <>
          <div className={CARD_CLASS}>
            <h2 className="text-sm font-semibold text-text-primary">
              Sleep duration (hours)
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Target: 7.5h · Green ≥7h, yellow 6–7h, red &lt;6h
            </p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <ReferenceLine
                    y={7.5}
                    stroke="var(--success)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      value != null ? `${value.toFixed(1)}h` : "—",
                      "Hours",
                    ]}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-bg-card px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium">{payload[0].payload?.date}</p>
                          <p>Hours: {(payload[0].value as number)?.toFixed(1) ?? "—"}</p>
                          {(payload[0].payload as { quality?: number })?.quality != null &&
                            (payload[0].payload as { quality?: number }).quality! > 0 && (
                              <p>Quality: {(payload[0].payload as { quality?: number }).quality}/5</p>
                            )}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {sleepChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={barColorByHours(entry.hours)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {edgeChartData.length > 0 && (
            <div className={CARD_CLASS}>
              <h2 className="text-sm font-semibold text-text-primary">
                Edge Score (14-day trend)
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Target: 70 · Zone bands show performance ranges
              </p>
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={edgeChartData}>
                    <defs>
                      <linearGradient
                        id="edgeGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--accent)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--accent)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ReferenceArea
                      y1={70}
                      y2={100}
                      fill="var(--success)"
                      fillOpacity={0.08}
                    />
                    <ReferenceArea
                      y1={50}
                      y2={70}
                      fill="var(--caution)"
                      fillOpacity={0.06}
                    />
                    <ReferenceArea
                      y1={0}
                      y2={50}
                      fill="var(--risk)"
                      fillOpacity={0.06}
                    />
                    <ReferenceLine
                      y={70}
                      stroke="var(--success)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.8}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value != null ? value : "—",
                        "Edge",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="edge"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fill="url(#edgeGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="edge"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      dot={{ r: 5, fill: "var(--accent)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className={CARD_CLASS}>
            <h2 className="text-sm font-semibold text-text-primary">
              Sleep debt (hours)
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {data.sleepDebtMinutes > 0
                ? "Cumulative shortfall vs. 7.5h target"
                : "No debt — sleep meets target"}
            </p>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={debtChartData}>
                  <defs>
                    <linearGradient
                      id="debtGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--caution)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--caution)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      value != null ? `${value}h` : "—",
                      "Debt",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="debt"
                    stroke="var(--caution)"
                    strokeWidth={2}
                    fill="url(#debtGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="debt"
                    stroke="var(--caution)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--caution)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {combinedData.some((d) => d.clarity != null && d.clarity > 0) && (
            <div className={CARD_CLASS}>
              <h2 className="text-sm font-semibold text-text-primary">
                Sleep vs. mental clarity
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Bars: hours · Line: clarity (1–10)
              </p>
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 10]}
                      tick={{ fontSize: 10 }}
                      label={{
                        value: "Clarity",
                        angle: 90,
                        position: "insideRight",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined, name?: string) => [
                        value != null
                          ? name === "Hours"
                            ? `${value.toFixed(1)}h`
                            : value
                          : "—",
                        name ?? "",
                      ]}
                    />
                    <Legend />
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
                      dot={{ r: 4, fill: "var(--success)" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {midpoints.length >= 3 && midpointVariance && (
            <div className={CARD_CLASS}>
              <h2 className="text-sm font-semibold text-text-primary">
                Sleep consistency
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Bedtime midpoint variance over period
              </p>
              <p className="mt-3 text-lg font-medium text-text-primary">
                Your sleep midpoint varies by ~{midpointVariance}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${Math.min(100, 100 - midpointRangeMinutes * 0.5)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
