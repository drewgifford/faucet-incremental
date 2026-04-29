# Faucet Incremental — Balance Re-evaluation

## Problem statement

Stages 0–5 currently complete in well under an hour. The user reports being at 5800 water/s on Stage 5, where each boiler consumes only 0.5 water/s — a 0.009% rate tax. Water consumers throughout late game are similarly trivial. The progression curve snowballs after the first few aqueducts and never recovers.

## Diagnosis — three runaway loops

1. **Multiplicative aqueduct stacking.** `aqueductMultiplier(s) = ∏(1 + 0.10·integrity)` over every aqueduct. 30 aqueducts at full integrity = ×17.4. 50 = ×117. The cost grows ×1.55 per aqueduct (water cost 150·1.55ⁿ), but the *bonus* compounds geometrically, so the value/cost ratio exploads.

2. **Permanent-bonus harvest crops.** Every harvested bamboo/saguaro/mangrove adds permanently to `s.faucetRate`. With auto-harvester engaged plus growth/yield upgrades, faucetRate accumulates indefinitely. Combined with #1's compounding, late-game water is dominated by historical harvests.

3. **Static water consumer rates.** Boilers, cloud seeders, and pop demand are fixed flat numbers picked for early-game scale (0.5 w/s, 0.3 w/s, 0.04 w/s/pop). Once production exceeds ~50 w/s these never bite.

The combination produces stages 5–8 finishing in seconds because the milestone water/steam thresholds (5,000 / 80 / 200) are dwarfed by current production, and there is no resource sink to slow accumulation.

## Target pacing

Total clock time per cycle: **~6–8 hours** (incremental-game appropriate). Per-stage targets, assuming engaged play with no idling:

| Transition | Target time | Current (estimated) |
|---|---|---|
| 0 → 1 | 3 min | ~30 s |
| 1 → 2 | 8 min | ~3 min |
| 2 → 3 | 15 min | ~5 min |
| 3 → 4 | 25 min | ~10 min |
| 4 → 5 | 45 min | ~15 min |
| 5 → 6 | 60 min | ~30 s ← user's complaint |
| 6 → 7 | 75 min | ~5 min |
| 7 → 8 | 90 min | ~10 min |
| Ascend | 90 min | ~15 min |

These are rough; the goal is "you definitely notice each stage has its own arc." Idle players should take ~2× as long.

## Planned changes

### 1. Tame the compounding multipliers (highest impact)

| Constant | Old | New | Rationale |
|---|---|---|---|
| `AQUEDUCT_AMP` | 0.10 (multiplicative) | **0.06** (multiplicative) | 30 aqueducts: ×17 → ×5.7. Still meaningful, no longer runaway. |
| `TURBINE_MULT_PER` | 0.05 | **0.025** | 20 turbines: ×2.0 → ×1.5. |
| `CYCLE_MULT_INC` | 0.5 (+50% per cycle) | **0.25** | Ascensions still meaningful but don't trivialize the next cycle. |
| `GEOTHERMAL_BONUS` | 0.5 | **0.30** | One-shot; less of a runaway boost. |

Optionally, change aqueduct from multiplicative to **diminishing-returns multiplicative**: each aqueduct adds `0.10 / (1 + n × 0.05)` so the 30th aqueduct only adds ~4%. This caps the ceiling without an arbitrary number cap. Recommend trying flat 0.06 first; switch to diminishing only if still runaway.

### 2. Make water consumers actually bite

All Stage-5+ consumers scale up roughly 10–30×. Steam economy stays internally consistent (boilers still output enough steam to power expected seeder counts).

