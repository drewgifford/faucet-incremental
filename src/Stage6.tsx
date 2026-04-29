import type { Action, State } from "./game";
import {
  AQUIFER_DEPTH,
  aquiferBonus,
  autoSpinBaselineDegPerSec,
  caveInProbPerSec,
  drillSpeed,
  effectiveFaucet,
  fmt,
  geothermalMultiplier,
  layerName,
  MAGMA_DEPTH,
  maxSpinSpeed,
  SALT_PER_MINERAL,
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

export function Stage6({ state, dispatch }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage VI — Aquifer">
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

        <BoreholePanel state={state} dispatch={dispatch} />

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Depth"
              value={`${fmt(state.depth, 0)} m`}
              tone="amber"
            />
            <Stat label="Layer" value={layerName(state.depth)} tone="dim" />
            <Stat
              label="Minerals"
              value={fmt(state.minerals, 0)}
              tone="amber"
            />
            <Stat label="Salt" value={fmt(state.salt, 0)} tone="dim" />
            <Stat
              label="Aquifer Bonus"
              value={`+${fmt(aquiferBonus(state), 2)} u/s`}
              tone="steel"
            />
            <Stat
              label="Geothermal"
              value={state.geothermalTapBought ? "ACTIVE" : "—"}
              tone={state.geothermalTapBought ? "amber" : "dim"}
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
          groups={["aquifer"]}
          title="Drilling"
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

const LAYERS = [
  { name: "Topsoil", from: 0, to: 50, bg: "#3a2615" },
  { name: "Bedrock", from: 50, to: AQUIFER_DEPTH, bg: "#3a3a40" },
  { name: "Aquifer", from: AQUIFER_DEPTH, to: MAGMA_DEPTH, bg: "#1c4f6f" },
  { name: "Magma", from: MAGMA_DEPTH, to: 1500, bg: "#7e3414" },
  { name: "Mantle", from: 1500, to: 2500, bg: "#4a1d3a" },
];

function BoreholePanel({ state, dispatch }: Props) {
  const cavePct = caveInProbPerSec(state) * 100;
  const totalDepth = LAYERS[LAYERS.length - 1].to;
  const drillPct = Math.min(100, (state.depth / totalDepth) * 100);
  return (
    <Panel title="Borehole">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            className={`btn ${state.drilling ? "btn-rust" : "btn-amber"} text-xs`}
            onClick={() => dispatch({ type: "toggleDrill" })}
          >
            {state.drilling ? "Halt Drill" : "Resume Drill"}
          </button>
          <div className="flex-1 text-right">
            <span className="readout text-sm tabular-nums">
              {fmt(state.depth, 1)} m · {fmt(drillSpeed(state), 1)} m/s
            </span>
          </div>
        </div>

        {/* Cross-section column */}
        <div
          className="relative h-44 w-full overflow-hidden rounded-sm border border-border"
          style={{ background: "#0a0c10" }}
        >
          {LAYERS.map((layer) => {
            const top = (layer.from / totalDepth) * 100;
            const height = ((layer.to - layer.from) / totalDepth) * 100;
            return (
              <div
                key={layer.name}
                className="absolute inset-x-0 flex items-start justify-between border-t border-black/40 px-2 pt-0.5"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  background: layer.bg,
                  opacity: state.depth >= layer.from ? 0.85 : 0.35,
                }}
              >
                <span className="font-stencil text-[9px] tracking-widest text-white/70 uppercase">
                  {layer.name}
                </span>
                <span className="font-mono text-[9px] text-white/60">
                  {layer.from}m
                </span>
              </div>
            );
          })}
          {/* Drill marker */}
          <div
            className="absolute inset-x-0 flex items-center justify-center"
            style={{
              top: `${drillPct}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="h-0.5 w-full bg-amber/80 shadow-[0_0_8px_rgba(245,184,0,0.6)]" />
            <span className="absolute font-stencil text-[10px] tracking-widest text-amber [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
              ▼
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>cave-in risk: {fmt(cavePct, 3)}% / sec</span>
          <span>geothermal: ×{fmt(geothermalMultiplier(state), 2)}</span>
        </div>

        {/* Salt → minerals refinery */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <span className="label">refinery:</span>
          {[10, 50, 200].map((n) => (
            <button
              key={n}
              className="btn text-[11px]"
              disabled={state.salt < n}
              onClick={() => dispatch({ type: "convertSalt", salt: n })}
              title={`${n} salt → ${n / SALT_PER_MINERAL} minerals`}
            >
              +{n / SALT_PER_MINERAL} min ({n} salt)
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}
