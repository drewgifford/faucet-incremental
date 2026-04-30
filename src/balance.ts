// =============================================================================
// balance.ts — single source of truth for every numeric balance knob in the
// simulation. Anything that affects pacing, cost curves, or scaling lives here.
// game.ts imports and re-exports these so existing UI code keeps working.
// =============================================================================

import type { State, CropType } from "./game";

// === Logging ===
export const LOG_CAP = 6;

// === Wheel physics — purely visual but lives next to player-action knobs ===
export const MAX_SPIN_SPEED = 1080; // deg/sec
export const SPIN_CLICK_BOOST = 540;
export const SPIN_DECAY = 1200;

// === Stage 0 — Faucet & wheel ===
export const SPIN_GAIN_BASE = 0.08; // water per spin (lower → more clicking to start)
export const SPIN_YIELD_INC = 0.22; // +per spinYield level
export const FAUCET_INC = 0.05; // +u/s per faucet level
export const FAUCET_MULT_INC = 0.16; // ×multiplier per pressure-regulator level
export const CAP_INC = 6;
export const CAP_GROWTH_RATIO = 0.12;
export const STAGE1_CAP_THRESHOLD = 180; // capacity needed to advance to Stage 1
export const SALT_BYPRODUCT_RATIO = 0.014; // salt / water generated

// === Stage 1 — Bamboo ===
export const BAMBOO_GROW_BASE = 14; // seconds for bamboo to mature
export const BAMBOO_BASE_YIELD = 0.0028; // base permanent +u/s per harvest before sqrt curve
export const BAMBOO_GROW_COST = 0.18; // water/sec upkeep while a Stage-1 plot is growing
export const YIELD_MULT_PER_LEVEL = 0.18; // +18% all crop output per yield level
export const BAMBOO_SPEED_FACTOR = 0.22; // +22% growth speed per fertilizer level
export const BAMBOO_PLANT_COST = 6;

// === Stage 2 — Greenhouse ===
export const SLOTS_PER_GREENHOUSE = 3;
export const HEAT_PER_PLANT_SEC = 0.35;
export const VENT_RATE_PER_LEVEL = 0.7;
export const HEAT_DECAY_BASE = 0.15;
export const HEAT_GROWTH_THRESHOLD = 75;
export const HEAT_WITHER_THRESHOLD = 100;

// === Stage 3 — Aqueducts ===
export const AQUEDUCT_AMP = 0.05; // each aqueduct: ×(1 + 0.05 × integrity)
export const AQUEDUCT_DECAY_BASE = 0.010; // integrity lost / sec
export const PRESSURE_BASE_MAX = 100;
export const PRESSURE_CAP_PER_LEVEL = 50;
export const PRESSURE_BUILD_BASE = 0.4;
export const PRESSURE_BUILD_PER_RATE = 0.6;
export const PRESSURE_BURST_MULT_BASE = 1.0;
export const PRESSURE_BURST_MULT_VALVE = 2.5;

// === Stage 4 — Settlement ===
export const BASE_POP_CAP = 10;
export const POP_CAP_PER_LEVEL = 5;
export const POP_GROWTH_RATE = 0.10; // pop/sec base; logistic decay near cap
export const POP_WATER_NEED = 0.18;
export const POP_FOOD_NEED = 0.04;
export const POP_DECAY_RATE = 0.6;
export const LABOR_PER_POP = 0.7;
export const SCHOOL_LABOR_MULT = 2;
export const BASE_FOOD_CAP = 20;
export const FOOD_CAP_PER_GRANARY = 30;

// === Stage 5 — Industry ===
export const BOILER_WATER_PER_SEC = 6.0;
export const BOILER_COAL_PER_SEC = 0.3;
export const BOILER_STEAM_OUT_PER_SEC = 3.5;
export const TURBINE_MULT_PER = 0.022;
export const POLLUTION_PER_BOILER = 1.5;
export const POLLUTION_DECAY = 0.15;
export const POLLUTION_MAX = 100;
export const POLLUTION_RATE_PENALTY_MAX = 0.5;
export const COAL_TRADE_WATER = 10;