| Consumer | Old | New | Notes |
|---|---|---|---|
| `BOILER_WATER_PER_SEC` | 0.5 | **8.0** | 5 boilers = 40 w/s. At Stage 5 entry rate (~50 w/s post-rebalance), this is real cost. |
| `BOILER_COAL_PER_SEC` | 0.05 | **0.4** | Forces coal market engagement until Electrolysis. |
| `BOILER_STEAM_OUT_PER_SEC` | 1.0 | **6.0** | Keeps water:steam ratio ~1.3:1 (was 0.5:1). Steam still scales, just feeds bigger consumers. |
| `POLLUTION_PER_BOILER` | 0.4 | **1.5** | Pollution becomes a real Stage-5 problem to solve. |
| `SEEDER_WATER_PER_SEC` | 0.3 | **5.0** | At Stage 7 entry (~200 w/s), 10 seeders = 50 w/s draw. |
| `SEEDER_STEAM_PER_SEC` | 0.1 | **1.0** | Matches new boiler output. |
| `SEEDER_VAPOR_PER_SEC` | 0.4 | **2.5** | Keeps cloud production rate similar in absolute terms. |
| `POP_WATER_NEED` | 0.04 | **0.15** | 100 pop = 15 w/s. Settlement size now matters for water budget. |
| `POP_FOOD_NEED` | 0.02 | **0.05** | Food growing more meaningful; potato & farm research now necessary, not optional. |

### 3. Re-gate every milestone

The user's example: Stage 5 → 6 needs 5,000 water + 80 steam. After re-balance the player enters Stage 5 with maybe 50 w/s and ~10 boilers @ 8 w/s consumption = 50 w/s sink. Net water flow ~0; player must invest in faucet/aqueduct upgrades to push past it. New gates:

| Milestone | Old visible/cost | New visible/cost |
|---|---|---|
| Stage 1 | cap ≥ 20 | cap ≥ 20 *(unchanged — early)* |
| Stage 2 | 80w + 25 seeds; 25 bamboo, 3 plots | **300w + 60 seeds**; 50 bamboo, 3 plots |
| Stage 3 | 400w + 60 salt; 2 GH, faucet ≥ 1 | **3,000w + 250 salt**; 3 GH, faucet ≥ 4 |
| Stage 4 | 1000w + 150 salt; 4 aqueducts, faucet ≥ 3 | **15,000w + 800 salt**; 8 aqueducts, faucet ≥ 12 |
| Stage 5 | 2500w + 800 labor; 25 pop, 200 labor | **50,000w + 5,000 labor**; 60 pop, 2,000 labor |
| Stage 6 | 5000w + 80 steam; 3 boilers, 50 steam | **250,000w + 1,500 steam**; 8 boilers, 800 steam |
| Stage 7 | 50 minerals + 200 steam; depth 500, 30 minerals | **800 minerals + 5,000 steam**; depth 800, 400 minerals |
| Stage 8 | 500 min + 30 ⚡; 20 clouds, 15 ⚡ | **8,000 min + 250 ⚡**; 80 clouds, 200 ⚡ |
| Ascend (`HYDROENTROPY_TARGET`) | 1e6 | **5e7** | 50× — ascension feels earned rather than incidental. |

### 4. Slow faucetRate accumulation

The compounding harvest-bonus loop is the secret runaway. Two changes:

- **Cap `faucetRate` permanent additions to a `√harvests` curve.** Each subsequent harvest adds less than the last. e.g. `gain = base × (1 / √(1 + s.bambooHarvested))`. This keeps early-game progression snappy but flattens the late-game tail. Implementation: replace direct `faucetRate += yield` lines in `harvestBamboo`/`harvestCrop`/auto-harvester paths with a helper.
- **OR** (simpler): keep additive, but reduce all `harvestFaucetRate` and `BAMBOO_BASE_YIELD` further — bamboo to 0.002, mangrove to 0.06, saguaro to 0.012. Less elegant but smaller code change.

Recommend the √harvests version for late-game shape; it self-balances and doesn't need re-tuning per stage.

### 5. Resource-cost scaling for upgrades

Several upgrades have flat or shallow cost curves that don't keep up. Specifically:

- **Aqueduct cost growth**: `150 × 1.55ⁿ`. Keep base, raise growth to **1.7** so the 20th aqueduct costs ~140k water (vs 31k now).
- **Boiler cost growth**: `200 × 1.6ⁿ`. Raise base to **400** and growth to **1.7**.
- **Cloud seeder cost growth**: `800 × 1.6ⁿ`. Raise base to **2,000** and growth to **1.75**.
- **Drill bit cost growth**: `400 × 1.7ⁿ`. Already steep; leave alone.

