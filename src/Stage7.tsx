import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  CLOUD_FAUCET_BONUS,
  cloudBonus,
  effectiveFaucet,
  fmt,
  lightningPerSec,
  maxSpinSpeed,
  spinGain,
  VAPOR_PER_CLOUD,
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

export function Stage7({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage VII — Atmosphere">
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

        <SkyPanel state={state} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Vapor" value={fmt(state.vapor, 1)} tone="steel" />
            <Stat label="Clouds" value={fmt(state.clouds, 0)} tone="amber" />
            <Stat label="Lightning ⚡" value={fmt(state.lightning, 1)} tone="amber" />
            <Stat
              label="⚡ / sec"
              value={fmt(lightningPerSec(state), 3)}
              tone="dim"
            />
            <Stat
              label="Cloud bonus"
              value={`+${fmt(cloudBonus(state), 2)} u/s`}
              tone="steel"
            />
            <Stat
              label="Seeders"
              value={state.cloudSeeders.toString()}
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
          groups={["atmosphere"]}
          title="Atmosphere"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["aquifer"]}
          title="Drilling"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["industry"]}
          title="Industry"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["aqueduct"]}
          title="Infrastructure"
        />
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["greenhouse", "bamboo", "settlement"]}
          title="Cultivation & Settlement"
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

function SkyPanel({ state }: { state: State }) {
  const vaporPct = (state.vapor / VAPOR_PER_CLOUD) * 100;
  return (
    <Panel title="Sky">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="label">vapor (next cloud)</span>
            <span className="readout-steel text-sm tabular-nums">
              {fmt(state.vapor, 1)} / {VAPOR_PER_CLOUD}
            </span>
          </div>
          <div className="bar mt-1">
            <div className="bar-fill" style={{ width: `${vaporPct}%` }} />
          </div>
        </div>
        {/* Animated cloud row */}
        <div
          className="relative h-20 overflow-hidden rounded-sm border border-border"
          style={{
            background:
              "linear-gradient(180deg, #1a2a3a 0%, #243a4d 70%, #2a4566 100%)",
          }}
        >
          {Array.from({ length: Math.min(state.clouds, 24) }, (_, i) => (
            <span
              key={i}
              className="absolute font-mono text-2xl"
              style={{
                left: `${(i * 41) % 95}%`,
                top: `${(i * 13) % 60}%`,
                color: "rgba(255,255,255,0.75)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              ☁
            </span>
          ))}
          {state.clouds > 24 && (
            <span className="absolute right-2 bottom-1 font-stencil text-[10px] tracking-widest text-white/70 uppercase">
              +{state.clouds - 24} more
            </span>
          )}
          {state.clouds === 0 && (
            <span className="absolute inset-0 flex items-center justify-center text-text-dim text-xs italic">
              clear sky — build cloud seeders to bring rain
            </span>
          )}
        </div>
        <div className="text-xs text-text-dim">
          Each cloud adds +{fmt(CLOUD_FAUCET_BONUS, 2)} u/s to your base water rate.
        </div>
      </div>
    </Panel>
  );
}
