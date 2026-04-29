import { useEffect, useRef, useState } from "react";
import type { Action, State, Upgrade } from "./game";
import {
  SPIN_CLICK_BOOST,
  SPIN_DECAY,
  VAPOR_PER_CLOUD,
  cycleMultiplier,
  fmt,
  foodCap,
  maxPressure,
  popCap,
  upgrades,
} from "./game";

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel rounded-sm p-4 ${className}`}>
      <span className="rivet-bl" />
      <span className="rivet-br" />
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span className="label">{title}</span>
          <span className="strip flex-1" />
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
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
    <div className="flex flex-col gap-0.5">
      <span className="label">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className={`${cls} text-2xl tabular-nums`}>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-dim">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

export function Wheel({
  baselineSpeed,
  maxSpeed,
  onRevolution,
  spinValue,
  rate,
}: {
  baselineSpeed: number; // deg/sec floor, from auto-spinner
  maxSpeed: number; // deg/sec ceiling, from wheel bearings
  onRevolution: () => void; // fires once per full rotation
  spinValue: number;
  rate: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const speedRef = useRef(baselineSpeed);
  const angleRef = useRef(0);
  const revAccumRef = useRef(0);
  const baselineRef = useRef(baselineSpeed);
  const maxRef = useRef(maxSpeed);
  const onRevRef = useRef(onRevolution);
  const spinValueRef = useRef(spinValue);

  type Float = { id: number; value: number; offset: number };
  const [floats, setFloats] = useState<Float[]>([]);
  const floatIdRef = useRef(0);

  // keep refs current without re-binding the rAF loop
  useEffect(() => {
    baselineRef.current = baselineSpeed;
    if (speedRef.current < baselineSpeed) speedRef.current = baselineSpeed;
  }, [baselineSpeed]);
  useEffect(() => {
    maxRef.current = maxSpeed;
  }, [maxSpeed]);
  useEffect(() => {
    onRevRef.current = onRevolution;
  }, [onRevolution]);
  useEffect(() => {
    spinValueRef.current = spinValue;
  }, [spinValue]);

  // Independent visual loop — rotates SVG via DOM, decoupled from React state.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // decay speed but never below baseline
      speedRef.current = Math.max(
        baselineRef.current,
        speedRef.current - SPIN_DECAY * dt,
      );
      const delta = speedRef.current * dt;
      angleRef.current = (angleRef.current + delta) % 360;
      revAccumRef.current += delta;
      while (revAccumRef.current >= 360) {
        revAccumRef.current -= 360;
        onRevRef.current();
        const id = ++floatIdRef.current;
        const offset = (Math.random() - 0.5) * 30; // px sideways jitter
        const value = spinValueRef.current;
        setFloats((arr) => [...arr, { id, value, offset }]);
        setTimeout(() => {
          setFloats((arr) => arr.filter((x) => x.id !== id));
        }, 1000);
      }
      const el = svgRef.current;
      if (el) el.style.transform = `rotate(${angleRef.current}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = () => {
    speedRef.current = Math.min(
      maxRef.current,
      speedRef.current + SPIN_CLICK_BOOST,
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button onClick={handleClick} className="wheel-btn h-44 w-44" aria-label="Spin">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="h-full w-full"
          style={{ willChange: "transform" }}
        >
          <defs>
            <radialGradient id="wheelGrad" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#d8643a" />
              <stop offset="60%" stopColor="#a83e1e" />
              <stop offset="100%" stopColor="#5b1f0a" />
            </radialGradient>
            <radialGradient id="hubGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#5b6371" />
              <stop offset="100%" stopColor="#1a1d22" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="#14171c" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="url(#wheelGrad)"
            stroke="#7e3414"
            strokeWidth="2"
          />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <rect x="46" y="6" width="8" height="40" rx="2" fill="#7e3414" />
              <rect x="47.5" y="7" width="5" height="38" rx="1.5" fill="#c25a2a" />
              <circle cx="50" cy="10" r="1.4" fill="#14171c" />
              <circle cx="50" cy="42" r="1.4" fill="#14171c" />
            </g>
          ))}
          <circle cx="50" cy="50" r="14" fill="url(#hubGrad)" stroke="#000" strokeWidth="1" />
          <circle cx="50" cy="50" r="3" fill="#0a0c10" />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2 font-stencil text-[11px] uppercase tracking-[0.3em] text-amber [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
          spin
        </span>
        {floats.map((f) => (
          <span
            key={f.id}
            className="float-out"
            style={{ marginLeft: `${f.offset}px` }}
          >
            +{fmt(f.value, 2)}
          </span>
        ))}
      </button>
      <div className="flex flex-col items-center text-center">
        <span className="label">per revolution</span>
        <span className="readout-dim text-sm tabular-nums">
          +{fmt(spinValue, 2)} water
        </span>
        <span className="label mt-1">passive</span>
        <span className="readout-steel text-sm tabular-nums">
          +{fmt(rate, 2)} u/s
        </span>
      </div>
    </div>
  );
}

