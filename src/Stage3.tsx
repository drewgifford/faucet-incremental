import type { Action, State } from "./game";
import {
  aqueductMultiplier,
  autoSpinBaselineDegPerSec,
  effectiveFaucet,
  fmt,
  maxPressure,
  maxSpinSpeed,
  pressureBurstMultiplier,
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

export function Stage3({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage III — Aqueducts">
          <div className="flex flex-col gap-4">
            <Tank water={state.water} capacity={state.capacity} />
            <Wheel
              baselineSpeed={autoSpinBaselineDegPerSec(state)}
              maxSpeed={maxSpinSpeed(state)}
              onRevolution={() => dispatch({ type: "spin" })}
              spinValue={spinGain(state)}
              rate={effectiveFaucet(state)}
            />
          </div>
        </Panel>

        <AqueductPanel state={state} dispatch={dispatch} />
        <PressurePanel state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Seeds" value={state.seeds.toString()} tone="amber" />
            <Stat label="Salt" value={fmt(state.salt, 2)} tone="dim" />
            <Stat
              label="Aqueducts"
              value={state.aqueducts.toString()}
              tone="steel"
            />
            <Stat
              label="Amplification"
              value={`×${fmt(aqueductMultiplier(state), 2)}`}
              tone="steel"
            />
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
          groups={["aqueduct"]}
          title="Infrastructure"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["greenhouse"]}
          title="Greenhouse Tech"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["bamboo"]}
          title="Cultivation"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["storage", "manual", "automation"]}
          title="Workshop"
        />
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

function AqueductPanel({ state, dispatch }: Props) {
  if (state.aqueducts === 0) {
    return (
      <Panel title="Aqueducts">
        <div className="text-text-dim text-xs italic">
          No aqueducts laid. Build one from the panel on the right.
        </div>
      </Panel>
    );
  }
  const totalMissing = state.aqueductIntegrity.reduce(
    (acc, iv) => acc + (1 - iv),
    0,
  );
  const repairCost = Math.ceil(totalMissing * 5);
  return (
    <Panel title={`Aqueducts (${state.aqueducts})`}>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {state.aqueductIntegrity.map((integ, i) => (
            <AqueductCell key={i} idx={i} integrity={integ} />
          ))}
        </div>
        <button
          className="btn btn-steel text-xs"
          onClick={() => dispatch({ type: "repairAqueducts" })}
          disabled={repairCost === 0 || state.water < repairCost}
        >
          {repairCost === 0
            ? "All aqueducts at full integrity"
            : `Repair All (${repairCost} water)`}
        </button>
      </div>
    </Panel>
  );
}

function AqueductCell({
  idx,
  integrity,
}: {
  idx: number;
  integrity: number;
}) {
  const pct = integrity * 100;
  const failing = integrity < 0.5;
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border bg-bg/50 p-2">
      <div className="flex items-center justify-between">
        <span className="label">aq {idx + 1}</span>
        <span
          className={`readout-dim text-[11px] tabular-nums ${failing ? "text-warn" : ""}`}
        >
          {fmt(pct, 0)}%
        </span>
      </div>
      <div className="bar">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: failing
              ? "linear-gradient(180deg, var(--color-warn), #8b5a13)"
              : "linear-gradient(180deg, var(--color-steel), var(--color-steel-2))",
          }}
        />
      </div>
    </div>
  );
}

function PressurePanel({ state, dispatch }: Props) {
  const max = maxPressure(state);
  const pct = (state.pressure / max) * 100;
  const burst = state.pressure * pressureBurstMultiplier(state);
  return (
    <Panel title="Pressure">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="label">accumulated</span>
          <span className="readout text-sm tabular-nums">
            {fmt(state.pressure, 1)} / {max}
          </span>
        </div>
        <div className="bar bar-amber">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {state.pressureValveBought ? (
          <button
            className="btn btn-amber text-xs"
            disabled={state.pressure <= 0}
            onClick={() => dispatch({ type: "releasePressure" })}
          >
            Release ({fmt(burst, 1)} water)
          </button>
        ) : (
          <span className="text-text-dim text-xs italic">
            install Pressure Valve to release accumulated pressure
          </span>
        )}
      </div>
    </Panel>
  );
}
