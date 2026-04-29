import { useEffect, useReducer, useRef, useState } from "react";
import {
  effectiveFaucet,
  fmt,
  initialState,
  reducer,
  type Action,
  type Stage,
  type State,
} from "./game";
import { Stage0 } from "./Stage0";
import { Stage1 } from "./Stage1";
import { Stage2 } from "./Stage2";
import { Stage3 } from "./Stage3";
import { Stage4 } from "./Stage4";
import { Stage5 } from "./Stage5";
import { Stage6 } from "./Stage6";
import { Stage7 } from "./Stage7";
import { Stage8 } from "./Stage8";
import "./App.css";

const SAVE_KEY = "faucet-incremental-save-v1";
const AUTOSAVE_MS = 60_000;

function loadSaved(): State | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    // Loose-typed parsed shape so we can migrate legacy fields.
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Migrate v0 (single bamboo plot) → v1 (plots array)
    if (
      !Array.isArray(parsed.plots) &&
      ("bambooPlanted" in parsed ||
        "bambooProgress" in parsed ||
        "bambooReady" in parsed)
    ) {
      parsed.plots = [
        {
          planted: !!parsed.bambooPlanted,
          progress:
            typeof parsed.bambooProgress === "number" ? parsed.bambooProgress : 0,
          ready: !!parsed.bambooReady,
        },
      ];
      delete parsed.bambooPlanted;
      delete parsed.bambooProgress;
      delete parsed.bambooReady;
    }
    // Drop null/undefined fields so they can't override initialState defaults.
    for (const k of Object.keys(parsed)) {
      if (parsed[k] === null || parsed[k] === undefined) delete parsed[k];
    }
    return { ...initialState, ...(parsed as Partial<State>) };
  } catch {
    return null;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    return loadSaved() ?? initialState;
  });
  const [viewedStage, setViewedStage] = useState<Stage>(state.stage);

  // Auto-advance the view when a new stage unlocks. Players can still
  // navigate back via the tab bar to manage prior-stage infrastructure.
  useEffect(() => {
    setViewedStage(state.stage);
  }, [state.stage]);

  // eslint-disable-next-line react-hooks/purity
  const lastRef = useRef<number>(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - lastRef.current) / 1000);
      lastRef.current = now;
      dispatch({ type: "tick", dt });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(save, AUTOSAVE_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const totalRate = effectiveFaucet(state);

  return (
    <div className="mx-auto flex min-h-svh max-w-[1280px] flex-col gap-4 px-4 pt-4 pb-8">
      <header className="panel rounded-sm p-4">
        <span className="rivet-bl" />
        <span className="rivet-br" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-stencil text-xs tracking-[0.3em] text-text-dim uppercase">
              FCT-{["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"][state.stage]} ▌ unit serial 001
            </div>
            <h1 className="font-stencil text-text-h text-3xl tracking-[0.2em] uppercase md:text-4xl">
              FAUCET <span className="text-amber">▶</span> incremental
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <Readout label="Water" value={fmt(state.water, 1)} unit="u" />
            <Readout label="Capacity" value={state.capacity.toString()} unit="u" tone="dim" />
            <Readout label="Rate" value={fmt(totalRate, 2)} unit="u/s" tone="steel" />
            <button
              className="btn text-xs"
              onClick={() => {
                if (confirm("Reset all progress?")) {
                  localStorage.removeItem(SAVE_KEY);
                  dispatch({ type: "reset" });
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="strip mt-3" />
      </header>

      {state.stage >= 1 && (
        <StageTabs
          current={viewedStage}
          max={state.stage}
          onSelect={setViewedStage}
        />
      )}

      <StageRouter stage={viewedStage} state={state} dispatch={dispatch} />

      <footer className="panel rounded-sm p-3 text-center">
        <span className="rivet-bl" />
        <span className="rivet-br" />
        <span className="font-stencil text-[11px] tracking-[0.3em] text-text-dim uppercase">
          // OP. MAN. v0.1 — auth: marc e. bassy &amp; song //
        </span>
      </footer>
    </div>
  );
}

function StageRouter({
  stage,
  state,
  dispatch,
}: {
  stage: Stage;
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  switch (stage) {
    case 0:
      return <Stage0 state={state} dispatch={dispatch} />;
    case 1:
      return <Stage1 state={state} dispatch={dispatch} />;
    case 2:
      return <Stage2 state={state} dispatch={dispatch} />;
    case 3:
      return <Stage3 state={state} dispatch={dispatch} />;
    case 4:
      return <Stage4 state={state} dispatch={dispatch} />;
    case 5:
      return <Stage5 state={state} dispatch={dispatch} />;
    case 6:
      return <Stage6 state={state} dispatch={dispatch} />;
    case 7:
      return <Stage7 state={state} dispatch={dispatch} />;
    case 8:
      return <Stage8 state={state} dispatch={dispatch} />;
    default:
      return <Stage8 state={state} dispatch={dispatch} />;
  }
}

const STAGE_LABELS: Record<Stage, { roman: string; name: string }> = {
  0: { roman: "0", name: "Faucet" },
  1: { roman: "I", name: "Seedstock" },
  2: { roman: "II", name: "Greenhouse" },
  3: { roman: "III", name: "Aqueducts" },
  4: { roman: "IV", name: "Settlement" },
  5: { roman: "V", name: "Industry" },
  6: { roman: "VI", name: "Aquifer" },
  7: { roman: "VII", name: "Atmosphere" },
  8: { roman: "VIII", name: "Hydrosphere" },
};

function StageTabs({
  current,
  max,
  onSelect,
}: {
  current: Stage;
  max: Stage;
  onSelect: (s: Stage) => void;
}) {
  const stages: Stage[] = Array.from(
    { length: max + 1 },
    (_, i) => i as Stage,
  );
  return (
    <nav className="panel relative flex flex-wrap items-center gap-1.5 rounded-sm p-2">
      <span className="rivet-bl" />
      <span className="rivet-br" />
      {stages.map((s) => {
        const active = s === current;
        const label = STAGE_LABELS[s];
        return (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={`btn font-stencil text-[10px] tracking-[0.25em] uppercase ${active ? "btn-amber" : ""}`}
            title={`Stage ${label.roman} — ${label.name}`}
          >
            <span>FCT-{label.roman}</span>
            <span className="ml-1.5 text-text-dim">{label.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Readout({
  label,
  value,
  unit,
  tone = "amber",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "amber" | "steel" | "dim";
}) {
  const cls =
    tone === "steel" ? "readout-steel" : tone === "dim" ? "readout-dim" : "readout";
  return (
    <div className="flex flex-col items-end">
      <span className="label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`${cls} text-xl tabular-nums md:text-2xl`}>{value}</span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export default App;