// === Stage 6 — Aquifer ===
export const DRILL_BASE_SPEED = 0.45; // m/s — base drill speed
export const DRILL_SPEED_PER_LEVEL = 0.35;
export const AQUIFER_DEPTH = 300;
export const AQUIFER_BONUS_PER_M = 0.0025;
export const MAGMA_DEPTH = 800;
export const MINERAL_RATE_FACTOR = 0.0006;
export const CAVE_IN_REF_DEPTH = 1000;
export const CAVE_IN_BASE_PROB = 0.0009;
export const CAVE_IN_LOSS = 0.12;
export const SALT_PER_MINERAL = 40;
export const GEOTHERMAL_BONUS = 0.30;

// === Stage 7 — Atmosphere ===
export const SEEDER_WATER_PER_SEC = 6.0;
export const SEEDER_STEAM_PER_SEC = 1.0;
export const SEEDER_VAPOR_PER_SEC = 1.6;
export const VAPOR_PER_CLOUD = 50;
export const CLOUD_FAUCET_BONUS = 0.04;
export const LIGHTNING_BASE_RATE = 0.001;
export const LIGHTNING_CAP_MULT = 3;

// === Stage 8 — Hydrosphere ===
export const HYDROENTROPY_RATE = 0.04;
export const HYDROENTROPY_TARGET = 4.0e6;
export const CYCLE_MULT_INC = 0.20;

// === Research ===
export const RP_BASE_PER_STAGE = [0, 0.04, 0.07, 0.11, 0.16, 0.22, 0.30, 0.40, 0.55] as const;
export const RP_KEYSTONE_LIBRARY = 0.05;
export const RP_KEYSTONE_STEAM_PRESS = 0.15;
export const RP_KEYSTONE_CRYSTAL_LATTICE = 0.40;
export const RP_KEYSTONE_SKY_ARCHIVE = 1.0;
export const RP_KEYSTONE_AETHERIC_MEMORY = 3.0;

export const researchCost = (base: number, mult: number, level: number) =>
  Math.ceil(base * Math.pow(mult, level));

// =============================================================================
// Crop catalog — per-crop costs/yields/grow times.
// Plant cost is paid up front; growCost is ongoing upkeep while planted.
// =============================================================================
export type CropDef = {
  id: CropType;
  name: string;
  plantCost: number;
  growCost?: number;
  growTime: number;
  passiveWater?: number;
  passiveSalt?: number;
  foodPerSec?: number;
  harvestFaucetRate?: number;
  harvestSeeds?: number;
  harvestSalt?: number; // salt granted on harvest (flat, not yield-multiplied)
  heatPerSec?: number;
  unlocked: (s: State) => boolean;
};

export const CROPS: Record<CropType, CropDef> = {
  bamboo: {
    id: "bamboo",
    name: "Bamboo",
    plantCost: 4,
    growCost: 0.2,
    growTime: 14,
    harvestFaucetRate: 0.0028,
    harvestSeeds: 1,
    // bamboo ash → salt; ONLY applied to Stage-1 plot harvests (not greenhouse
    // bamboo) so it gives the player agency over salt during Stage 1 without
    // double-dipping with reeds in Stage 2+.
    harvestSalt: 0.03,
    foodPerSec: 0.020,
    heatPerSec: 0.30,
    unlocked: () => true,
  },
  lotus: {
    id: "lotus",
    name: "Lotus",
    plantCost: 25,
    growCost: 0.04,
    growTime: 0,
    passiveWater: 0.04,
    foodPerSec: 0.015,
    heatPerSec: 0.10,
    unlocked: (s) => s.lotusUnlocked,
  },
  // Renamed from "Reeds" — pivoted from passive salt to passive water.
  // Sits one tier above lotus: bigger water output, costlier upkeep, hotter.
  // (Crop id stays `reeds` so older saves don't break.)
  reeds: {
    id: "reeds",
    name: "Watercress",
    plantCost: 50,
    growCost: 0.10,
    growTime: 0,
    passiveWater: 0.10,
    foodPerSec: 0.018,
    heatPerSec: 0.18,
    unlocked: (s) => s.reedsUnlocked,
  },
  mangrove: {
    id: "mangrove",
    name: "Mangrove",
    plantCost: 60,
    growCost: 0.5,
    growTime: 50,
    harvestFaucetRate: 0.10,
    foodPerSec: 0.025,
    heatPerSec: 0.45,
    unlocked: (s) => s.mangroveUnlocked,
  },
  saguaro: {
    id: "saguaro",
    name: "Saguaro",
    plantCost: 40,
    growCost: 0.4,
    growTime: 70,
    harvestFaucetRate: 0.018,
    harvestSeeds: 4,
    foodPerSec: 0.020,
    heatPerSec: 0.05,
    unlocked: (s) => s.saguaroUnlocked,
  },
  potato: {
    id: "potato",
    name: "Potato",
    plantCost: 20,
    growCost: 0.08,
    growTime: 0,
    foodPerSec: 0.12,
    heatPerSec: 0.05,
    unlocked: (s) => s.potatoUnlocked,
  },
  // Expensive late-game salt generator: drinks lots of water, pumps salt.
  // Replaces the salt role reeds used to play, at higher tier.
  brinePool: {
    id: "brinePool",
    name: "Brine Pool",
    plantCost: 220,
    growCost: 0.55, // big water upkeep
    growTime: 0,
    passiveSalt: 0.40, // ~8× the old reeds rate
    foodPerSec: 0,
    heatPerSec: 0.08,
    unlocked: (s) => s.brinePoolUnlocked,
  },
};

