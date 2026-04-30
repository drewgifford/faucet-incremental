import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  BAMBOO_PLANT_COST,
  bambooGrowTime,
  bambooYield,
  CROPS,
  effectiveFaucet,
  faucetMultiplier,
  fmt,
  maxSpinSpeed,
  spinGain,
} from "./game";
import { LogFeed, Panel, Stat, Tank, UpgradeList, Wheel } from "./components";

type Props = { state: State; dispatch: React.Dispatch<Action> };

export function Stage1({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage I — Seedstock">
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

        <BambooPanel state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Seeds" value={state.seeds.toString()} tone="amber" />
            <Stat label="Salt" value={fmt(state.salt, 2)} tone="dim" />
            <Stat
              label="Bamboo Harvested"
              value={state.bambooHarvested.toString()}
            />
            <Stat label="Total Water" value={fmt(state.totalWater, 1)} tone="steel" />
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
          groups={["bamboo"]}
          title="Cultivation"
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

function BambooPanel({ state, dispatch }: Props) {
  const growT = bambooGrowTime(state);
  const y = bambooYield(state);
  const readyCount = state.plots.filter((p) => p.ready).length;
  const emptyCount = state.plots.filter((p) => !p.planted).length;
  const canPlantAny =
    emptyCount > 0 && state.water >= BAMBOO_PLANT_COST;

  return (
    <Panel title={`Bamboo Plots (${state.plots.length})`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>cycle: {fmt(growT, 1)}s</span>
          <span>
            yield/harvest: +{fmt(y, 3)} u/s · +1 seed
            {(CROPS.bamboo.harvestSalt ?? 0) > 0 &&
              ` · +${fmt(CROPS.bamboo.harvestSalt ?? 0, 2)} salt`}
          </span>
        </div>
        {state.autoHarvesterBought && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-dim">auto-harvester</span>
            <button
              onClick={() => dispatch({ type: "toggleAutoHarvester" })}
              className={`btn text-[10px] ${state.autoHarvesterEnabled ? "btn-emerald" : ""}`}
            >
              {state.autoHarvesterEnabled ? "ON" : "OFF"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {state.plots.map((p, i) => (
            <PlotRow
              key={i}
              idx={i}
              plot={p}
              growT={growT}
              yieldVal={y}
              waterAvail={state.water}
              dispatch={dispatch}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="btn flex-1 text-xs"
            onClick={() => dispatch({ type: "plantAllBamboo" })}
            disabled={!canPlantAny}
          >
            Plant All ({emptyCount} × {BAMBOO_PLANT_COST}w)
          </button>
          <button
            className="btn btn-emerald flex-1 text-xs"
            onClick={() => dispatch({ type: "harvestAllBamboo" })}
            disabled={readyCount === 0}
          >
            Harvest All ({readyCount})
          </button>
        </div>

        {state.autoHarvesterBought && (
          <div
            className={`font-stencil text-[10px] tracking-widest uppercase ${state.autoHarvesterEnabled ? "text-emerald" : "text-text-dim"}`}
          >
            ◆ auto-harvester{" "}
            {state.autoHarvesterEnabled ? "engaged" : "disengaged"}
          </div>
        )}
      </div>
    </Panel>
  );
}

function PlotRow({
  idx,
  plot,
  growT,
  yieldVal,
  waterAvail,
  dispatch,
}: {
  idx: number;
  plot: { planted: boolean; progress: number; ready: boolean };
  growT: number;
  yieldVal: number;
  waterAvail: number;
  dispatch: React.Dispatch<Action>;
}) {
  const remaining = growT * (1 - plot.progress);
  const status = !plot.planted
    ? "EMPTY"
    : plot.ready
      ? "READY"
      : `${fmt(remaining, 1)}s`;
  return (
    <div className="flex flex-col gap-1.5 rounded-sm border border-border bg-bg/50 p-2">
      <div className="flex items-center justify-between">
        <span className="label">plot {idx + 1}</span>
        <span
          className={`readout-dim text-[11px] tabular-nums ${plot.ready ? "text-emerald" : ""}`}
        >
          {status}
        </span>
      </div>
      <div className={`bar ${plot.ready ? "bar-emerald" : ""}`}>
        <div
          className="bar-fill"
          style={{ width: `${plot.progress * 100}%` }}
        />
      </div>
      <div className="flex gap-1.5">
        {!plot.planted && (
          <button
            className="btn flex-1 text-[10px]"
            onClick={() =>
              dispatch({ type: "plantBamboo", plotIdx: idx })
            }
            disabled={waterAvail < BAMBOO_PLANT_COST}
          >
            Plant ({BAMBOO_PLANT_COST}w)
          </button>
        )}
        {plot.planted && (
          <button
            className="btn btn-emerald flex-1 text-[10px]"
            onClick={() =>
              dispatch({ type: "harvestBamboo", plotIdx: idx })
            }
            disabled={!plot.ready}
          >
            Harvest (+{fmt(yieldVal, 3)} u/s)
          </button>
        )}
      </div>
    </div>
  );
}