export function Tank({ water, capacity }: { water: number; capacity: number }) {
  const pct = capacity > 0 ? (water / capacity) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="label">reservoir</span>
        <span className="readout text-sm tabular-nums">
          {fmt(water, 1)} / {capacity}
        </span>
      </div>
      <div className="tank-gauge">
        <div className="water" style={{ height: `${pct}%` }} />
        <div className="ticks" />
      </div>
    </div>
  );
}

export function UpgradeRow({
  upgrade,
  state,
  dispatch,
}: {
  upgrade: Upgrade;
  state: State;
  dispatch: React.Dispatch<Action>;
}) {
  const cost = upgrade.cost(state);
  const lvl = upgrade.level?.(state);
  const isDone = upgrade.done?.(state) ?? false;
  const canBuy = upgrade.available(state) && !isDone;

  const costParts: string[] = [];
  if (cost.water !== undefined) costParts.push(`${fmt(cost.water, 1)} water`);
  if (cost.salt !== undefined) costParts.push(`${cost.salt} salt`);
  if (cost.seeds !== undefined) costParts.push(`${cost.seeds} seeds`);
  if (cost.labor !== undefined) costParts.push(`${fmt(cost.labor, 0)} labor`);
  if (cost.steam !== undefined) costParts.push(`${fmt(cost.steam, 1)} steam`);
  if (cost.coal !== undefined) costParts.push(`${fmt(cost.coal, 1)} coal`);
  if (cost.minerals !== undefined) costParts.push(`${fmt(cost.minerals, 0)} minerals`);
  if (cost.lightning !== undefined) costParts.push(`${fmt(cost.lightning, 0)} ⚡`);
  if (cost.research !== undefined) costParts.push(`◇${fmt(cost.research, 0)}`);

  const btnTone =
    upgrade.group === "milestone"
      ? "btn-emerald"
      : upgrade.group === "manual"
        ? "btn-rust"
        : upgrade.group === "bamboo"
          ? "btn-emerald"
          : upgrade.group === "research"
            ? "btn-rust"
            : "btn-amber";

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-dashed border-border/60 py-2 last:border-b-0 ${isDone ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-text-h font-medium">{upgrade.name}</span>
          {lvl !== undefined && lvl > 0 && (
            <span className="readout-dim text-xs tabular-nums">Lv {lvl}</span>
          )}
          {isDone && (
            <span className="text-emerald font-stencil text-[10px] tracking-widest uppercase">
              installed
            </span>
          )}
        </div>
        <div className="text-xs text-text-dim">{upgrade.desc(state)}</div>
      </div>
      {!isDone && (
        <button
          className={`btn ${canBuy ? btnTone : ""} min-w-[140px] text-xs whitespace-nowrap`}
          onClick={() => dispatch({ type: "buy", id: upgrade.id })}
          disabled={!canBuy}
        >
          {costParts.length > 0 ? costParts.join(" · ") : "Activate"}
        </button>
      )}
    </div>
  );
}

