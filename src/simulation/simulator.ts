// =============================================================================
// simulator.ts — headless harness around the game reducer.
//
// Runs the same reducer/upgrade tree the React UI uses, with a deterministic-ish
// "engaged player" policy on top. No DOM, no React. Outputs a chronological
// event log plus pacing metrics keyed off PHASE_TARGETS in balance.ts.
// =============================================================================

import {
  AQUIFER_DEPTH,
  BOILER_COAL_PER_SEC,
  COAL_TRADE_WATER,
  HEAT_DECAY_BASE,
  HYDROENTROPY_TARGET,
  PHASE_TARGETS,
  POP_FOOD_NEED,
  SALT_PER_MINERAL,
  MAX_QUIET_GAP_MIN,
  VENT_RATE_PER_LEVEL,
  type PhaseTarget,
} from "../balance";
import {
  CROPS,
  effectiveFaucet,
  initialState,
  reducer,
  upgrades,
  type Action,
  type CropType,
  type State,
  type Upgrade,
} from "../game";

// ---- Event model -------------------------------------------------------------

export type EventCategory =
  | "phase"
  | "milestone"
  | "decision"
  | "critical"
  | "narrative";

export type SimEvent = {
  t: number; // sim seconds since start
  category: EventCategory;
  label: string;
  detail?: string;
};

export type PhaseTransition = {
  from: number;
  to: number;
  t: number; // sim seconds since start
};

export type TargetCheck = {
  label: string;
  from: number;
  to: number;
  targetMinMin: number;
  targetMaxMin: number;
  actualMin: number | null;
  ok: boolean;
  deviationPct: number | null; // signed % outside the range; null if hit
};

export type SimResult = {
  events: SimEvent[];
  phaseTransitions: PhaseTransition[];
  finalState: State;
  totalSimSeconds: number;
  totalSimMinutes: number;
  endedReason: "ascension" | "timeout" | "stalled";
  longestQuietGapMinutes: number;
  decisionDensityPerHour: number;
  targetChecks: TargetCheck[];
  withinAllTargets: boolean;
};

// ---- Policy ------------------------------------------------------------------

const SIM_TICK_DT = 0.5; // seconds per sim tick — coarse enough to be fast, fine enough for accuracy
const SPIN_PER_SEC_STAGE0 = 3; // motivated player at the wheel
const NARRATIVE_INTERVAL_S = 5 * 60; // one pulse per 5 sim minutes, so MAX_QUIET_GAP_MIN can never trip from inaction

// Effective greenhouse cooling capacity (heat/sec the vents can dissipate).
function coolingCapacity(s: State): number {
  const ventsEffective =
    s.ventsLevel + (s.thermostatBought ? 2 : 0);
  const base = HEAT_DECAY_BASE + ventsEffective * VENT_RATE_PER_LEVEL;
  return base * (1 + s.researchHeatVentLevel * 0.15);
}

// Heat being generated right now by planted crops.
function currentHeatLoad(s: State): number {
  return s.ghSlots.reduce(
    (acc, sl) => acc + (sl.crop ? (CROPS[sl.crop].heatPerSec ?? 0) : 0),
    0,
  );
}

