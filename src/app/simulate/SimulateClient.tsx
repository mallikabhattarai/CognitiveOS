"use client";

import { useState } from "react";
import {
  runSimulation,
  type SimulateScenario,
  type SimulateResult,
} from "@/lib/physiological/simulate";

const SCENARIOS: { id: SimulateScenario; label: string }[] = [
  { id: "late_dinner", label: "Late dinner" },
  { id: "two_drinks", label: "2 drinks" },
  { id: "red_eye_flight", label: "Red-eye flight" },
  { id: "screen_90_before_bed", label: "Screen use 90 mins before bed" },
];

export function SimulateClient({
  className,
  chronotype,
}: {
  className?: string;
  chronotype: string;
}) {
  const [selected, setSelected] = useState<SimulateScenario | null>(null);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [customAlcohol, setCustomAlcohol] = useState("");
  const [customBedtimeShift, setCustomBedtimeShift] = useState("");
  const [customNap, setCustomNap] = useState("");
  const [customScreen, setCustomScreen] = useState("");

  function handleScenario(scenario: SimulateScenario) {
    setSelected(scenario);
    const res = runSimulation(
      { scenario },
      { chronotype }
    );
    setResult(res);
  }

  function handleCustom() {
    setSelected("custom");
    const res = runSimulation({
      scenario: "custom",
      alcohol_timing: customAlcohol || undefined,
      bedtime_shift_minutes: customBedtimeShift
        ? parseInt(customBedtimeShift, 10)
        : undefined,
      nap_duration_minutes: customNap ? parseInt(customNap, 10) : undefined,
      screen_minutes: customScreen ? parseInt(customScreen, 10) : undefined,
    });
    setResult(res);
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <p className="text-sm font-medium text-text-primary">
          Select a scenario
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleScenario(s.id)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                selected === s.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-[var(--border-subtle)] bg-bg-card text-text-primary hover:bg-accent-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-medium text-text-primary">
            Custom scenario
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-text-muted">
                Alcohol timing (e.g. 21:30)
              </label>
              <input
                type="text"
                value={customAlcohol}
                onChange={(e) => setCustomAlcohol(e.target.value)}
                placeholder="HH:mm"
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-card px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">
                Bedtime shift (minutes, + or -)
              </label>
              <input
                type="number"
                value={customBedtimeShift}
                onChange={(e) => setCustomBedtimeShift(e.target.value)}
                placeholder="e.g. 60"
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-card px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">
                Nap duration (minutes)
              </label>
              <input
                type="number"
                value={customNap}
                onChange={(e) => setCustomNap(e.target.value)}
                placeholder="e.g. 20"
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-card px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">
                Screen time before bed (minutes)
              </label>
              <input
                type="number"
                value={customScreen}
                onChange={(e) => setCustomScreen(e.target.value)}
                placeholder="e.g. 90"
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-card px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <button
              onClick={handleCustom}
              className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Run custom simulation
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-6 space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-medium text-text-primary">
              Projected impact
            </p>
            <div className="space-y-3 text-sm text-text-primary">
              <p>
                <span className="inline-block w-28 shrink-0 text-text-muted">
                  REM:
                </span>{" "}
                {result.rem_suppression_estimate}
              </p>
              <p>
                <span className="inline-block w-28 shrink-0 text-text-muted">
                  Latency:
                </span>{" "}
                {result.sleep_latency_change}
              </p>
              <p>
                <span className="inline-block w-28 shrink-0 text-text-muted">
                  Windows:
                </span>{" "}
                {result.cognitive_window_shift}
              </p>
            </div>
            <p className="border-t border-[var(--border-subtle)] pt-3 text-sm text-text-muted">
              {result.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
