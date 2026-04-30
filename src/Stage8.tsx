import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  cycleMultiplier,
  effectiveFaucet,
  faucetMultiplier,
  fmt,
  HYDROENTROPY_RATE,
  HYDROENTROPY_TARGET,
  CYCLE_MULT_INC,
  maxSpinSpeed,
  spinGain,
} from "./game";
import {
  LogFeed,
  Panel,
  Stat,
  Tank,
  UpgradeList,
  Wheel,
} from "./components";

type Props = { state: State; dispatch: React.Dispatch<Action> };

export function Stage8({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage VIII — Hydrosphere">
          <div className="flex flex-col gap-4">
            <Tank water={state.water} capacity={state.capacity} />
            <Wheel
              baselineSpeed={autoSpinBaselineDegPerSec(state)}
              maxSpeed={maxSpinSpeed(state)}
              onRevolution={() => dispatch({ type: "spin" })}
              spinValue={spinGain(state)}
              rate={effectiveFaucet(state)}
              multiplier={faucetMultiplier(state)}
            />
          </div>
        </Panel>

        <HydrosphereCore state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Cycle Mult"
              value={`×${fmt(cycleMultiplier(state), 2)}`}
              tone="amber"
            />
            <Stat
              label="Ascensions"
              value={state.ascended.toString()}
              tone="amber"
            />
            <Stat
              label="Lightning ⚡"
              value={fmt(state.lightning, 1)}
              tone="dim"
            />
            <Stat label="Clouds" value={fmt(state.clouds, 0)} tone="dim" />
            <Stat
              label="Research"
              value={`◇${fmt(state.researchPoints, 1)}`}
              tone="amber"
            />
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["research"]}
          title="Research"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["milestone"]}
          title="Operations"
        />
        <LogFeed state={state} />
      </div>
    </div>
  );
}

function HydrosphereCore({ state, dispatch }: Props) {
  const pct = Math.min(100, (state.hydroentropy / HYDROENTROPY_TARGET) * 100);
  const ratePerSec = effectiveFaucet(state) * HYDROENTROPY_RATE;
  const eta = ratePerSec > 0
    ? (HYDROENTROPY_TARGET - state.hydroentropy) / ratePerSec
    : Infinity;
  const ready = state.hydroentropy >= HYDROENTROPY_TARGET;
  return (
    <Panel title="Hydrosphere Core">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="label">hydroentropy</span>
            <span className="readout text-sm tabular-nums">
              {fmt(state.hydroentropy, 0)} / {HYDROENTROPY_TARGET.toExponential(0)}
            </span>
          </div>
          <div className="bar bar-amber mt-1">
            <div className="bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-text-dim">
          <div>
            rate: <span className="readout-dim">+{fmt(ratePerSec, 2)} / sec</span>
          </div>
          <div>
            eta:{" "}
            <span className="readout-dim">
              {Number.isFinite(eta) ? `${fmt(eta, 0)}s` : "—"}
            </span>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-bg/50 p-3">
          <div className="font-stencil text-[11px] tracking-[0.2em] text-text-dim uppercase">
            ◆ Ascension — Cycle
          </div>
          <p className="mt-1 text-xs text-text-dim">
            When the hydrosphere is saturated, you may ascend. All progress
            resets, but a permanent <span className="readout">+{(CYCLE_MULT_INC * 100).toFixed(0)}%</span>{" "}
            multiplier compounds across every future run.
          </p>
          <button
            className={`btn ${ready ? "btn-amber" : ""} mt-2 w-full text-xs`}
            disabled={!ready}
            onClick={() => {
              if (
                confirm(
                  `Ascend?\n\nAll progress resets. Cycle multiplier becomes ×${fmt(cycleMultiplier(state) + CYCLE_MULT_INC, 2)}.`,
                )
              ) {
                dispatch({ type: "ascendCycle" });
              }
            }}
          >
            {ready
              ? `Ascend — Cycle ×${fmt(cycleMultiplier(state) + CYCLE_MULT_INC, 2)}`
              : `Saturating… ${fmt(pct, 1)}%`}
          </button>
        </div>
      </div>
    </Panel>
  );
}