// =============================================================================
// Cost formulas for repeatable upgrades.
// =============================================================================
export const capIncrement = (cap: number) =>
  Math.max(CAP_INC, Math.ceil(cap * CAP_GROWTH_RATIO));
export const capUpgradeCost = (cap: number) => Math.ceil(cap * 0.85);

export const faucetUpgradeCost = (level: number) =>
  Math.ceil(4 * Math.pow(1.55, level));
export const spinYieldCost = (level: number) =>
  Math.ceil(6 * Math.pow(1.95, level));
export const faucetMultCost = (level: number) =>
  Math.ceil(80 * Math.pow(2.8, level));
export const autoSpinnerCost = (level: number) =>
  Math.ceil(20 * Math.pow(2.4, level));
export const maxSpeedCost = (level: number) =>
  Math.ceil(24 * Math.pow(2.0, level));
export const bambooYieldCost = (level: number) =>
  Math.ceil(12 * Math.pow(1.7, level));
export const bambooSpeedCost = (level: number) =>
  Math.ceil(14 * Math.pow(1.65, level));

// Stage 2 — Greenhouse
export const greenhouseWaterCost = (n: number) => Math.ceil(80 * Math.pow(1.7, n));
export const greenhouseSeedsCost = (n: number) => 8 + n * 8;
export const ventsCost = (level: number) => Math.ceil(30 * Math.pow(1.75, level));
export const thermostatCost = { water: 250, seeds: 30 };
export const cropLotusCost = { water: 60, seeds: 10 };
export const cropReedsCost = { water: 140, seeds: 25 };
export const cropMangroveCost = { water: 200, seeds: 40 };
export const cropSaguaroCost = { water: 120, seeds: 25 };
export const cropPotatoCost = { water: 200, seeds: 30 };
export const cropBrinePoolCost = { water: 600, seeds: 80, salt: 200 };

// Stage 3 — Aqueducts
export const aqueductWaterCost = (n: number) => Math.ceil(180 * Math.pow(1.78, n));
export const aqueductSaltCost = (n: number) => Math.ceil(25 * Math.pow(1.5, n));
export const aqueductDurabilityCost = (level: number) =>
  Math.ceil(120 * Math.pow(1.85, level));
export const pressureCapCost = (level: number) =>
  Math.ceil(180 * Math.pow(1.75, level));
export const pressureValveCost = { water: 400, salt: 100 };

// Stage 4 — Settlement
export const housingWaterCost = (level: number) =>
  Math.ceil(80 * Math.pow(1.55, level));
export const housingSeedsCost = (level: number) => 6 + level * 5;
export const granaryWaterCost = (level: number) =>
  Math.ceil(70 * Math.pow(1.6, level));
export const granarySeedsCost = (level: number) => 8 + level * 5;
export const schoolCost = { water: 600, labor: 250 };