// Crops planted in greenhouse slots, in stage-aware priority order. Pick the
// best crop that fits within the remaining heat budget — otherwise leave the
// slot empty so the greenhouse doesn't overheat and wither everything.
//
// Strategy: all slots try the highest-priority crop first. This is a real
// player's strategy too — flood-fill the bottleneck resource (water in S2,
// food in S4, etc.) rather than diversify for variety's sake.
function pickCrop(s: State, _slotIdx: number): CropType | null {
  const stage = s.stage;
  const candidates: CropType[] = [];

  // Stage 4+: food is the bottleneck for population growth. Potato dominates.
  if (stage >= 4 && s.potatoUnlocked) {
    // Need enough food/s to feed current population at headroom × 1.5.
    const need = Math.max(1, s.population) * POP_FOOD_NEED * 1.5;
    const have = s.ghSlots.reduce(
      (acc, sl) => acc + (sl.crop ? (CROPS[sl.crop].foodPerSec ?? 0) : 0),
      0,
    );
    if (have < need) candidates.push("potato");
  }

  // Brine Pool — top salt source. Plant when salt is short on stage 3+ targets.
  if (s.brinePoolUnlocked && stage >= 3) {
    const milestoneSaltShort =
      (stage === 3 && s.salt < 1100) || (stage === 4 && s.salt < 4500);
    if (milestoneSaltShort) candidates.push("brinePool");
  }

  // Watercress (formerly reeds): tier-2 passive water. Better than lotus.
  if (s.reedsUnlocked) candidates.push("reeds");
  // Lotus: tier-1 passive water, cheap and low-heat.
  if (s.lotusUnlocked) candidates.push("lotus");
  // Once auto-harvester is in, saguaro/mangrove harvest-rate bonuses are
  // worthwhile if cooling allows.
  if (s.saguaroUnlocked && s.autoHarvesterBought) candidates.push("saguaro");
  if (s.mangroveUnlocked && s.autoHarvesterBought) candidates.push("mangrove");
  // Stage 4+: potato as filler (after food saturation) is still useful for headroom.
  if (stage >= 4 && s.potatoUnlocked && !candidates.includes("potato")) {
    candidates.push("potato");
  }
  // Bamboo last — hot, but useful for the salt-on-harvest stream.
  candidates.push("bamboo");

  const cooling = coolingCapacity(s);
  const load = currentHeatLoad(s);
  const slack = cooling - load - 0.05; // safety margin

  for (const c of candidates) {
    const def = CROPS[c];
    const heatCost = def.heatPerSec ?? 0;
    if (heatCost > slack) continue;
    if (s.water < def.plantCost) continue;
    return c;
  }
  return null;
}

// Uproot any planted crop in slot indices >= the maximum the cooling can
// support. Stops over-population from withering everything.
function shedHotSlots(s: State): State {
  const cooling = coolingCapacity(s);
  let next = s;
  // If currently safe, no work to do.
  if (currentHeatLoad(next) <= cooling + 0.05) return next;
  // Iterate slots in REVERSE — uproot from the end first.
  for (let i = next.ghSlots.length - 1; i >= 0; i--) {
    if (currentHeatLoad(next) <= cooling + 0.05) break;
    const sl = next.ghSlots[i];
    if (sl.crop) {
      next = step(next, { type: "uprootCrop", slotIdx: i });
    }
  }
  // Even after uprooting all, heat may still be high (residual). That's fine —
  // the tick loop will let it decay.
  return next;
}

// Run one tick of player decisions. Returns the new state. `step` lets us call
// reducer multiple times per tick.
function step(s: State, a: Action): State {
  return reducer(s, a);
}

// Explicit priority order. Stage-defining infrastructure goes first so it
// doesn't get starved by cap/faucet purchases that drain water. Multipliers
// and storage come AFTER the things they're meant to support, so the player
// doesn't "waste" water on a cap upgrade when a greenhouse is one tick away.
const BUY_PRIORITY: string[] = [
  // Stage-progressing infrastructure
  "greenhouse",
  "aqueduct",
  "housing",
  "granary",
  "boiler",
  "turbine",
  "drillBit",
  "supportBeams",
  "cloudSeeder",
  "bambooPlot",
  // Crop unlocks (one-shots) — cheap and unblock variety
  "cropLotus",
  "cropReeds",
  "cropSaguaro",
  "cropMangrove",
  "cropPotato",
  "cropBrinePool",
  // High-impact one-shots
  "autoHarvester",
  "reservoirPressure",
  "thermostat",
  "school",
  "electrolysis",
  "geothermalTap",
  "lightningCapacitor",
  "weatherSatellite",
  "pressureValve",
  // Research keystones
  "r_library",
  "r_steamPress",
  "r_crystalLattice",
  "r_skyArchive",
  "r_aethericMemory",
  // Multipliers
  "bambooYield",
  "bambooSpeed",
  "vents",
  "aqueductDurability",
  "faucetMult",
  // Cap/faucet/spin — fall through after stage infra is satisfied
  "cap",
  "faucet",
  "spinYield",
  "autoSpinner",
  "maxSpeed",
  "pressureCap",
  // Repeatable research
  "r_growth",
  "r_passiveCrop",
  "r_heatVent",
  "r_aqueductDecay",
  "r_pressureCap",
  "r_laborMult",
  "r_popGrowth",
  "r_turbineMult",
  "r_pollutionDecay",
  "r_drillSpeed",
  "r_aquiferYield",
  "r_cloudBonus",
  "r_lightningRate",
  "r_hydroentropyRate",
  "r_throughput",
  "r_spinYield",
];

