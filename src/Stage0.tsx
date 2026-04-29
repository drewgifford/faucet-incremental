import type { Action, State } from "./game";
import {
  autoSpinBaselineDegPerSec,
  autoSpinRate,
  effectiveFaucet,
  fmt,
  maxSpinSpeed,
  spinGain,
  STAGE1_CAP_THRESHOLD,
} from "./game";
import { LogFeed, Panel, Stat, Tank, UpgradeList, Wheel } from "./components";

type Props = { state: State; dispatch: React.Dispatch<Action> };

export function Stage0({ state, dispatch }: Props) {
  const remainingForStage1 = Math.max(
    0,
    STAGE1_CAP_THRESHOLD - state.capacity,
  );

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-4">
        <Panel title="Stage 0 — Manual Operation">
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

        <Panel title="Telemetry">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Spins" value={state.totalSpins.toLocaleString()} />
            <Stat label="Total Water" value={fmt(state.totalWater, 1)} />
            <Stat label="Salt" value={fmt(state.salt, 2)} tone="dim" />
            <Stat
              label="Auto-Spinner"
              value={
                state.autoSpinnerLevel === 0
                  ? "OFFLINE"
                  : `${fmt(autoSpinRate(state), 1)}/s`
              }
              tone={state.autoSpinnerLevel === 0 ? "dim" : "amber"}
            />
          </div>
          {remainingForStage1 > 0 && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <span className="label">to stage I</span>
              <span className="readout-dim flex-1 text-right text-sm tabular-nums">
                +{remainingForStage1} cap required
              </span>
            </div>
          )}
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <UpgradeList
          state={state}
          dispatch={dispatch}
          groups={["storage", "manual", "automation"]}
          title="Workshop"
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
