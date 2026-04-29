import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  CROPS,
  effectiveFaucet,
  fmt,
  foodCap,
  laborPerSec,
  maxSpinSpeed,
  popCap,
  POP_FOOD_NEED,
  POP_WATER_NEED,
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

export function Stage4({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage IV — Settlement">
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

        <SettlementPanel state={state} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Population"
              value={`${fmt(state.population, 1)} / ${popCap(state)}`}
              tone="amber"
            />
            <Stat
              label="Food"
              value={`${fmt(state.food, 1)} / ${foodCap(state)}`}
              tone="dim"
            />
            <Stat label="Labor" value={fmt(state.labor, 0)} tone="amber" />
            <Stat
              label="Labor / sec"
              value={fmt(laborPerSec(state), 2)}
              tone="dim"
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
          groups={["settlement"]}
          title="Settlement"
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

function SettlementPanel({ state }: { state: State }) {
  const cap = popCap(state);
  const popPct = (state.population / cap) * 100;
  const foodPct = (state.food / foodCap(state)) * 100;
  const waterDemand = state.population * POP_WATER_NEED;
  const foodDemand = state.population * POP_FOOD_NEED;
  const plantedSlots = state.ghSlots.filter((s) => s.crop);
  const foodGen = plantedSlots.reduce(
    (acc, sl) => acc + (sl.crop ? CROPS[sl.crop].foodPerSec ?? 0 : 0),
    0,
  );
  const foodNet = foodGen - foodDemand;
  const starving = state.food < foodDemand || state.water < waterDemand;
  return (
    <Panel title="Settlement">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="label">population</span>
            <span className="readout text-sm tabular-nums">
              {fmt(state.population, 1)} / {cap}
            </span>
          </div>
          <div className="bar bar-amber mt-1">
            <div className="bar-fill" style={{ width: `${popPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="label">food</span>
            <span className="readout-dim text-sm tabular-nums">
              {fmt(state.food, 1)} / {foodCap(state)}
            </span>
          </div>
          <div className="bar bar-emerald mt-1">
            <div className="bar-fill" style={{ width: `${foodPct}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-sm border border-border bg-bg/40 p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="label">food source</span>
            <span className="readout-dim tabular-nums">
              {plantedSlots.length} slot{plantedSlots.length === 1 ? "" : "s"}{" "}
              → +{fmt(foodGen, 3)} food/s
            </span>
          </div>
          <div className="text-text-dim">
            Each crop produces a different food rate (Potato is the food
            specialist at +0.10/s). Plant on the Stage II tab.
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1">
            <span className="label">net food</span>
            <span
              className={`readout text-sm tabular-nums ${foodNet < 0 ? "text-bad" : foodNet === 0 ? "text-warn" : "text-emerald"}`}
            >
              {foodNet >= 0 ? "+" : ""}
              {fmt(foodNet, 3)} /s
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label">consumption</span>
            <span className="readout-dim tabular-nums">
              {fmt(waterDemand, 2)} water/s · {fmt(foodDemand, 3)} food/s
            </span>
          </div>
        </div>
        {starving && state.population > 0 && (
          <div className="text-bad font-stencil text-[10px] tracking-widest uppercase">
            ⚠ population is starving — plant more greenhouse slots or supply
            water
          </div>
        )}
      </div>
    </Panel>
  );
}