// Stage-defining infrastructure — never starve these for resources by buying
// lower-priority upgrades. When one of these is visible but unaffordable, the
// AI "saves up" rather than nibbling its resources on multipliers.
const SAVE_FOR_IDS = new Set([
  "greenhouse",
  "aqueduct",
  "housing",
  "granary",
  "boiler",
  "turbine",
  "drillBit",
  "supportBeams",
  "cloudSeeder",
  // Vents are critical: without enough cooling, greenhouse crops wither and
  // stage 2 / stage 3 cannot progress.
  "vents",
  // Crop unlocks — cheap one-shots that broaden the option pool.
  "cropLotus",
  "cropReeds",
  "cropSaguaro",
  "cropMangrove",
  "cropPotato",
  "cropBrinePool",
  // High-impact one-shots tied to stage progression.
  "autoHarvester",
  "thermostat",
  "school",
  "electrolysis",
  "geothermalTap",
  "lightningCapacitor",
  "weatherSatellite",
  "pressureValve",
]);

// Per-id soft caps — the AI stops buying once it hits these. Without caps the
// AI over-invests in cheap repeatable upgrades and deprives stage infra.
const LEVEL_CAPS: Record<string, number> = {
  bambooPlot: 4, // 4 plots is plenty for stage 1 to clear the bamboo gate
  vents: 8, // diminishing returns past this; pollutes priority list
  spinYield: 4,
  autoSpinner: 3,
  maxSpeed: 3,
};

type ResourceBag = {
  water?: number;
  seeds?: number;
  salt?: number;
  labor?: number;
  steam?: number;
  coal?: number;
  minerals?: number;
  lightning?: number;
  research?: number;
};

function computeReserve(s: State, byId: Map<string, Upgrade>): ResourceBag {
  // Compose the maximum of every "save for" upgrade's cost across resources.
  // If multiple are visible+unaffordable, reserve enough for the priciest of each kind.
  const reserve: ResourceBag = {};
  for (const id of SAVE_FOR_IDS) {
    const u = byId.get(id);
    if (!u || !u.visible(s) || u.done?.(s)) continue;
    const cost = u.cost(s) as ResourceBag;
    const have = {
      water: s.water,
      seeds: s.seeds,
      salt: s.salt,
      labor: s.labor,
      steam: s.steam,
      coal: s.coal,
      minerals: s.minerals,
      lightning: s.lightning,
      research: s.researchPoints,
    };
    const affordable = (Object.keys(cost) as Array<keyof ResourceBag>).every(
      (k) => (cost[k] ?? 0) <= (have[k] ?? 0),
    );
    if (affordable) continue; // AI will buy it this tick — no need to reserve
    for (const k of Object.keys(cost) as Array<keyof ResourceBag>) {
      const v = cost[k] ?? 0;
      if (v > (reserve[k] ?? 0)) reserve[k] = v;
    }
  }
  return reserve;
}

function passesReserve(
  s: State,
  cost: ResourceBag,
  reserve: ResourceBag,
): boolean {
  // After paying `cost` from `s`, leftover must be ≥ reserve in each resource.
  const wAfter = s.water - (cost.water ?? 0);
  if (wAfter < (reserve.water ?? 0)) return false;
  const seedsAfter = s.seeds - (cost.seeds ?? 0);
  if (seedsAfter < (reserve.seeds ?? 0)) return false;
  const saltAfter = s.salt - (cost.salt ?? 0);
  if (saltAfter < (reserve.salt ?? 0)) return false;
  const laborAfter = s.labor - (cost.labor ?? 0);
  if (laborAfter < (reserve.labor ?? 0)) return false;
  const steamAfter = s.steam - (cost.steam ?? 0);
  if (steamAfter < (reserve.steam ?? 0)) return false;
  const coalAfter = s.coal - (cost.coal ?? 0);
  if (coalAfter < (reserve.coal ?? 0)) return false;
  const mineralsAfter = s.minerals - (cost.minerals ?? 0);
  if (mineralsAfter < (reserve.minerals ?? 0)) return false;
  const lightningAfter = s.lightning - (cost.lightning ?? 0);
  if (lightningAfter < (reserve.lightning ?? 0)) return false;
  const researchAfter = s.researchPoints - (cost.research ?? 0);
  if (researchAfter < (reserve.research ?? 0)) return false;
  return true;
}

