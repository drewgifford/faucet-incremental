# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun** (see `bun.lock`).

- `bun run dev` — Vite dev server with HMR
- `bun run build` — `tsc -b` (project references) then `vite build`
- `bun run lint` — ESLint over the repo (flat config in `eslint.config.js`)
- `bun run preview` — preview the production build

There is no test runner configured.

## Architecture

This is a single-page incremental/idle game built with React 19 + TypeScript + Vite + Tailwind v4. Almost all gameplay logic lives in two files; the rest is presentation.

### State model — `src/game.ts`

The single source of truth. One flat `State` object holds every resource, level, flag, and stage-specific structure for all 9 stages (0–8). One `Action` union covers every player intent. One `reducer(state, action)` handles all transitions. There are no contexts, slices, or stores — `App.tsx` calls `useReducer(reducer, ...)` and threads `state` + `dispatch` to every Stage component.

Key conventions in `game.ts`:

- **Tick loop.** `App.tsx` runs a `requestAnimationFrame` loop dispatching `{ type: "tick", dt }` (clamped to ≤ 0.25s). The `tick` case in `reducer` advances *every* stage's simulation each frame regardless of `state.stage`, gated by `if (s.stage >= N)` blocks. Order matters: stage 1 plots → stage 2 greenhouse heat/passive crops → stage 3 aqueduct decay & pressure → stage 4 pop/food → stage 5 boilers/pollution → stage 7 atmosphere → stage 8 hydroentropy. Resources consumed by later stages (e.g. boilers drain `water`) read the running totals, not `s.*`.
- **`effectiveFaucet(s)`** is the canonical "current water/sec" function and composes every multiplier (faucet bore × multiplier upgrade × aqueduct integrity × turbines × geothermal × pollution penalty × cycle multiplier, plus aquifer + cloud additive bonuses). When adding a new bonus to passive water rate, plug it into this function — the tick uses it to generate water, and Stage 8 uses it to accrue hydroentropy.
- **Upgrade tree.** `upgrades: Upgrade[]` is one big declarative list. Each entry has `cost(s)`, `effect(s) → Partial<State>`, `visible(s)`, `available(s)`, optional `done(s)` for one-shots, optional `level(s)` for repeatable, and a `group` tag. The `"buy"` action handler is generic: it looks up the upgrade by id, deducts every resource cost, spreads `u.effect(s)` into the new state, and logs. To add an upgrade, append to this list — never special-case in the reducer.
- **Stage milestones** are upgrades in the `"milestone"` group. Their `effect` sets `stage: N as Stage` and the matching `stageNUnlocked: true` flag. Their `visible`/`available` predicates are how stage gating is expressed.
- **Save migration.** `App.tsx`'s `loadSaved()` merges the saved blob into `initialState` (so new fields appear with defaults) and contains an inline v0→v1 migration for the legacy single-bamboo-plot shape. When you add a new stage's state fields, no migration is needed — `{...initialState, ...parsed}` covers it. When you *rename or restructure* an existing field, add a migration block here.
- **Constants** — every tunable (rates, thresholds, costs, decay constants) is an `export const` near the top of `game.ts`, grouped by stage. Edit there rather than inlining magic numbers in the reducer.

### UI layer

- `App.tsx` — owns the reducer, the rAF tick loop, the localStorage autosave (`SAVE_KEY = "faucet-incremental-save-v1"`, every 2s), the global header readouts, and a `StageRouter` switch that renders one of `Stage0`–`Stage8` based on `state.stage`.
- `src/Stage{0..8}.tsx` — one component per stage. Each consumes `{ state, dispatch }`, composes `Panel`/`Stat`/`Tank`/`Wheel`/`UpgradeList`/`LogFeed` from `components.tsx`, and picks which upgrade `groups` to surface via `<UpgradeList groups={[...]} />`. Stages share visual elements heavily — when changing the wheel or tank, edit `components.tsx` once.
- `components.tsx` — shared presentational primitives. Notable: `Wheel` runs its *own* rAF loop and mutates `transform` directly on the SVG ref (decoupled from React state) so the spinning visuals don't trigger re-renders; it fires `onRevolution` once per full rotation, which `Stage*` map to `dispatch({ type: "spin" })`. `UpgradeRow` reads cost/effect/visibility off the `Upgrade` object and dispatches `{ type: "buy", id }`.
- `src/index.css` — Tailwind v4 (`@import "tailwindcss"`) with a custom `@theme` palette (industrial amber/rust/steel) and hand-written component classes (`.panel`, `.btn`, `.readout`, `.bar`, `.tank-gauge`, rivets, etc.). The aesthetic is intentional; don't replace these with stock Tailwind utilities.

### Adding a new feature

- **New repeatable upgrade**: add a constant `XYZ_COST(level)` and a state field `xyzLevel`, then append one entry to `upgrades` with `level: (s) => s.xyzLevel`. Add the field to `initialState`.
- **New one-shot upgrade**: add `xyzBought: boolean` to `State`/`initialState`, append an entry with `done: (s) => s.xyzBought` and effect setting it true.
- **New resource**: add to `State`/`initialState`, add the cost key to `Upgrade["cost"]`'s return type, add the deduction line in the `"buy"` case, add the parsing line in `UpgradeRow`'s `costParts`.
- **New per-tick simulation**: add a block inside `case "tick"` gated by `if (s.stage >= N)`, mutating the local running totals before the final return.