export function LogFeed({ state }: { state: State }) {
  if (state.logs.length === 0) {
    return (
      <Panel title="Event Log">
        <div className="text-text-dim text-xs italic">no activity</div>
      </Panel>
    );
  }
  return (
    <Panel title="Event Log">
      <div className="flex flex-col">
        {state.logs.map((entry, i) => (
          <div key={`${entry.ts}-${i}`} className="log-line">
            <span className="log-tag">[{i === 0 ? "▶" : "·"}]</span>{" "}
            <span>{entry.msg}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

type Tone = "amber" | "steel" | "dim" | "emerald" | "warn" | "bad";

function ResourceChip({
  label,
  value,
  tone = "amber",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  const toneCls =
    tone === "steel"
      ? "text-text-h"
      : tone === "dim"
        ? "text-text-dim"
        : tone === "emerald"
          ? "text-emerald"
          : tone === "warn"
            ? "text-warn"
            : tone === "bad"
              ? "text-bad"
              : "text-amber";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-stencil text-[10px] tracking-[0.2em] text-text-dim uppercase">
        {label}
      </span>
      <span className={`font-mono text-sm tabular-nums ${toneCls}`}>
        {value}
      </span>
    </div>
  );
}

export function ResourceBar({ state }: { state: State }) {
  const items: { label: string; value: string; tone?: Tone }[] = [];
  // Salt is collected from Stage 0 as a faucet by-product.
  items.push({ label: "salt", value: fmt(state.salt, 1), tone: "dim" });
  if (state.stage >= 1) {
    items.push({ label: "seeds", value: state.seeds.toString() });
    items.push({
      label: "research",
      value: `◇${fmt(state.researchPoints, 1)}`,
    });
  }
  if (state.stage >= 2) {
    items.push({
      label: "heat",
      value: fmt(state.heat, 1),
      tone: state.heat >= 75 ? "warn" : "dim",
    });
  }
  if (state.stage >= 3) {
    items.push({
      label: "pressure",
      value: `${fmt(state.pressure, 0)} / ${maxPressure(state)}`,
      tone: "dim",
    });
  }
  if (state.stage >= 4) {
    items.push({
      label: "pop",
      value: `${fmt(state.population, 1)} / ${popCap(state)}`,
    });
    items.push({
      label: "food",
      value: `${fmt(state.food, 1)} / ${foodCap(state)}`,
      tone: "emerald",
    });
    items.push({ label: "labor", value: fmt(state.labor, 0) });
  }
  if (state.stage >= 5) {
    items.push({ label: "steam", value: fmt(state.steam, 1) });
    items.push({ label: "coal", value: fmt(state.coal, 1), tone: "dim" });
    items.push({
      label: "pollution",
      value: `${fmt(state.pollution, 0)} / 100`,
      tone: state.pollution >= 60 ? "warn" : "dim",
    });
  }
  if (state.stage >= 6) {
    items.push({ label: "minerals", value: fmt(state.minerals, 0) });
    items.push({
      label: "depth",
      value: `${fmt(state.depth, 0)} m`,
      tone: "dim",
    });
  }
  if (state.stage >= 7) {
    items.push({
      label: "vapor",
      value: `${fmt(state.vapor, 1)} / ${VAPOR_PER_CLOUD}`,
      tone: "steel",
    });
    items.push({ label: "clouds", value: fmt(state.clouds, 0) });
    items.push({ label: "⚡", value: fmt(state.lightning, 1) });
  }
  if (state.stage >= 8) {
    items.push({
      label: "hydroentropy",
      value: fmt(state.hydroentropy, 0),
    });
    items.push({
      label: "cycle",
      value: `×${fmt(cycleMultiplier(state), 2)}`,
    });
  }

  return (
    <nav className="panel relative flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-sm px-3 py-2">
      <span className="rivet-bl" />
      <span className="rivet-br" />
      {items.map((it) => (
        <ResourceChip key={it.label} {...it} />
      ))}
    </nav>
  );
}

export function UpgradeList({
  state,
  dispatch,
  groups,
  title,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  groups: Upgrade["group"][];
  title: string;
}) {
  const visible = upgrades.filter(
    (u) => groups.includes(u.group) && u.visible(state),
  );
  if (visible.length === 0) return null;
  return (
    <Panel title={title}>
      <div className="flex flex-col">
        {visible.map((u) => (
          <UpgradeRow key={u.id} upgrade={u} state={state} dispatch={dispatch} />
        ))}
      </div>
    </Panel>
  );
}