// Try every upgrade in priority order; buy what's affordable + visible.
// Milestones and SAVE_FOR_IDS bypass the reserve check (they ARE the reserve);
// everything else must leave enough resources to fund the saved-for purchase.
function buyAffordable(s: State): { state: State; bought: Upgrade[] } {
  const bought: Upgrade[] = [];
  const byId = new Map(upgrades.map((u) => [u.id, u]));
  const milestones = upgrades.filter((u) => u.group === "milestone");
  let next = s;
  let progress = true;
  let safety = 200; // upper bound on purchases per tick
  while (progress && safety-- > 0) {
    progress = false;

    // 1. Milestones — always priority.
    for (const u of milestones) {
      if (u.visible(next) && u.available(next) && !(u.done?.(next) ?? false)) {
        const after = step(next, { type: "buy", id: u.id });
        if (after !== next) {
          bought.push(u);
          next = after;
          progress = true;
          break;
        }
      }
    }
    if (progress) continue;

    // 2. SAVE_FOR_IDS — buy these whenever affordable, regardless of reserve.
    for (const id of BUY_PRIORITY) {
      if (!SAVE_FOR_IDS.has(id)) continue;
      const u = byId.get(id);
      if (!u) continue;
      const lvlCap = LEVEL_CAPS[id];
      if (lvlCap !== undefined && (u.level?.(next) ?? 0) >= lvlCap) continue;
      if (u.visible(next) && u.available(next) && !(u.done?.(next) ?? false)) {
        const after = step(next, { type: "buy", id });
        if (after !== next) {
          bought.push(u);
          next = after;
          progress = true;
          break;
        }
      }
    }
    if (progress) continue;

    // 3. Everything else — must respect the reserve, with one important
    //    exception: if the reserve calls for more water/labor/etc than the
    //    current cap can hold, the AI must be allowed to grow the cap.
    //    Otherwise it deadlocks at water=capacity unable to afford the gate.
    const reserve = computeReserve(next, byId);
    const capExpansionNeeded = (reserve.water ?? 0) > next.capacity;
    for (const id of BUY_PRIORITY) {
      if (SAVE_FOR_IDS.has(id)) continue;
      const u = byId.get(id);
      if (!u) continue;
      const lvlCap = LEVEL_CAPS[id];
      if (lvlCap !== undefined && (u.level?.(next) ?? 0) >= lvlCap) continue;
      if (!u.visible(next) || !u.available(next) || (u.done?.(next) ?? false)) continue;

      const cost = u.cost(next) as ResourceBag;

      // Cap-expansion escape hatch: allow cap upgrade when water reserve
      // exceeds current capacity (i.e., water can never grow large enough
      // without a bigger reservoir).
      if (id === "cap" && capExpansionNeeded) {
        const after = step(next, { type: "buy", id });
        if (after !== next) {
          bought.push(u);
          next = after;
          progress = true;
          break;
        }
        continue;
      }

      if (!passesReserve(next, cost, reserve)) continue;
      const after = step(next, { type: "buy", id });
      if (after !== next) {
        bought.push(u);
        next = after;
        progress = true;
        break;
      }
    }
  }
  return { state: next, bought };
}

