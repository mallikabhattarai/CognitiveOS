type SleepRecord = {
  id: string;
  date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality_rating: number | null;
  caffeine_after_2pm?: boolean | null;
  alcohol_tonight?: boolean | null;
  screen_time_minutes?: number | null;
  exercise_today?: boolean | null;
};

function durationColor(min: number): string {
  const h = min / 60;
  if (h >= 7) return "var(--success)";
  if (h >= 6) return "var(--caution)";
  return "var(--risk)";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function SleepList({
  records,
  className,
}: {
  records: SleepRecord[];
  className?: string;
}) {
  if (records.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-[var(--border-subtle)] bg-bg-muted/30 px-6 py-12 text-center ${className ?? ""}`}
      >
        <p className="text-sm font-medium text-text-primary">
          No sleep records yet
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Log your first night above to start tracking.
        </p>
      </div>
    );
  }

  return (
    <ul className={`space-y-3 ${className ?? ""}`}>
      {records.map((r) => {
        const hours = r.duration_minutes != null ? r.duration_minutes / 60 : 0;
        const durationPct = Math.min(100, (hours / 10) * 100);
        const barColor = r.duration_minutes != null
          ? durationColor(r.duration_minutes)
          : "var(--text-muted)";

        return (
          <li
            key={r.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-medium)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary">
                  {formatDate(r.date)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
                  {r.duration_minutes != null && (
                    <span className="tabular-nums">
                      {Math.floor(r.duration_minutes / 60)}h {r.duration_minutes % 60}m
                    </span>
                  )}
                  {r.bedtime && r.wake_time && (
                    <span className="font-mono text-xs">
                      {formatTime(r.bedtime)} → {formatTime(r.wake_time)}
                    </span>
                  )}
                </div>
                {r.duration_minutes != null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${durationPct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                )}
                {(r.quality_rating != null ||
                  r.caffeine_after_2pm ||
                  r.alcohol_tonight ||
                  r.exercise_today ||
                  (r.screen_time_minutes != null && r.screen_time_minutes > 0)) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.quality_rating != null && (
                      <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                        Quality {r.quality_rating}/5
                      </span>
                    )}
                    {r.caffeine_after_2pm && (
                      <span className="rounded-md bg-caution/15 px-1.5 py-0.5 text-xs text-caution">
                        Caffeine
                      </span>
                    )}
                    {r.alcohol_tonight && (
                      <span className="rounded-md bg-caution/15 px-1.5 py-0.5 text-xs text-caution">
                        Alcohol
                      </span>
                    )}
                    {r.exercise_today && (
                      <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-xs text-success">
                        Exercise
                      </span>
                    )}
                    {r.screen_time_minutes != null && r.screen_time_minutes > 0 && (
                      <span className="rounded-md bg-bg-muted px-1.5 py-0.5 text-xs text-text-muted">
                        {r.screen_time_minutes}m screens
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
