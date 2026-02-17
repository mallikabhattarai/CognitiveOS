import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseDate(s: string): string | null {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(user.id).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "file is required" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const rows = parseCSV(text);

  const today = new Date().toISOString().slice(0, 10);
  const inserted: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = parseDate(row.date ?? row["sleep date"] ?? "");
    if (!date) {
      errors.push(`Row ${i + 2}: invalid date`);
      continue;
    }
    if (date > today) {
      errors.push(`Row ${i + 2}: future date not allowed`);
      continue;
    }

    let duration: number | null = null;
    if (row.duration_minutes) {
      duration = parseInt(row.duration_minutes, 10);
    } else if (row.duration) {
      duration = parseInt(row.duration, 10);
    } else if (row.bedtime && row.wake_time) {
      const b = new Date(row.bedtime).getTime();
      const w = new Date(row.wake_time).getTime();
      duration = Math.round((w - b) / 60000);
    }
    if (duration != null && (duration < 120 || duration > 840)) {
      errors.push(`Row ${i + 2}: duration must be 2–14 hours`);
      continue;
    }

    let quality: number | null = null;
    if (row.quality_rating) {
      quality = parseInt(row.quality_rating, 10);
      if (quality < 1 || quality > 5) quality = null;
    } else if (row.quality) {
      quality = parseInt(row.quality, 10);
      if (quality < 1 || quality > 5) quality = null;
    }

    const { error } = await supabase.from("sleep_records").upsert(
      {
        user_id: user.id,
        date,
        duration_minutes: duration,
        quality_rating: quality,
        source: "csv_import",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    );

    if (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    } else {
      inserted.push(date);
    }
  }

  return NextResponse.json({
    imported: inserted.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