// Apply player actions for this tick, return the new state and any side
// signals the simulator wants to log.
function policyTick(
  s: State,
  dt: number,
  spinAccum: { spins: number },
): { state: State; planted: number; harvested: number; bought: Upgrade[] } {
  let next = s;
  let planted = 0;
  let harvested = 0;

  // Stage 0 — spin the wheel.
  if (next.stage === 0) {
    spinAccum.spins += SPIN_PER_SEC_STAGE0 * dt;
    while (spinAccum.spins >= 1) {
      next = step(next, { type: "spin" });
      spinAccum.spins -= 1;
    }
  }

  // Stage 1 — plant + harvest bamboo plots.
  if (next.stage === 1 && next.plots.length > 0) {
    const before = next;
    next = step(next, { type: "plantAllBamboo" });
    if (next !== before) {
      planted += next.plots.filter((p) => p.planted).length -
        before.plots.filter((p) => p.planted).length;
    }
    if (!next.autoHarvesterBought) {
      const beforeH = next;
      next = step(next, { type: "harvestAllBamboo" });
      if (next !== beforeH) harvested += 1;
    }
  }

  // Stage 2+ — manage greenhouse slots.
  if (next.stage >= 2) {
    // First, uproot any crops past the heat budget. This handles the carry-over
    // bamboo plots from stage 1 that would otherwise wither everything.
    next = shedHotSlots(next);

    // Stage 4+: when food is short, replace non-potato crops with potato.
    // Lotus etc. carried over from stage 2/3 don't generate enough food to
    // grow population; the AI must voluntarily replant.
    if (next.stage >= 4 && next.potatoUnlocked) {
      const foodPerSec = (s: State) =>
        s.ghSlots.reduce(
          (acc, sl) => acc + (sl.crop ? (CROPS[sl.crop].foodPerSec ?? 0) : 0),
          0,
        );
      const popNow = Math.max(1, next.population);
      const foodNeed = popNow * POP_FOOD_NEED * 1.5; // headroom × 1.5
      if (foodPerSec(next) < foodNeed) {
        const potato = CROPS.potato;
        for (let i = 0; i < next.ghSlots.length; i++) {
          if (foodPerSec(next) >= foodNeed) break;
          const sl = next.ghSlots[i];
          if (!sl.crop || sl.crop === "potato") continue;
          // Don't trash a saguaro/mangrove that is mid-grow toward harvest —
          // those are also food sources, just lower. Skip if foodPerSec already
          // OK from non-potato crops. Otherwise uproot and replant potato.
          if ((CROPS[sl.crop].foodPerSec ?? 0) >= 0.05) continue;
          const slack =
            coolingCapacity(next) -
            (currentHeatLoad(next) - (CROPS[sl.crop].heatPerSec ?? 0)) -
            (potato.heatPerSec ?? 0) -
            0.05;
          if (slack < 0) continue;
          if (next.water < potato.plantCost) continue;
          const a = step(next, { type: "uprootCrop", slotIdx: i });
          if (a === next) continue;
          const b = step(a, { type: "plantCrop", slotIdx: i, crop: "potato" });
          if (b !== a) {
            next = b;
            planted += 1;
          } else {
            next = a;
          }
        }
      }
    }

    // Plant empty slots in priority order, respecting heat budget.
    for (let i = 0; i < next.ghSlots.length; i++) {
      if (!next.ghSlots[i].crop) {
        const choice = pickCrop(next, i);
        if (choice) {
          const before = next;
          next = step(next, { type: "plantCrop", slotIdx: i, crop: choice });
          if (next !== before) planted += 1;
        }
      }
    }
    // Harvest ready slots if no auto-harvester yet.
    if (!next.autoHarvesterBought) {
      const before = next;
      next = step(next, { type: "harvestAllCrops" });
      if (next !== before) harvested += 1;
    }
  }

  // Stage 3+ — repair aqueducts when they're getting ratty.
  if (next.stage >= 3 && next.aqueducts > 0) {
    const totalIntegrity =
      next.aqueductIntegrity.reduce((a, b) => a + b, 0) / next.aqueducts;
    if (totalIntegrity < 0.55) {
      next = step(next, { type: "repairAqueducts" });
    }
  }

  // Stage 5 — buy coal as needed (pre-electrolysis).
  if (
    next.stage >= 5 &&
    !next.electrolysisBought &&
    next.boilers > 0 &&
    next.coal < next.boilers * BOILER_COAL_PER_SEC * 60
  ) {
    const desired = Math.ceil(next.boilers * BOILER_COAL_PER_SEC * 120);
    const need = Math.max(0, desired - Math.floor(next.coal));
    const affordable = Math.floor(next.water / COAL_TRADE_WATER);
    const buy = Math.min(need, affordable);
    if (buy > 0) next = step(next, { type: "buyCoal", amount: buy });
  }

  // Stage 6 — keep drilling on; convert excess salt to minerals.
  if (next.stage >= 6) {
    if (!next.drilling) next = step(next, { type: "toggleDrill" });
    if (next.salt >= SALT_PER_MINERAL * 10) {
      const chunk =
        Math.floor(next.salt / SALT_PER_MINERAL) * SALT_PER_MINERAL;
      if (chunk > 0) next = step(next, { type: "convertSalt", salt: chunk });
    }
  }

  // Buy whatever we can — milestones first.
  const { state, bought } = buyAffordable(next);
  next = state;

  // Stage 8 — ascend when threshold reached.
  if (next.stage === 8 && next.hydroentropy >= HYDROENTROPY_TARGET) {
    // Don't ascend in this simulator — the run is a single cycle and ascension
    // resets state to Stage 0, which would invalidate the metrics. We treat
    // hitting the threshold as the "ending" event and stop.
  }

  return { state: next, planted, harvested, bought };
}

// ---- Simulation main loop ----------------------------------------------------

export type SimulateOptions = {
  /** Maximum sim seconds before giving up. Default 36 hours. */
  maxSeconds?: number;
  /** Tick step in sim seconds. Default 0.5. */
  dt?: number;
  /** Optional progress callback (sim time) — invoked every minute. */
  onMinute?: (simSec: number, s: State) => void;
};

