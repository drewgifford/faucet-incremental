import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  BOILER_COAL_PER_SEC,
  BOILER_STEAM_OUT_PER_SEC,
  BOILER_WATER_PER_SEC,
  COAL_TRADE_WATER,
  effectiveFaucet,
  fmt,
  maxSpinSpeed,
  POLLUTION_MAX,
  pollutionPenalty,
  spinGain,
  turbineMultiplier,
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

export function Stage5({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage V — Industry">
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

        <IndustryPanel state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Steam" value={fmt(state.steam, 1)} tone="amber" />
            <Stat label="Coal" value={fmt(state.coal, 1)} tone="dim" />
            <Stat label="Boilers" value={state.boilers.toString()} />
            <Stat
              label="Turbines (×)"
              value={`×${fmt(turbineMultiplier(state), 2)}`}
              tone="steel"
            />
            <Stat label="Population" value={fmt(state.population, 0)} tone="dim" />
            <Stat label="Labor" value={fmt(state.labor, 0)} tone="amber" />
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
          groups={["industry"]}
          title="Industry"
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

function IndustryPanel({ state, dispatch }: Props) {
  const pollutionPct = (state.pollution / POLLUTION_MAX) * 100;
  const polPenalty = (1 - pollutionPenalty(state)) * 100;
  const cleanRunning = state.electrolysisBought;
  return (
    <Panel title="Industry">
      <div className="flex flex-col gap-3">
        <PollutionGauge pct={pollutionPct} clean={cleanRunning} />
        {state.boilers > 0 && (
          <div className="text-xs text-text-dim">
            <div>
              Boilers running ×{state.boilers}: −
              {fmt(state.boilers * BOILER_WATER_PER_SEC, 2)} water/s
              {!cleanRunning &&
                ` · −${fmt(state.boilers * BOILER_COAL_PER_SEC, 3)} coal/s`}
              {" · +"}
              {fmt(state.boilers * BOILER_STEAM_OUT_PER_SEC, 2)} steam/s
            </div>
            {!cleanRunning && state.pollution > 5 && (
              <div className="text-warn">
                pollution penalty: −{fmt(polPenalty, 1)}% rate
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">coal market:</span>
          {[1, 5, 25].map((n) => (
            <button
              key={n}
              className="btn btn-rust text-[11px]"
              disabled={state.water < n * COAL_TRADE_WATER}
              onClick={() => dispatch({ type: "buyCoal", amount: n })}
              title={`${n * COAL_TRADE_WATER} water → ${n} coal`}
            >
              +{n} coal ({n * COAL_TRADE_WATER}w)
            </button>
          ))}
        </div>
        {state.electrolysisBought && (
          <div className="text-emerald font-stencil text-[10px] tracking-widest uppercase">
            ◆ electrolysis online — clean steam
          </div>
        )}
      </div>
    </Panel>
  );
}

function PollutionGauge({ pct, clean }: { pct: number; clean: boolean }) {
  const danger = pct >= 60;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label">pollution</span>
        <span
          className={`readout text-sm tabular-nums ${danger ? "text-warn" : ""}`}
        >
          {fmt(pct, 0)}%
        </span>
      </div>
      <div className="bar">
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: danger
              ? "linear-gradient(180deg, var(--color-bad), #6a1c1c)"
              : "linear-gradient(180deg, var(--color-rust), var(--color-rust-2))",
          }}
        />
      </div>
      {clean && (
        <span className="text-emerald font-stencil text-[10px] tracking-widest uppercase">
          ◆ clean operations — no further pollution
        </span>
      )}
    </div>
  );
}
