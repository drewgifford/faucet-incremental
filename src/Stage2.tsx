import { useState } from "react";
import type { Action, CropType, Slot, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  CROPS,
  cropGrowTime,
  effectiveFaucet,
  fmt,
  HEAT_GROWTH_THRESHOLD,
  HEAT_WITHER_THRESHOLD,
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

export function Stage2({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage II — Greenhouse">
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

        <GreenhousePanel state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Seeds" value={state.seeds.toString()} tone="amber" />
            <Stat label="Salt" value={fmt(state.salt, 2)} tone="dim" />
            <Stat label="Greenhouses" value={state.greenhouses.toString()} />
            <Stat label="Bamboo" value={state.bambooHarvested.toString()} tone="dim" />
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

function HeatGauge({ heat }: { heat: number }) {
  const pct = Math.min(100, (heat / HEAT_WITHER_THRESHOLD) * 100);
  const danger = heat >= HEAT_GROWTH_THRESHOLD;
  const wither = heat >= HEAT_WITHER_THRESHOLD;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label">heat</span>
        <span
          className={`readout text-sm tabular-nums ${
            wither ? "text-bad" : danger ? "text-warn" : ""
          }`}
        >
          {fmt(heat, 1)} / {HEAT_WITHER_THRESHOLD}
        </span>
      </div>
      <div className="bar">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: wither
              ? "linear-gradient(180deg, var(--color-bad), #7a1f1f)"
              : danger
                ? "linear-gradient(180deg, var(--color-warn), #8b5a13)"
                : "linear-gradient(180deg, var(--color-rust), var(--color-rust-2))",
          }}
        />
      </div>
      {danger && !wither && (
        <span className="text-warn font-stencil text-[10px] tracking-widest uppercase">
          ⚠ growth halved above {HEAT_GROWTH_THRESHOLD}
        </span>
      )}
      {wither && (
        <span className="text-bad font-stencil text-[10px] tracking-widest uppercase">
          ⚠ crops withering
        </span>
      )}
    </div>
  );
}

function GreenhousePanel({ state, dispatch }: Props) {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("bamboo");
  if (state.ghSlots.length === 0) {
    return (
      <Panel title="Greenhouse">
        <div className="text-text-dim text-xs italic">
          No greenhouses constructed. Build one from the panel on the right.
        </div>
      </Panel>
    );
  }
  const cropList: CropType[] = ["bamboo", "lotus", "reeds", "mangrove", "saguaro"];
  const unlockedCrops = cropList.filter((id) => CROPS[id].unlocked(state));

  const readyCount = state.ghSlots.filter(
    (s) => s.crop && s.ready,
  ).length;

  return (
    <Panel title={`Greenhouse — ${state.ghSlots.length} slots`}>
      <div className="flex flex-col gap-3">
        <HeatGauge heat={state.heat} />

        {/* Crop picker */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label">plant:</span>
          {unlockedCrops.map((id) => {
            const def = CROPS[id];
            const active = selectedCrop === id;
            return (
              <button
                key={id}
                className={`btn text-[11px] ${active ? "btn-amber" : ""}`}
                onClick={() => setSelectedCrop(id)}
                title={cropDescription(def)}
              >
                {def.name}
              </button>
            );
          })}
        </div>

        {/* Slot grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {state.ghSlots.map((slot, i) => (
            <SlotCell
              key={i}
              slot={slot}
              idx={i}
              selected={selectedCrop}
              waterAvail={state.water}
              state={state}
              dispatch={dispatch}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="btn btn-emerald flex-1 text-xs"
            onClick={() => dispatch({ type: "harvestAllCrops" })}
            disabled={readyCount === 0}
          >
            Harvest All ({readyCount})
          </button>
        </div>
      </div>
    </Panel>
  );
}

function SlotCell({
  slot,
  idx,
  selected,
  waterAvail,
  state,
  dispatch,
}: {
  slot: Slot;
  idx: number;
  selected: CropType;
  waterAvail: number;
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const def = slot.crop ? CROPS[slot.crop] : null;
  const selDef = CROPS[selected];

  const status = !slot.crop
    ? "EMPTY"
    : slot.ready
      ? "READY"
      : def!.growTime === 0
        ? "PRODUCING"
        : `${fmt(cropGrowTime(state, slot.crop!) * (1 - slot.progress), 1)}s`;

  return (
    <div className="flex flex-col gap-1.5 rounded-sm border border-border bg-bg/50 p-2">
      <div className="flex items-center justify-between">
        <span className="label">
          {def ? def.name.toLowerCase() : `slot ${idx + 1}`}
        </span>
        <span
          className={`readout-dim text-[11px] tabular-nums ${slot.ready ? "text-emerald" : ""}`}
        >
          {status}
        </span>
      </div>
      {def && def.growTime > 0 && (
        <div className={`bar ${slot.ready ? "bar-emerald" : ""}`}>
          <div
            className="bar-fill"
            style={{ width: `${slot.progress * 100}%` }}
          />
        </div>
      )}
      {def && def.growTime === 0 && (
        <div className="bar bar-amber">
          <div className="bar-fill" style={{ width: "100%" }} />
        </div>
      )}
      {!def && (
        <div className="bar">
          <div className="bar-fill" style={{ width: "0%" }} />
        </div>
      )}

      <div className="flex gap-1">
        {!slot.crop && (
          <button
            className="btn flex-1 text-[10px]"
            onClick={() =>
              dispatch({ type: "plantCrop", slotIdx: idx, crop: selected })
            }
            disabled={waterAvail < selDef.plantCost}
          >
            Plant {selDef.name} ({selDef.plantCost}w)
          </button>
        )}
        {slot.crop && def && def.growTime > 0 && (
          <button
            className="btn btn-emerald flex-1 text-[10px]"
            onClick={() => dispatch({ type: "harvestCrop", slotIdx: idx })}
            disabled={!slot.ready}
          >
            Harvest
          </button>
        )}
        {slot.crop && (
          <button
            className="btn text-[10px]"
            onClick={() => dispatch({ type: "uprootCrop", slotIdx: idx })}
            title="Uproot — clears the slot"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function cropDescription(def: import("./game").CropDef): string {
  const parts: string[] = [`plant: ${def.plantCost}w`];
  if (def.growTime > 0) parts.push(`grow: ${def.growTime}s`);
  if (def.passiveWater) parts.push(`+${def.passiveWater} u/s passive`);
  if (def.passiveSalt) parts.push(`+${def.passiveSalt} salt/s passive`);
  if (def.harvestFaucetRate)
    parts.push(`harvest: +${def.harvestFaucetRate} u/s`);
  if (def.harvestSeeds) parts.push(`+${def.harvestSeeds} seeds`);
  return parts.join(" · ");
}