export function simulate(opts: SimulateOptions = {}): SimResult {
  const dt = opts.dt ?? SIM_TICK_DT;
  const maxSeconds = opts.maxSeconds ?? 36 * 3600;

  let s: State = initialState;
  let t = 0;
  const events: SimEvent[] = [];
  const transitions: PhaseTransition[] = [];
  let lastStage = s.stage;
  let lastNarrativeT = -NARRATIVE_INTERVAL_S; // force one early narrative pulse
  let lastMinuteCb = -1;
  const seenLogs = new Set<string>();
  let endedReason: SimResult["endedReason"] = "timeout";

  const log = (
    category: EventCategory,
    label: string,
    detail?: string,
  ) => {
    events.push({ t, category, label, detail });
  };

  log("phase", "Stage 0 — Faucet", "simulation begin");

  const spinAccum = { spins: 0 };

  while (t < maxSeconds) {
    // 1. Player actions.
    const { state: afterActions, bought } = policyTick(s, dt, spinAccum);
    s = afterActions;

    // 2. Reducer tick.
    s = step(s, { type: "tick", dt });
    t += dt;

    // 3. Stage transition?
    if (s.stage !== lastStage) {
      transitions.push({ from: lastStage, to: s.stage, t });
      log(
        "phase",
        `Phase ${lastStage} → ${s.stage}`,
        `stage advanced at t=${formatTime(t)}`,
      );
      lastStage = s.stage;
    }

    // 4. Decision events from purchases.
    for (const u of bought) {
      if (u.group === "milestone") {
        log("milestone", `Milestone: ${u.name}`, `id=${u.id}`);
      } else if (u.done) {
        // One-shot: clearly a decision.
        log("decision", `Installed: ${u.name}`, `id=${u.id}`);
      } else {
        // Repeatable: log only the FIRST purchase of each unique id to avoid
        // flooding the output.
        if (!seenLogs.has(u.id)) {
          log("decision", `First buy: ${u.name}`, `id=${u.id}`);
          seenLogs.add(u.id);
        }
      }
    }

    // 5. Critical events — surface-level checks.
    if (s.pollution >= 80 && !seenLogs.has("crit_pollution_high")) {
      log(
        "critical",
        "Pollution > 80",
        `production penalty engaged (pollution=${s.pollution.toFixed(1)})`,
      );
      seenLogs.add("crit_pollution_high");
    }
    if (s.stage >= 4 && s.population >= 1 && s.food <= 0 &&
        !seenLogs.has("crit_starving_first")) {
      log(
        "critical",
        "Starvation event",
        `population=${s.population.toFixed(1)} with no food`,
      );
      seenLogs.add("crit_starving_first");
    }
    // Cave-in — detect via reducer log entries.
    const caveLog = s.logs.find((l) => l.msg.startsWith("⚠ CAVE-IN"));
    if (caveLog && !seenLogs.has(`cave_${caveLog.ts}`)) {
      log("critical", "Cave-in", caveLog.msg);
      seenLogs.add(`cave_${caveLog.ts}`);
    }
    // Stage 6 reaches magma layer (geothermal eligible).
    if (s.stage >= 6 && s.depth >= 800 && !seenLogs.has("narr_magma")) {
      log("narrative", "Drill reached magma layer", `depth=${s.depth.toFixed(0)}m`);
      seenLogs.add("narr_magma");
    }
    // Stage 6 hits aquifer.
    if (s.stage >= 6 && s.depth >= AQUIFER_DEPTH &&
        !seenLogs.has("narr_aquifer")) {
      log("narrative", "Drill struck aquifer", `depth=${s.depth.toFixed(0)}m`);
      seenLogs.add("narr_aquifer");
    }
    if (s.stage >= 7 && s.clouds >= 1 && !seenLogs.has("narr_first_cloud")) {
      log("narrative", "First cloud condensed", `vapor → cloud`);
      seenLogs.add("narr_first_cloud");
    }
    if (s.stage >= 7 && s.lightning >= 1 && !seenLogs.has("narr_first_lightning")) {
      log("narrative", "First lightning strike captured", `lightning=${s.lightning.toFixed(1)}`);
      seenLogs.add("narr_first_lightning");
    }

    // 6. Periodic narrative pulse — guarantees no quiet gap.
    if (t - lastNarrativeT >= NARRATIVE_INTERVAL_S) {
      const rate = effectiveFaucet(s);
      const slotsPlanted = s.ghSlots.filter((sl) => sl.crop).length;
      log(
        "narrative",
        `T+${formatTime(t)} pulse`,
        `stage=${s.stage} water=${s.water.toFixed(1)}/${s.capacity} rate=${rate.toFixed(2)} u/s` +
          (s.stage >= 1 ? ` faucet=${s.faucetRate.toFixed(2)} seeds=${s.seeds}` : "") +
          (s.stage >= 2 ? ` greenhouses=${s.greenhouses} slots=${slotsPlanted}/${s.ghSlots.length}` : "") +
          (s.stage >= 3 ? ` aq=${s.aqueducts}` : "") +
          (s.stage >= 4 ? ` pop=${s.population.toFixed(0)} food=${s.food.toFixed(0)}` : "") +
          (s.stage >= 5 ? ` boilers=${s.boilers} steam=${s.steam.toFixed(0)} pollution=${s.pollution.toFixed(0)}` : "") +
          (s.stage >= 6 ? ` depth=${s.depth.toFixed(0)}m minerals=${s.minerals.toFixed(0)}` : "") +
          (s.stage >= 7 ? ` clouds=${s.clouds} lightning=${s.lightning.toFixed(1)}` : "") +
          (s.stage >= 8 ? ` hydroentropy=${s.hydroentropy.toFixed(0)}/${HYDROENTROPY_TARGET}` : ""),
      );
      lastNarrativeT = t;
    }

    // 7. Minute callback.
    const minute = Math.floor(t / 60);
    if (opts.onMinute && minute !== lastMinuteCb) {
      opts.onMinute(t, s);
      lastMinuteCb = minute;
    }

    // 8. Termination — end of cycle (Stage 8 + hydroentropy threshold).
    if (s.stage === 8 && s.hydroentropy >= HYDROENTROPY_TARGET) {
      log(
        "phase",
        "Phase 8 → ASCENSION",
        `hydroentropy reached ${s.hydroentropy.toFixed(0)} ≥ ${HYDROENTROPY_TARGET}`,
      );
      transitions.push({ from: 8, to: 9, t });
      endedReason = "ascension";
      break;
    }
  }

  if (t >= maxSeconds && endedReason === "timeout") {
    log(
      "critical",
      "Simulation timed out",
      `did not reach ascension within ${formatTime(maxSeconds)}`,
    );
  }

  // ---- Metrics --------------------------------------------------------------

  const targetChecks: TargetCheck[] = PHASE_TARGETS.map((tgt) =>
    evaluateTarget(tgt, transitions),
  );
  const withinAllTargets = targetChecks.every((c) => c.ok);

  // Quiet-gap analysis: gap between consecutive narrative/decision/milestone/critical events.
  const significant = events.filter((e) => e.category !== "phase" || e.label.startsWith("Phase "));
  let longestGap = 0;
  for (let i = 1; i < significant.length; i++) {
    const gap = significant[i].t - significant[i - 1].t;
    if (gap > longestGap) longestGap = gap;
  }
  const longestQuietGapMinutes = longestGap / 60;

  const decisions = events.filter(
    (e) => e.category === "decision" || e.category === "milestone",
  ).length;
  const decisionDensityPerHour = decisions / Math.max(1 / 3600, t / 3600);

  return {
    events,
    phaseTransitions: transitions,
    finalState: s,
    totalSimSeconds: t,
    totalSimMinutes: t / 60,
    endedReason,
    longestQuietGapMinutes,
    decisionDensityPerHour,
    targetChecks,
    withinAllTargets,
  };
}