### 6. Capacity scaling — verify

Last round we changed cap upgrade to add `max(10, ceil(cap × 0.15))`. Verify this keeps up with inflated milestone costs:

- Stage 5 milestone: 50,000 water cost. Cap needs to reach 50,000.
- At cap=10000, +1500/upgrade. To go from 10k → 50k = ~27 upgrades, each costing ~85% of current cap. That's ~10 minutes of upgrade-spam at decent water rate. **OK**.

Concern: capacity cost curve may need a small bump if it consistently lags behind milestone gates. Defer until tested.

## Implementation order (lowest blast-radius first)

1. **Step 1 — Constants only** (low risk; no save migration). Update `AQUEDUCT_AMP`, `TURBINE_MULT_PER`, `CYCLE_MULT_INC`, `GEOTHERMAL_BONUS`, all `BOILER_*`, `SEEDER_*`, `POP_*` constants, `HYDROENTROPY_TARGET`.
2. **Step 2 — Milestone cost/visibility predicates**. One edit per milestone in `upgrades` array.
3. **Step 3 — Upgrade cost curves**. Update aqueduct, boiler, seeder cost formulas.
4. **Step 4 — `√harvests` faucetRate curve** *(if approved)*. Touches `harvestBamboo`, `harvestCrop`, `harvestAllCrops`, `harvestAllBamboo`, and the auto-harvester paths in tick. Add a `permanentRateGain(s, base)` helper.
5. **Step 5 — Verify** — Reset save, play through Stage 0–3 manually checking pacing feels right; iterate constants if needed.

## Risks / regressions

- **Existing saves break feel.** A player mid-Stage-5 with 5800 water/s and 30 aqueducts will suddenly find boilers eat 80 w/s instead of 1.5. That's intended — they're now appropriately challenged — but the perception is "my numbers got smaller." Mitigation: in-game patch note via `pushLog`.
- **Capacity wall**. With 50,000 water needed for Stage 5 milestone, players may stall on capacity upgrades. If telemetry shows >5 min stuck on cap, bump `CAP_GROWTH_RATIO` from 0.15 → 0.20.
- **Pollution lockout**. With `POLLUTION_PER_BOILER` 4× higher, Stage 5 might dead-end into pollution penalty before Electrolysis is affordable. Verify Electrolysis cost (currently 100 steam + 500 labor) is still reachable; may need to reduce.
- **Bamboo plot upkeep + new plant cost**. Stage 1 plots already have `plantCost: 10` and `growCost: 0.2 w/s`. If Stage 2 milestone moves to 50 bamboo harvests, that's 50 cycles × 11.6 water/cycle = 580 water minimum just to clear the gate. May feel grindy; if so, drop bamboo `growCost` to 0.1 or `plantCost` to 6.
- **Existing players' faucetRate unchanged**. The `√harvests` change only affects future harvests. Players with already-accumulated faucetRate keep their numbers. That's fine — the change just stops further runaway.

## Open questions for the user

1. **Aqueduct multiplier model**: flat 0.06 (clean), or diminishing-returns curve (`0.10 / (1 + n × 0.05)`)? I recommend flat 0.06 for simplicity.
2. **`√harvests` curve**: aggressive reshaping (recommended) or just further reduce `harvestFaucetRate` / `BAMBOO_BASE_YIELD` constants?
3. **Save reset**: Should the rebalance bump `SAVE_KEY` to `v2` and force a fresh start, or merge in place and let players see their old numbers?
4. **Pacing knobs**: After Step 5 verification, if pacing still feels off, do you want me to iterate or hand back for tuning?

## Critical files to modify

- `/home/drew/projects/faucet-incremental/src/game.ts` — all constants (lines 158–250), milestone array (lines 2010–2158), upgrade cost formulas (aqueduct ~1480, boiler ~1590, seeder ~1700), and harvest reducers (~895–1015) for `√harvests` curve.
- `/home/drew/projects/faucet-incremental/src/App.tsx` — optional `SAVE_KEY` bump if doing v2 reset.
- No UI changes required — descriptions auto-derive from constants.