// Stage 5 — Industry
export const boilerWaterCost = (n: number) => Math.ceil(600 * Math.pow(1.7, n));
export const boilerLaborCost = (n: number) => Math.ceil(150 * Math.pow(1.6, n));
export const turbineSteamCost = (n: number) => Math.ceil(30 * Math.pow(1.65, n));
export const turbineLaborCost = (n: number) => Math.ceil(150 * Math.pow(1.5, n));
export const electrolysisCost = { steam: 150, labor: 600 };

// Stage 6 — Aquifer
export const drillBitWaterCost = (level: number) =>
  Math.ceil(600 * Math.pow(1.7, level));
export const drillBitMineralsCost = (level: number) =>
  Math.ceil(6 + level * 4);
export const supportBeamsWaterCost = (level: number) =>
  Math.ceil(450 * Math.pow(1.65, level));
export const supportBeamsMineralsCost = (level: number) =>
  Math.ceil(10 + level * 6);
export const geothermalTapCost = { minerals: 250, steam: 250 };

// Stage 7 — Atmosphere
export const cloudSeederWaterCost = (n: number) =>
  Math.ceil(2500 * Math.pow(1.78, n));
export const cloudSeederMineralsCost = (n: number) =>
  Math.ceil(25 + n * 14);
export const lightningCapacitorCost = { minerals: 120, steam: 250 };
export const weatherSatelliteCost = { minerals: 300, steam: 350, lightning: 6 };

// Storage one-shots
export const reservoirPressureCost = { water: 120 };
export const reservoirPressureBonus = { capacity: 25, faucetRate: 0.5 };

// Bamboo / GH special
export const bambooPlotSeedCost = (existing: number) => 5 + (existing - 1) * 8;
export const autoHarvesterSaltCost = 30;

// =============================================================================
// Milestone gate values — the player-facing requirements that gate stage advance.
// =============================================================================
export const MILESTONE = {
  stage1: { capReq: STAGE1_CAP_THRESHOLD },
  stage2: {
    waterCost: 1200, seedsCost: 140,
    bambooHarvestedReq: 150, plotsReq: 4,
  },
  stage3: {
    waterCost: 14000, saltCost: 900,
    greenhousesReq: 5, faucetReq: 9.0,
  },
  stage4: {
    waterCost: 70000, saltCost: 3000,
    aqueductsReq: 14, faucetReq: 28.0,
  },
  stage5: {
    waterCost: 360000, laborCost: 22000,
    populationReq: 95, laborReq: 9500,
  },
  stage6: {
    waterCost: 800000, steamCost: 11000,
    boilersReq: 12, steamReq: 5000,
  },
  stage7: {
    mineralsCost: 11000, steamCost: 60000,
    depthReq: 6200, mineralsReq: 8000,
  },
  stage8: {
    mineralsCost: 60000, lightningCost: 1900,
    cloudsReq: 600, lightningReq: 1800,
  },
};

// =============================================================================
// Pacing targets — sim time (minutes) at which each phase transition should
// occur, measured from the start of the run. The simulator checks the actual
// transition timestamps against these ranges.
// =============================================================================
export type PhaseTarget = {
  from: number;
  to: number;
  minMin: number;
  maxMin: number;
  label: string;
};

export const PHASE_TARGETS: PhaseTarget[] = [
  { from: 0, to: 1, minMin: 10, maxMin: 20, label: "Phase 0 → 1" },
  { from: 1, to: 2, minMin: 60, maxMin: 120, label: "Phase 1 → 2" },
  { from: 2, to: 3, minMin: 180, maxMin: 300, label: "Phase 2 → 3" },
  { from: 3, to: 4, minMin: 300, maxMin: 600, label: "Phase 3 → 4" },
  { from: 4, to: 5, minMin: 660, maxMin: 840, label: "Phase 4 → 5" },
  { from: 5, to: 6, minMin: 900, maxMin: 1020, label: "Phase 5 → 6" },
  { from: 6, to: 7, minMin: 1080, maxMin: 1200, label: "Phase 6 → 7" },
  { from: 7, to: 8, minMin: 1200, maxMin: 1440, label: "Phase 7 → 8" },
  { from: 8, to: 9, minMin: 1680, maxMin: 2040, label: "Ending (ascension)" },
];

// Maximum gap (minutes) between narrative or decision events allowed.
export const MAX_QUIET_GAP_MIN = 30;