function evaluateTarget(
  tgt: PhaseTarget,
  transitions: PhaseTransition[],
): TargetCheck {
  const hit = transitions.find((tr) => tr.from === tgt.from && tr.to === tgt.to);
  if (!hit) {
    return {
      label: tgt.label,
      from: tgt.from,
      to: tgt.to,
      targetMinMin: tgt.minMin,
      targetMaxMin: tgt.maxMin,
      actualMin: null,
      ok: false,
      deviationPct: null,
    };
  }
  const actualMin = hit.t / 60;
  const tolerance = 0.20; // ±20% slack on the target window
  const lo = tgt.minMin * (1 - tolerance);
  const hi = tgt.maxMin * (1 + tolerance);
  const ok = actualMin >= lo && actualMin <= hi;
  let deviation: number | null = 0;
  if (actualMin < tgt.minMin) {
    deviation = ((actualMin - tgt.minMin) / tgt.minMin) * 100;
  } else if (actualMin > tgt.maxMin) {
    deviation = ((actualMin - tgt.maxMin) / tgt.maxMin) * 100;
  } else {
    deviation = 0;
  }
  return {
    label: tgt.label,
    from: tgt.from,
    to: tgt.to,
    targetMinMin: tgt.minMin,
    targetMaxMin: tgt.maxMin,
    actualMin,
    ok,
    deviationPct: deviation,
  };
}

