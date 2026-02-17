type SleepRecord = {
  id: string;
  date: string;
  duration_minutes: number | null;
  quality_rating: number | null;
};

export function SleepList({
  records,
  className,
}: {
  records: SleepRecord[];
  className?: string;
}) {
  if (records.length === 0) {
    return (
      <p className={`text-sm text-text-muted ${className ?? ""}`}>
        No sleep records yet. Log your first night above.
      </p>
    );
  }

  return (
    <ul className={`space-y-2 ${className ?? ""}`}>
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-bg-card px-4 py-3 shadow-[var(--shadow-soft)]"
        >
          <div>
            <p className="font-medium text-text-primary">
              {formatDate(r.date)}
            </p>
            <p className="text-sm text-text-muted">
              {r.duration_minutes != null
                ? `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}m`
                : "—"}
              {r.quality_rating != null && ` · Quality ${r.quality_rating}/5`}
            </p>
          </div>
        </li>
      ))}
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
