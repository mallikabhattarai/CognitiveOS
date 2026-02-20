/**
 * CognitiveOS v2 – Physiological Performance Modeling Layer
 * Barrel export for all physiological modules.
 */

export { computeCircadianAlignment } from "./circadian-alignment";
export type { CircadianAlignmentResult } from "./circadian-alignment";

export { computeSleepPressure } from "./sleep-pressure";
export type { SleepPressureResult } from "./sleep-pressure";

export { computeCognitiveWindows } from "./cognitive-windows";
export type {
  CognitiveWindowsResult,
  CognitiveWindow,
} from "./cognitive-windows";

export { computeProjection72h } from "./projection-72h";
export type { Projection72hResult, ProjectionPoint } from "./projection-72h";

export { computeSleepArchitecture } from "./sleep-architecture";
export type { SleepArchitectureResult } from "./sleep-architecture";

export { computeSleepAge, SLEEP_AGE_DISCLAIMER } from "./sleep-age";
export type { SleepAgeResult } from "./sleep-age";

export { runSimulation } from "./simulate";
export type {
  SimulateScenario,
  SimulateInput,
  SimulateResult,
} from "./simulate";