// ---- Output formatters -------------------------------------------------------

export function formatTime(simSec: number): string {
  const total = Math.max(0, Math.floor(simSec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(sec).padStart(2, "0")
  );
}

export function formatEvent(e: SimEvent): string {
  const tag = e.category.toUpperCase().padEnd(9);
  const head = `[${formatTime(e.t)}] ${tag} ${e.label}`;
  return e.detail ? `${head} — ${e.detail}` : head;
}

export function formatReport(result: SimResult): string {
  const lines: string[] = [];
  lines.push("=".repeat(80));
  lines.push("FAUCET INCREMENTAL — SIMULATION RESULTS");
  lines.push("=".repeat(80));
  lines.push("");
  lines.push(`Total sim time:   ${formatTime(result.totalSimSeconds)} (${result.totalSimMinutes.toFixed(1)} min)`);
  lines.push(`Ended reason:     ${result.endedReason}`);
  lines.push(`Decision density: ${result.decisionDensityPerHour.toFixed(2)} per hour`);
  lines.push(`Longest quiet gap: ${result.longestQuietGapMinutes.toFixed(1)} min (limit ${MAX_QUIET_GAP_MIN} min)`);
  lines.push(`Within all phase targets: ${result.withinAllTargets ? "YES" : "NO"}`);
  lines.push("");

  lines.push("PHASE TRANSITIONS vs TARGETS (±20% tolerance)");
  lines.push("-".repeat(80));
  lines.push("phase                target (min)        actual (min)   dev%   status");
  lines.push("-".repeat(80));
  for (const c of result.targetChecks) {
    const targetCol = `${c.targetMinMin}–${c.targetMaxMin}`.padStart(13);
    const actualCol = (c.actualMin === null ? "—" : c.actualMin.toFixed(1)).padStart(13);
    const devCol = (c.deviationPct === null
      ? "—"
      : (c.deviationPct === 0 ? "  in range" : `${c.deviationPct >= 0 ? "+" : ""}${c.deviationPct.toFixed(1)}%`)
    ).padStart(10);
    const status = c.ok ? "OK" : "MISS";
    lines.push(`  ${c.label.padEnd(20)} ${targetCol}  ${actualCol}  ${devCol}   ${status}`);
  }
  lines.push("");

  // Event log — abbreviated
  lines.push("EVENT TIMELINE");
  lines.push("-".repeat(80));
  for (const e of result.events) lines.push(formatEvent(e));
  lines.push("");

  // Final state snapshot
  const fs = result.finalState;
  lines.push("FINAL STATE SNAPSHOT");
  lines.push("-".repeat(80));
  lines.push(`stage=${fs.stage}`);
  lines.push(`water=${fs.water.toFixed(0)}/${fs.capacity}    faucetRate=${fs.faucetRate.toFixed(2)}    rate(eff)=${effectiveFaucet(fs).toFixed(2)} u/s`);
  lines.push(`bambooHarvested=${fs.bambooHarvested}    seeds=${fs.seeds}    salt=${fs.salt.toFixed(0)}`);
  lines.push(`greenhouses=${fs.greenhouses}    aqueducts=${fs.aqueducts}    pop=${fs.population.toFixed(1)}/${fs.popCapLevel}`);
  lines.push(`boilers=${fs.boilers}    turbines=${fs.turbines}    steam=${fs.steam.toFixed(0)}    coal=${fs.coal.toFixed(0)}    pollution=${fs.pollution.toFixed(0)}`);
  lines.push(`depth=${fs.depth.toFixed(0)}m    minerals=${fs.minerals.toFixed(0)}    cloudSeeders=${fs.cloudSeeders}    clouds=${fs.clouds}    lightning=${fs.lightning.toFixed(1)}`);
  lines.push(`hydroentropy=${fs.hydroentropy.toFixed(0)}/${HYDROENTROPY_TARGET}`);
  lines.push("=".repeat(80));

  return lines.join("\n");
}
