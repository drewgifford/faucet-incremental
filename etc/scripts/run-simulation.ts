// =============================================================================
// run-simulation.ts — runs the headless simulator and prints the report.
// Designed to be invoked with `bun run etc/scripts/run-simulation.ts`.
//
// The simulator runs at full Node speed (effectively 10,000x+ realtime). We
// don't deliberately slow it down — the "10,000x speed" target from the spec
// is a *minimum*, not a cap.
// =============================================================================

import {
  formatReport,
  simulate,
} from "../../src/simulation/simulator";

const start = Date.now();
const result = simulate({ maxSeconds: 36 * 3600 });
const elapsedMs = Date.now() - start;

const report = formatReport(result);
console.log(report);
console.log("");
console.log(
  `[wall clock] simulator ran ${result.totalSimSeconds.toFixed(0)} sim-seconds in ${elapsedMs} ms ` +
    `(speedup ≈ ${(result.totalSimSeconds * 1000 / Math.max(1, elapsedMs)).toFixed(0)}x)`,
);

if (!result.withinAllTargets) {
  process.exitCode = 1;
}
