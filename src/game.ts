export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Plot = {
  planted: boolean;
  progress: number; // 0..1
  ready: boolean;
};

// Stage 2 — Greenhouse crops.
export type CropType = "bamboo" | "lotus" | "reeds" | "mangrove" | "saguaro";

export type Slot = {
  crop: CropType | null;
  progress: number; // 0..1; only meaningful for harvest crops
  ready: boolean;
};

export type CropDef = {
  id: CropType;
  name: string;
  plantCost: number; // water
  growTime: number; // seconds; 0 = passive (no harvest)
  passiveWater?: number; // water/sec while planted
  passiveSalt?: number; // salt/sec while planted
  harvestFaucetRate?: number; // permanent +u/s on harvest
  harvestSeeds?: number; // seeds on harvest
  heatPerSec?: number; // override default
  unlocked: (s: State) => boolean;
};

export type State = {
  stage: Stage;
  // Resources
  water: number;
  capacity: number;
  salt: number;
  seeds: number;
  // Generation
  faucetRate: number; // base passive water/sec from faucet upgrades
  // Levels
  capLevel: number;
  faucetLevel: number;
  spinYieldLevel: number;
  faucetMultLevel: number;
  autoSpinnerLevel: number; // 0 = none; each level = +0.5 spins/sec
  maxSpeedLevel: number;
  bambooYieldLevel: number;
  bambooSpeedLevel: number;
  // One-shot upgrades
  reservoirPressureBought: boolean;
  autoHarvesterBought: boolean;
  stage1Unlocked: boolean;
  // Stage 1 — Bamboo plots (multi)
  plots: Plot[];
  bambooHarvested: number;
  // Stage 2 — Greenhouse
  greenhouses: number;
  ghSlots: Slot[];
  heat: number;
  ventsLevel: number;
  thermostatBought: boolean;
  lotusUnlocked: boolean;
  reedsUnlocked: boolean;
  mangroveUnlocked: boolean;
  saguaroUnlocked: boolean;
  stage2Unlocked: boolean;
  // Stage 3 — Aqueducts
  aqueducts: number;
  aqueductIntegrity: number[]; // 0..1 per aqueduct
  aqueductDurabilityLevel: number;
  pressure: number;
  pressureCapLevel: number;
  pressureValveBought: boolean;
  stage3Unlocked: boolean;
  // Stage 4 — Settlement
  population: number;
  popCapLevel: number;
  food: number;
  granaryLevel: number;
  labor: number;
  schoolBought: boolean;
  stage4Unlocked: boolean;
  // Stage 5 — Industry
  steam: number;
  coal: number;
  boilers: number;
  turbines: number;
  pollution: number;
  electrolysisBought: boolean;
  stage5Unlocked: boolean;
  // Stage 6 — Aquifer
  depth: number; // meters
  drilling: boolean;
  drillSpeedLevel: number;
  supportBeamsLevel: number;
  minerals: number;
  geothermalTapBought: boolean;
  stage6Unlocked: boolean;
  // Stage 7 — Atmosphere
  vapor: number;
  clouds: number;
  lightning: number;
  cloudSeeders: number;
  weatherSatelliteBought: boolean;
  lightningCapacitorBought: boolean;
  stage7Unlocked: boolean;
  // Stage 8 — Hydrosphere
  hydroentropy: number;
  cycleMult: number; // PRESERVED across cycle ascensions
  ascended: number; // count of cycle ascensions
  stage8Unlocked: boolean;
  // Research — currency + 16 repeatable level fields + 5 keystone one-shots.
  // RP accrues from Stage 1 onward; resets on ascendCycle (intra-cycle layer).
  researchPoints: number;
  researchGrowthLevel: number;
  researchSpinYieldLevel: number;
  researchHeatVentLevel: number;
  researchPassiveCropLevel: number;
  researchAqueductDecayLevel: number;
  researchPressureCapLevel: number;
  researchLaborMultLevel: number;
  researchPopGrowthLevel: number;
  researchTurbineMultLevel: number;
  researchPollutionDecayLevel: number;
  researchDrillSpeedLevel: number;
  researchAquiferYieldLevel: number;
  researchCloudBonusLevel: number;
  researchLightningRateLevel: number;
  researchHydroentropyRateLevel: number;
  researchThroughputLevel: number;
  libraryBought: boolean;
  steamPressBought: boolean;
  crystalLatticeBought: boolean;
  skyArchiveBought: boolean;
  aethericMemoryBought: boolean;
  // Stats
  totalWater: number;
  totalSpins: number;
  // Event log (most-recent first, capped)
  logs: LogEntry[];
};

export type LogEntry = {
  msg: string;
  ts: number; // ms
};

export const LOG_CAP = 6;

// Wheel physics — purely visual, lives in component state.
export const MAX_SPIN_SPEED = 1080; // deg/sec (~3 revs/sec)
export const SPIN_CLICK_BOOST = 540; // deg/sec added per click — meaty kick
export const SPIN_DECAY = 1200; // deg/sec/sec linear decay — snappy spin-down

export const SPIN_GAIN_BASE = 0.1;
export const SPIN_YIELD_INC = 0.15;
export const FAUCET_INC = 0.15;
export const FAUCET_MULT_INC = 0.30;
export const CAP_INC = 10;
export const STAGE1_CAP_THRESHOLD = 20;
export const SALT_BYPRODUCT_RATIO = 0.04;
export const BAMBOO_GROW_BASE = 8;
export const BAMBOO_BASE_YIELD = 0.015;
// Yield/Fertilizer apply to ALL crops (harvest rate, passive output, growth speed).
export const YIELD_MULT_PER_LEVEL = 0.25; // +25% to all crop output per level
export const BAMBOO_SPEED_FACTOR = 0.30; // +30% growth speed per level (all crops)
export const BAMBOO_PLANT_COST = 3;

// Stage 2 — Greenhouse constants.
export const SLOTS_PER_GREENHOUSE = 3;
export const HEAT_PER_PLANT_SEC = 0.35;
export const VENT_RATE_PER_LEVEL = 0.7;
export const HEAT_DECAY_BASE = 0.15; // ambient passive cooling
export const HEAT_GROWTH_THRESHOLD = 75; // > this halves growth speed
export const HEAT_WITHER_THRESHOLD = 100; // crop withers at >= this

// Stage 3 — Aqueducts.
export const AQUEDUCT_AMP = 0.10; // each aqueduct: ×(1 + 0.10 × integrity)
export const AQUEDUCT_DECAY_BASE = 0.008; // integrity lost / sec
export const PRESSURE_BASE_MAX = 100;
export const PRESSURE_CAP_PER_LEVEL = 50;
export const PRESSURE_BUILD_BASE = 0.4; // per sec passive
export const PRESSURE_BUILD_PER_RATE = 0.6; // scales with faucetRate
export const PRESSURE_BURST_MULT_BASE = 1.0;
export const PRESSURE_BURST_MULT_VALVE = 2.5;

// Stage 4 — Settlement.
export const BASE_POP_CAP = 10;
export const POP_CAP_PER_LEVEL = 5;
export const POP_GROWTH_RATE = 0.4; // per sec, modulated by gap and surplus
export const POP_WATER_NEED = 0.04; // per pop per sec
export const POP_FOOD_NEED = 0.02;
export const POP_DECAY_RATE = 0.6; // pop lost / sec when starving
export const LABOR_PER_POP = 1;
export const SCHOOL_LABOR_MULT = 2;
export const BASE_FOOD_CAP = 20;
export const FOOD_CAP_PER_GRANARY = 30;
export const FOOD_PER_PLANTED_SLOT = 0.025; // per planted greenhouse slot per sec

// Stage 5 — Industry.
export const BOILER_WATER_PER_SEC = 0.5;
export const BOILER_COAL_PER_SEC = 0.05;
export const BOILER_STEAM_OUT_PER_SEC = 1.0;
export const TURBINE_MULT_PER = 0.05;
export const POLLUTION_PER_BOILER = 0.4; // per sec when burning coal
export const POLLUTION_DECAY = 0.15; // per sec
export const POLLUTION_MAX = 100;
export const POLLUTION_RATE_PENALTY_MAX = 0.5; // worst-case rate cut (×0.5)
export const COAL_TRADE_WATER = 10; // 10 water → 1 coal (Stage 5 market)

// Stage 6 — Aquifer.
export const DRILL_BASE_SPEED = 1.0; // m/s
export const DRILL_SPEED_PER_LEVEL = 0.6;
export const AQUIFER_DEPTH = 300; // m — water bonus starts here
export const AQUIFER_BONUS_PER_M = 0.0025;
export const MAGMA_DEPTH = 800;
export const MINERAL_RATE_FACTOR = 0.0008; // per m per sec while drilling
export const CAVE_IN_REF_DEPTH = 1000; // baseline depth for cave-in math
export const CAVE_IN_BASE_PROB = 0.0009; // per sec at ref depth, 0 supports
export const CAVE_IN_LOSS = 0.12;
export const SALT_PER_MINERAL = 10;
export const GEOTHERMAL_BONUS = 0.5; // +50% all rates when active

// Stage 7 — Atmosphere.
export const SEEDER_WATER_PER_SEC = 0.3;
export const SEEDER_STEAM_PER_SEC = 0.1;
export const SEEDER_VAPOR_PER_SEC = 0.4;
export const VAPOR_PER_CLOUD = 50;
export const CLOUD_FAUCET_BONUS = 0.06; // each cloud → +0.06 u/s base
export const LIGHTNING_BASE_RATE = 0.001; // per cloud per sec
export const LIGHTNING_CAP_MULT = 3; // capacitor multiplier

// Stage 8 — Hydrosphere.
export const HYDROENTROPY_RATE = 0.05; // hydroentropy per (effective u/s) per sec
export const HYDROENTROPY_TARGET = 1e6; // ascension unlock threshold
export const CYCLE_MULT_INC = 0.5; // each cycle ascension adds +50% to all rates

// === Research ===
// Base passive RP/sec by stage (index = stage). 0 at S0; ramps with progression.
export const RP_BASE_PER_STAGE = [0, 0.04, 0.07, 0.11, 0.16, 0.22, 0.30, 0.40, 0.55] as const;
// Keystone one-shot RP/s contributions.
export const RP_KEYSTONE_LIBRARY = 0.05;
export const RP_KEYSTONE_STEAM_PRESS = 0.15;
export const RP_KEYSTONE_CRYSTAL_LATTICE = 0.40;
export const RP_KEYSTONE_SKY_ARCHIVE = 1.0;
export const RP_KEYSTONE_AETHERIC_MEMORY = 3.0;
// Repeatable RP-cost helper: ceil(base × mult^level).
export const researchCost = (base: number, mult: number, level: number) =>
  Math.ceil(base * Math.pow(mult, level));

// Crop catalog. Keep in lockstep with `CropType` so all crop branches are typed.
export const CROPS: Record<CropType, CropDef> = {
  bamboo: {
    id: "bamboo",
    name: "Bamboo",
    plantCost: 3,
    growTime: 8,
    harvestFaucetRate: 0.015,
    harvestSeeds: 1,
    heatPerSec: 0.30,
    unlocked: () => true,
  },
  lotus: {
    id: "lotus",
    name: "Lotus",
    plantCost: 8,
    growTime: 0,
    passiveWater: 0.10,
    heatPerSec: 0.10,
    unlocked: (s) => s.lotusUnlocked,
  },
  reeds: {
    id: "reeds",
    name: "Reeds",
    plantCost: 6,
    growTime: 0,
    passiveSalt: 0.10,
    heatPerSec: 0.20,
    unlocked: (s) => s.reedsUnlocked,
  },
  mangrove: {
    id: "mangrove",
    name: "Mangrove",
    plantCost: 18,
    growTime: 30,
    harvestFaucetRate: 0.30,
    heatPerSec: 0.45,
    unlocked: (s) => s.mangroveUnlocked,
  },
  saguaro: {
    id: "saguaro",
    name: "Saguaro",
    plantCost: 12,
    growTime: 45,
    harvestFaucetRate: 0.05,
    harvestSeeds: 4,
    heatPerSec: 0.05,
    unlocked: (s) => s.saguaroUnlocked,
  },
};

export const initialState: State = {
  stage: 0,
  water: 0,
  capacity: 10,
  salt: 0,
  seeds: 0,
  faucetRate: 0,
  capLevel: 0,
  faucetLevel: 0,
  spinYieldLevel: 0,
  faucetMultLevel: 0,
  autoSpinnerLevel: 0,
  maxSpeedLevel: 0,
  bambooYieldLevel: 0,
  bambooSpeedLevel: 0,
  reservoirPressureBought: false,
  autoHarvesterBought: false,
  stage1Unlocked: false,
  plots: [{ planted: false, progress: 0, ready: false }],
  bambooHarvested: 0,
  greenhouses: 0,
  ghSlots: [],
  heat: 0,
  ventsLevel: 0,
  thermostatBought: false,
  lotusUnlocked: false,
  reedsUnlocked: false,
  mangroveUnlocked: false,
  saguaroUnlocked: false,
  stage2Unlocked: false,
  aqueducts: 0,
  aqueductIntegrity: [],
  aqueductDurabilityLevel: 0,
  pressure: 0,
  pressureCapLevel: 0,
  pressureValveBought: false,
  stage3Unlocked: false,
  population: 0,
  popCapLevel: 0,
  food: 0,
  granaryLevel: 0,
  labor: 0,
  schoolBought: false,
  stage4Unlocked: false,
  steam: 0,
  coal: 0,
  boilers: 0,
  turbines: 0,
  pollution: 0,
  electrolysisBought: false,
  stage5Unlocked: false,
  depth: 0,
  drilling: false,
  drillSpeedLevel: 0,
  supportBeamsLevel: 0,
  minerals: 0,
  geothermalTapBought: false,
  stage6Unlocked: false,
  vapor: 0,
  clouds: 0,
  lightning: 0,
  cloudSeeders: 0,
  weatherSatelliteBought: false,
  lightningCapacitorBought: false,
  stage7Unlocked: false,
  hydroentropy: 0,
  cycleMult: 0,
  ascended: 0,
  stage8Unlocked: false,
  researchPoints: 0,
  researchGrowthLevel: 0,
  researchSpinYieldLevel: 0,
  researchHeatVentLevel: 0,
  researchPassiveCropLevel: 0,
  researchAqueductDecayLevel: 0,
  researchPressureCapLevel: 0,
  researchLaborMultLevel: 0,
  researchPopGrowthLevel: 0,
  researchTurbineMultLevel: 0,
  researchPollutionDecayLevel: 0,
  researchDrillSpeedLevel: 0,
  researchAquiferYieldLevel: 0,
  researchCloudBonusLevel: 0,
  researchLightningRateLevel: 0,
  researchHydroentropyRateLevel: 0,
  researchThroughputLevel: 0,
  libraryBought: false,
  steamPressBought: false,
  crystalLatticeBought: false,
  skyArchiveBought: false,
  aethericMemoryBought: false,
  totalWater: 0,
  totalSpins: 0,
  logs: [],
};

const pushLog = (logs: LogEntry[], msg: string): LogEntry[] => {
  const next = [{ msg, ts: Date.now() }, ...logs];
  return next.slice(0, LOG_CAP);
};

// === Derived values ===
export const spinGain = (s: State) =>
  (SPIN_GAIN_BASE + s.spinYieldLevel * SPIN_YIELD_INC) *
  (1 + s.researchSpinYieldLevel * 0.15);

export const faucetMultiplier = (s: State) =>
  1 + s.faucetMultLevel * FAUCET_MULT_INC;

export const aqueductMultiplier = (s: State) => {
  if (s.aqueducts === 0) return 1;
  return s.aqueductIntegrity.reduce(
    (acc, integ) => acc * (1 + AQUEDUCT_AMP * integ),
    1,
  );
};

export const cycleMultiplier = (s: State) => 1 + s.cycleMult;

// Research-point passive accrual. Composes stage base + keystones, scales by
// the Stage-8 throughput repeatable, and inherits the cycle multiplier so
// post-ascension cycles ramp faster.
export const researchRate = (s: State) => {
  if (s.stage < 1) return 0;
  const stageBase = RP_BASE_PER_STAGE[s.stage] ?? 0;
  const keystones =
    (s.libraryBought ? RP_KEYSTONE_LIBRARY : 0) +
    (s.steamPressBought ? RP_KEYSTONE_STEAM_PRESS : 0) +
    (s.crystalLatticeBought ? RP_KEYSTONE_CRYSTAL_LATTICE : 0) +
    (s.skyArchiveBought ? RP_KEYSTONE_SKY_ARCHIVE : 0) +
    (s.aethericMemoryBought ? RP_KEYSTONE_AETHERIC_MEMORY : 0);
  return (
    (stageBase + keystones) *
    (1 + s.researchThroughputLevel * 0.10) *
    cycleMultiplier(s)
  );
};

export const effectiveFaucet = (s: State) =>
  (s.faucetRate + aquiferBonus(s) + cloudBonus(s)) *
  faucetMultiplier(s) *
  aqueductMultiplier(s) *
  turbineMultiplier(s) *
  geothermalMultiplier(s) *
  pollutionPenalty(s) *
  cycleMultiplier(s);

export const aqueductDecayPerSec = (s: State) =>
  (AQUEDUCT_DECAY_BASE / (1 + s.aqueductDurabilityLevel * 0.5)) *
  (s.weatherSatelliteBought ? 0.5 : 1) *
  Math.max(0.05, 1 - s.researchAqueductDecayLevel * 0.10);

export const maxPressure = (s: State) =>
  PRESSURE_BASE_MAX +
  s.pressureCapLevel * PRESSURE_CAP_PER_LEVEL +
  s.researchPressureCapLevel * 20;

export const pressureBurstMultiplier = (s: State) =>
  s.pressureValveBought ? PRESSURE_BURST_MULT_VALVE : PRESSURE_BURST_MULT_BASE;

export const popCap = (s: State) =>
  BASE_POP_CAP + s.popCapLevel * POP_CAP_PER_LEVEL;
export const foodCap = (s: State) =>
  BASE_FOOD_CAP + s.granaryLevel * FOOD_CAP_PER_GRANARY;
export const laborPerSec = (s: State) =>
  s.population *
  LABOR_PER_POP *
  (s.schoolBought ? SCHOOL_LABOR_MULT : 1) *
  (1 + s.researchLaborMultLevel * 0.10);

export const turbineMultiplier = (s: State) =>
  1 + s.turbines * (TURBINE_MULT_PER + s.researchTurbineMultLevel * 0.02);
export const pollutionPenalty = (s: State) => {
  const factor = s.pollution / POLLUTION_MAX;
  return 1 - factor * (1 - POLLUTION_RATE_PENALTY_MAX);
};

export const drillSpeed = (s: State) =>
  (DRILL_BASE_SPEED + s.drillSpeedLevel * DRILL_SPEED_PER_LEVEL) *
  (1 + s.researchDrillSpeedLevel * 0.20);
export const aquiferBonus = (s: State) =>
  Math.max(0, s.depth - AQUIFER_DEPTH) *
  AQUIFER_BONUS_PER_M *
  (1 + s.researchAquiferYieldLevel * 0.10);
export const geothermalMultiplier = (s: State) =>
  s.geothermalTapBought ? 1 + GEOTHERMAL_BONUS : 1;
export const caveInProbPerSec = (s: State) =>
  (CAVE_IN_BASE_PROB * (s.depth / CAVE_IN_REF_DEPTH)) /
  (1 + s.supportBeamsLevel * 1.5);
export const cloudBonus = (s: State) =>
  s.clouds * (CLOUD_FAUCET_BONUS + s.researchCloudBonusLevel * 0.01);
export const lightningPerSec = (s: State) =>
  s.clouds *
  LIGHTNING_BASE_RATE *
  (s.lightningCapacitorBought ? LIGHTNING_CAP_MULT : 1) *
  (1 + s.researchLightningRateLevel * 0.25);

export const layerName = (depth: number) => {
  if (depth < 50) return "Topsoil";
  if (depth < AQUIFER_DEPTH) return "Bedrock";
  if (depth < MAGMA_DEPTH) return "Aquifer";
  if (depth < 1500) return "Magma";
  return "Mantle";
};

// Auto-spinner provides a *baseline* rotational speed the wheel will not
// decay below. Each level = 0.5 revs/sec floor.
export const autoSpinRate = (s: State) =>
  s.autoSpinnerLevel * 0.5;
export const autoSpinBaselineDegPerSec = (s: State) =>
  s.autoSpinnerLevel * 0.5 * 360;

// Wheel max speed scales with bearings upgrade — each level +1 rev/sec.
export const maxSpinSpeed = (s: State) =>
  MAX_SPIN_SPEED + s.maxSpeedLevel * 360;

// Fertilizer (bambooSpeedLevel) accelerates every crop's grow time.
// Research "Crop Genetics" stacks multiplicatively on top.
export const growthMultiplier = (s: State) =>
  (1 + s.bambooSpeedLevel * BAMBOO_SPEED_FACTOR) *
  (1 + s.researchGrowthLevel * 0.05);
// Yield (bambooYieldLevel) scales every crop's harvest rate AND passive output.
// Research "Greenhouse Glassworks" stacks multiplicatively.
export const yieldMultiplier = (s: State) =>
  (1 + s.bambooYieldLevel * YIELD_MULT_PER_LEVEL) *
  (1 + s.researchPassiveCropLevel * 0.08);

export const bambooGrowTime = (s: State) =>
  BAMBOO_GROW_BASE / growthMultiplier(s);
export const bambooYield = (s: State) =>
  BAMBOO_BASE_YIELD * yieldMultiplier(s);

export const cropGrowTime = (s: State, crop: CropType): number =>
  CROPS[crop].growTime / growthMultiplier(s);
export const cropHarvestRate = (s: State, crop: CropType): number =>
  (CROPS[crop].harvestFaucetRate ?? 0) * yieldMultiplier(s);

// === Costs ===
export const capUpgradeCost = (cap: number) => Math.ceil(cap * 0.85);
export const faucetUpgradeCost = (level: number) =>
  Math.ceil(4 * Math.pow(1.45, level));
export const spinYieldCost = (level: number) =>
  Math.ceil(6 * Math.pow(1.85, level));
export const faucetMultCost = (level: number) =>
  Math.ceil(45 * Math.pow(2.6, level));
export const autoSpinnerCost = (level: number) =>
  Math.ceil(12 * Math.pow(2.3, level));
export const maxSpeedCost = (level: number) =>
  Math.ceil(16 * Math.pow(2.0, level));
export const bambooYieldCost = (level: number) =>
  Math.ceil(8 * Math.pow(1.6, level));
export const bambooSpeedCost = (level: number) =>
  Math.ceil(10 * Math.pow(1.55, level));

export type Action =
  | { type: "tick"; dt: number }
  | { type: "spin" }
  | { type: "buy"; id: string }
  | { type: "plantBamboo"; plotIdx: number }
  | { type: "harvestBamboo"; plotIdx: number }
  | { type: "plantAllBamboo" }
  | { type: "harvestAllBamboo" }
  | { type: "plantCrop"; slotIdx: number; crop: CropType }
  | { type: "harvestCrop"; slotIdx: number }
  | { type: "uprootCrop"; slotIdx: number }
  | { type: "harvestAllCrops" }
  | { type: "repairAqueducts" }
  | { type: "releasePressure" }
  | { type: "buyCoal"; amount: number }
  | { type: "toggleDrill" }
  | { type: "convertSalt"; salt: number }
  | { type: "ascendCycle" }
  | { type: "reset" }
  | { type: "load"; state: State };

const round = (n: number, d = 4) => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "tick": {
      const dt = a.dt;
      const gen = effectiveFaucet(s) * dt;
      let water = s.water + gen;
      let totalWater = s.totalWater + gen;
      let salt = s.salt + gen * SALT_BYPRODUCT_RATIO;

      water = Math.max(0, Math.min(s.capacity, water));

      // Bamboo growth — iterate every plot independently
      let bambooHarvested = s.bambooHarvested;
      let faucetRate = s.faucetRate;
      let seeds = s.seeds;
      let plotsChanged = false;
      const growT = bambooGrowTime(s);
      const yieldPerHarvest = bambooYield(s);

      const nextPlots = s.plots.map((p) => {
        if (s.stage < 1 || !p.planted) return p;
        if (p.ready) {
          // auto-harvest if engaged
          if (s.autoHarvesterBought) {
            faucetRate = round(faucetRate + yieldPerHarvest, 3);
            bambooHarvested += 1;
            seeds += 1;
            plotsChanged = true;
            return { planted: true, progress: 0, ready: false };
          }
          return p;
        }
        const progress = p.progress + dt / growT;
        if (progress >= 1) {
          plotsChanged = true;
          return { planted: true, progress: 1, ready: true };
        }
        plotsChanged = true;
        return { ...p, progress };
      });

      // Stage 2 — Greenhouse slots + heat
      let heat = s.heat;
      let ghChanged = false;
      const heatPenalty = heat >= HEAT_GROWTH_THRESHOLD ? 0.5 : 1;

      const nextGhSlots = s.ghSlots.map((sl) => {
        if (!sl.crop) return sl;
        const def = CROPS[sl.crop];
        // Wither if too hot
        if (heat >= HEAT_WITHER_THRESHOLD) {
          ghChanged = true;
          return { crop: null, progress: 0, ready: false };
        }
        // Passive crops: produce while planted, no progress.
        if (def.growTime === 0) {
          const yMult = yieldMultiplier(s);
          if (def.passiveWater) {
            const out = def.passiveWater * yMult * dt * heatPenalty;
            water += out;
            totalWater += out;
          }
          if (def.passiveSalt) {
            salt += def.passiveSalt * yMult * dt * heatPenalty;
          }
          return sl;
        }
        // Harvest crops: advance growth or auto-harvest if ready.
        if (sl.ready) {
          if (s.autoHarvesterBought) {
            faucetRate = round(faucetRate + cropHarvestRate(s, sl.crop), 3);
            seeds += def.harvestSeeds ?? 0;
            if (sl.crop === "bamboo") bambooHarvested += 1;
            ghChanged = true;
            return { crop: sl.crop, progress: 0, ready: false };
          }
          return sl;
        }
        const progress =
          sl.progress + (dt / cropGrowTime(s, sl.crop)) * heatPenalty;
        if (progress >= 1) {
          ghChanged = true;
          return { ...sl, progress: 1, ready: true };
        }
        ghChanged = true;
        return { ...sl, progress };
      });

      // Heat dynamics
      const heatGen = nextGhSlots.reduce((acc, sl) => {
        if (!sl.crop) return acc;
        return acc + (CROPS[sl.crop].heatPerSec ?? HEAT_PER_PLANT_SEC);
      }, 0);
      const researchVentMult = 1 + s.researchHeatVentLevel * 0.15;
      const ventEffect = s.thermostatBought
        ? // thermostat auto-tunes vents to keep heat near 60
          (HEAT_DECAY_BASE + (s.ventsLevel + 2) * VENT_RATE_PER_LEVEL) * researchVentMult
        : (HEAT_DECAY_BASE + s.ventsLevel * VENT_RATE_PER_LEVEL) * researchVentMult;
      heat = Math.max(0, heat + (heatGen - ventEffect) * dt);
      // Soft cap visual at 110 to leave room for wither indicator
      heat = Math.min(110, heat);

      // Cap water once more after passive crops added some
      water = Math.max(0, Math.min(s.capacity, water));

      // Stage 3 — Aqueduct integrity decay
      let aqueductIntegrity = s.aqueductIntegrity;
      if (s.aqueducts > 0) {
        const decay = aqueductDecayPerSec(s) * dt;
        let aqChanged = false;
        const next = s.aqueductIntegrity.map((iv) => {
          const v = Math.max(0, iv - decay);
          if (v !== iv) aqChanged = true;
          return v;
        });
        if (aqChanged) aqueductIntegrity = next;
      }

      // Stage 3 — Pressure buildup. Builds while faucet is active.
      let pressure = s.pressure;
      if (s.stage >= 3 && s.faucetRate > 0) {
        const build =
          (PRESSURE_BUILD_BASE + PRESSURE_BUILD_PER_RATE * s.faucetRate) * dt;
        pressure = Math.min(maxPressure(s), pressure + build);
      }

      // Stage 4 — Population, food, labor.
      let population = s.population;
      let food = s.food;
      let labor = s.labor;
      if (s.stage >= 4) {
        // Food generated by planted greenhouse slots (re-use loop result).
        const plantedSlots = nextGhSlots.reduce(
          (n, sl) => n + (sl.crop ? 1 : 0),
          0,
        );
        food = Math.min(
          foodCap(s),
          food + plantedSlots * FOOD_PER_PLANTED_SLOT * dt,
        );

        const cap = popCap(s);
        const waterNeed = population * POP_WATER_NEED * dt;
        const foodNeed = population * POP_FOOD_NEED * dt;
        const fed = food >= foodNeed && water >= waterNeed;
        if (fed) {
          water -= waterNeed;
          food -= foodNeed;
          // Logistic growth, faster when far from cap.
          const gap = Math.max(0, cap - population);
          const popGrowMult = 1 + s.researchPopGrowthLevel * 0.15;
          population +=
            POP_GROWTH_RATE * popGrowMult * (gap / Math.max(1, cap)) * dt;
          population = Math.min(cap, population);
        } else {
          population = Math.max(0, population - POP_DECAY_RATE * dt);
        }
        labor = labor + laborPerSec(s) * dt;
      }

      // Stage 5 — Industry: boilers consume water + coal, produce steam.
      let steam = s.steam;
      let coal = s.coal;
      let pollution = s.pollution;
      if (s.stage >= 5 && s.boilers > 0) {
        const waterDemand = s.boilers * BOILER_WATER_PER_SEC * dt;
        const coalDemand = s.electrolysisBought
          ? 0
          : s.boilers * BOILER_COAL_PER_SEC * dt;
        // Operate as many boilers as can be supplied — fractional ok.
        const supplyRatio = Math.min(
          1,
          waterDemand > 0 ? water / Math.max(1e-9, waterDemand) : 1,
          coalDemand > 0 ? coal / Math.max(1e-9, coalDemand) : 1,
        );
        const useWater = waterDemand * supplyRatio;
        const useCoal = coalDemand * supplyRatio;
        water -= useWater;
        coal -= useCoal;
        steam += s.boilers * BOILER_STEAM_OUT_PER_SEC * dt * supplyRatio;
        if (!s.electrolysisBought) {
          pollution += s.boilers * POLLUTION_PER_BOILER * dt * supplyRatio;
        }
      }
      pollution = Math.max(
        0,
        pollution -
          POLLUTION_DECAY * (1 + s.researchPollutionDecayLevel * 0.15) * dt,
      );
      pollution = Math.min(POLLUTION_MAX, pollution);

      // Stage 7 — Atmosphere: cloud seeders, vapor, clouds, lightning
      let vapor = s.vapor;
      let clouds = s.clouds;
      let lightning = s.lightning;
      if (s.stage >= 7 && s.cloudSeeders > 0) {
        const wDemand = s.cloudSeeders * SEEDER_WATER_PER_SEC * dt;
        const sDemand = s.cloudSeeders * SEEDER_STEAM_PER_SEC * dt;
        const supply = Math.min(
          1,
          wDemand > 0 ? water / Math.max(1e-9, wDemand) : 1,
          sDemand > 0 ? steam / Math.max(1e-9, sDemand) : 1,
        );
        water -= wDemand * supply;
        steam -= sDemand * supply;
        vapor += s.cloudSeeders * SEEDER_VAPOR_PER_SEC * dt * supply;
      }
      // Vapor → Clouds at the threshold
      if (vapor >= VAPOR_PER_CLOUD) {
        const newClouds = Math.floor(vapor / VAPOR_PER_CLOUD);
        clouds += newClouds;
        vapor -= newClouds * VAPOR_PER_CLOUD;
      }
      // Lightning accumulates passively from clouds
      if (s.stage >= 7 && clouds > 0) {
        lightning += lightningPerSec(s) * dt;
      }

      // Stage 8 — Hydroentropy accumulates from total throughput
      let hydroentropy = s.hydroentropy;
      if (s.stage >= 8) {
        hydroentropy +=
          effectiveFaucet(s) *
          HYDROENTROPY_RATE *
          (1 + s.researchHydroentropyRateLevel * 0.10) *
          dt;
      }

      // Research — accrue RP from Stage 1 onward. Composed in researchRate().
      let researchPoints = s.researchPoints;
      if (s.stage >= 1) {
        researchPoints += researchRate(s) * dt;
      }

      // Stage 6 — Drilling, minerals, cave-ins
      let depth = s.depth;
      let minerals = s.minerals;
      let logs = s.logs;
      if (s.stage >= 6 && s.drilling) {
        depth += drillSpeed(s) * dt;
        minerals += depth * MINERAL_RATE_FACTOR * dt;
        // Roll for cave-in.
        if (depth > 50) {
          const p = caveInProbPerSec(s) * dt;
          if (Math.random() < p) {
            const lost = depth * CAVE_IN_LOSS;
            depth -= lost;
            logs = pushLog(logs, `⚠ CAVE-IN — lost ${lost.toFixed(0)}m`);
          }
        }
      }

      return {
        ...s,
        water: round(water),
        totalWater: round(totalWater),
        salt: round(salt),
        seeds,
        bambooHarvested,
        faucetRate,
        plots: plotsChanged ? nextPlots : s.plots,
        ghSlots: ghChanged ? nextGhSlots : s.ghSlots,
        heat: round(heat, 2),
        aqueductIntegrity,
        pressure: round(pressure, 2),
        population: round(population, 3),
        food: round(food, 3),
        labor: round(labor, 2),
        steam: round(steam, 2),
        coal: round(coal, 2),
        pollution: round(pollution, 2),
        depth: round(depth, 1),
        minerals: round(minerals, 2),
        vapor: round(vapor, 2),
        clouds: round(clouds, 0),
        lightning: round(lightning, 3),
        hydroentropy: round(hydroentropy, 2),
        researchPoints: round(researchPoints, 3),
        logs,
      };
    }

    case "spin": {
      const g = spinGain(s);
      const water = Math.min(s.capacity, s.water + g);
      const gained = water - s.water;
      return {
        ...s,
        water: round(water),
        totalWater: round(s.totalWater + gained),
        totalSpins: s.totalSpins + 1,
      };
    }

    case "buy": {
      const u = upgrades.find((x) => x.id === a.id);
      if (!u || !u.available(s)) return s;
      const cost = u.cost(s);
      if ((cost.water ?? 0) > s.water) return s;
      if ((cost.salt ?? 0) > s.salt) return s;
      if ((cost.seeds ?? 0) > s.seeds) return s;
      if ((cost.labor ?? 0) > s.labor) return s;
      if ((cost.steam ?? 0) > s.steam) return s;
      if ((cost.coal ?? 0) > s.coal) return s;
      if ((cost.minerals ?? 0) > s.minerals) return s;
      if ((cost.lightning ?? 0) > s.lightning) return s;
      if ((cost.research ?? 0) > s.researchPoints) return s;
      const lvl = u.level?.(s);
      const isOneShot = !!u.done;
      const logMsg = isOneShot
        ? `INSTALLED: ${u.name}`
        : `UPGRADE: ${u.name}${lvl !== undefined ? ` → Lv ${lvl + 1}` : ""}`;
      return {
        ...s,
        water: round(s.water - (cost.water ?? 0)),
        salt: round(s.salt - (cost.salt ?? 0)),
        seeds: s.seeds - (cost.seeds ?? 0),
        labor: round(s.labor - (cost.labor ?? 0)),
        steam: round(s.steam - (cost.steam ?? 0)),
        coal: round(s.coal - (cost.coal ?? 0)),
        minerals: round(s.minerals - (cost.minerals ?? 0)),
        lightning: round(s.lightning - (cost.lightning ?? 0)),
        researchPoints: round(s.researchPoints - (cost.research ?? 0)),
        logs: pushLog(s.logs, logMsg),
        ...u.effect(s),
      };
    }

    case "plantBamboo": {
      const p = s.plots[a.plotIdx];
      if (!p || p.planted) return s;
      if (s.water < BAMBOO_PLANT_COST) return s;
      const next = s.plots.slice();
      next[a.plotIdx] = { planted: true, progress: 0, ready: false };
      return {
        ...s,
        water: round(s.water - BAMBOO_PLANT_COST),
        plots: next,
      };
    }

    case "harvestBamboo": {
      const p = s.plots[a.plotIdx];
      if (!p || !p.ready) return s;
      const y = bambooYield(s);
      const next = s.plots.slice();
      next[a.plotIdx] = { planted: true, progress: 0, ready: false };
      return {
        ...s,
        plots: next,
        bambooHarvested: s.bambooHarvested + 1,
        seeds: s.seeds + 1,
        faucetRate: round(s.faucetRate + y, 3),
      };
    }

    case "plantAllBamboo": {
      let water = s.water;
      const next = s.plots.map((p) => {
        if (!p.planted && water >= BAMBOO_PLANT_COST) {
          water -= BAMBOO_PLANT_COST;
          return { planted: true, progress: 0, ready: false };
        }
        return p;
      });
      return { ...s, water: round(water), plots: next };
    }

    case "plantCrop": {
      const sl = s.ghSlots[a.slotIdx];
      if (!sl || sl.crop) return s;
      const def = CROPS[a.crop];
      if (!def.unlocked(s)) return s;
      if (s.water < def.plantCost) return s;
      const next = s.ghSlots.slice();
      next[a.slotIdx] = { crop: a.crop, progress: 0, ready: false };
      return {
        ...s,
        water: round(s.water - def.plantCost),
        ghSlots: next,
      };
    }

    case "harvestCrop": {
      const sl = s.ghSlots[a.slotIdx];
      if (!sl || !sl.crop || !sl.ready) return s;
      const def = CROPS[sl.crop];
      const next = s.ghSlots.slice();
      // Auto-replant: keep the same crop type, reset progress.
      next[a.slotIdx] = { crop: sl.crop, progress: 0, ready: false };
      const rate = cropHarvestRate(s, sl.crop);
      return {
        ...s,
        ghSlots: next,
        faucetRate: rate > 0 ? round(s.faucetRate + rate, 3) : s.faucetRate,
        seeds: s.seeds + (def.harvestSeeds ?? 0),
        bambooHarvested:
          sl.crop === "bamboo" ? s.bambooHarvested + 1 : s.bambooHarvested,
      };
    }

    case "uprootCrop": {
      const sl = s.ghSlots[a.slotIdx];
      if (!sl || !sl.crop) return s;
      const next = s.ghSlots.slice();
      next[a.slotIdx] = { crop: null, progress: 0, ready: false };
      return { ...s, ghSlots: next };
    }

    case "harvestAllCrops": {
      let faucetRate = s.faucetRate;
      let seeds = s.seeds;
      let bambooHarvested = s.bambooHarvested;
      let any = false;
      const next = s.ghSlots.map((sl) => {
        if (!sl.crop || !sl.ready) return sl;
        const def = CROPS[sl.crop];
        const rate = cropHarvestRate(s, sl.crop);
        if (rate > 0) faucetRate = round(faucetRate + rate, 3);
        seeds += def.harvestSeeds ?? 0;
        if (sl.crop === "bamboo") bambooHarvested += 1;
        any = true;
        return { crop: sl.crop, progress: 0, ready: false };
      });
      if (!any) return s;
      return { ...s, ghSlots: next, faucetRate, seeds, bambooHarvested };
    }

    case "harvestAllBamboo": {
      const y = bambooYield(s);
      let added = 0;
      const next = s.plots.map((p) => {
        if (p.ready) {
          added += 1;
          return { planted: true, progress: 0, ready: false };
        }
        return p;
      });
      if (added === 0) return s;
      return {
        ...s,
        plots: next,
        bambooHarvested: s.bambooHarvested + added,
        seeds: s.seeds + added,
        faucetRate: round(s.faucetRate + y * added, 3),
      };
    }

    case "repairAqueducts": {
      if (s.aqueducts === 0) return s;
      // Cost: 5 water per aqueduct per missing 100% integrity.
      const totalMissing = s.aqueductIntegrity.reduce(
        (acc, iv) => acc + (1 - iv),
        0,
      );
      const cost = Math.ceil(totalMissing * 5);
      if (s.water < cost) return s;
      return {
        ...s,
        water: round(s.water - cost),
        aqueductIntegrity: s.aqueductIntegrity.map(() => 1),
      };
    }

    case "buyCoal": {
      const cost = a.amount * COAL_TRADE_WATER;
      if (s.water < cost) return s;
      return {
        ...s,
        water: round(s.water - cost),
        coal: round(s.coal + a.amount),
      };
    }

    case "toggleDrill":
      return { ...s, drilling: !s.drilling };

    case "convertSalt": {
      if (s.salt < a.salt) return s;
      const minerals = Math.floor(a.salt / SALT_PER_MINERAL);
      if (minerals < 1) return s;
      const used = minerals * SALT_PER_MINERAL;
      return {
        ...s,
        salt: round(s.salt - used),
        minerals: round(s.minerals + minerals),
      };
    }

    case "ascendCycle": {
      if (s.hydroentropy < HYDROENTROPY_TARGET) return s;
      // Reset to Stage 0 but keep cycleMult and ascended counter.
      const preservedCycleMult = s.cycleMult + CYCLE_MULT_INC;
      const preservedAscended = s.ascended + 1;
      const preservedLogs = pushLog(
        s.logs,
        `◆ ASCENSION ×${preservedAscended} — cycle bonus +${(CYCLE_MULT_INC * 100).toFixed(0)}%`,
      );
      return {
        ...initialState,
        cycleMult: preservedCycleMult,
        ascended: preservedAscended,
        logs: preservedLogs,
      };
    }

    case "releasePressure": {
      if (!s.pressureValveBought) return s;
      if (s.pressure <= 0) return s;
      const burst = s.pressure * pressureBurstMultiplier(s);
      const water = Math.min(s.capacity, s.water + burst);
      const gained = water - s.water;
      return {
        ...s,
        water: round(water),
        totalWater: round(s.totalWater + gained),
        pressure: 0,
      };
    }

    case "reset":
      return initialState;
    case "load":
      return { ...initialState, ...a.state };
  }
}

export const fmt = (n: number, d = 2) => {
  if (typeof n !== "number" || !isFinite(n)) return "0";
  if (Math.abs(n) >= 10000) return n.toFixed(0);
  return n.toFixed(d);
};

export const pad = (n: number, d = 2, w = 6) => {
  const s = fmt(n, d);
  return s.padStart(w, " ");
};

// === Upgrade tree ===
export type Upgrade = {
  id: string;
  name: string;
  desc: (s: State) => string;
  cost: (s: State) => {
    water?: number;
    salt?: number;
    seeds?: number;
    labor?: number;
    steam?: number;
    coal?: number;
    minerals?: number;
    lightning?: number;
    research?: number;
  };
  effect: (s: State) => Partial<State>;
  visible: (s: State) => boolean;
  available: (s: State) => boolean;
  done?: (s: State) => boolean; // one-shot: true = no longer purchasable / hidden after buy
  level?: (s: State) => number;
  group:
    | "storage"
    | "manual"
    | "automation"
    | "bamboo"
    | "greenhouse"
    | "aqueduct"
    | "settlement"
    | "industry"
    | "aquifer"
    | "atmosphere"
    | "research"
    | "milestone";
};

export const upgrades: Upgrade[] = [
  // ---------- Storage ----------
  {
    id: "cap",
    name: "Reservoir Capacity",
    desc: () => `+${CAP_INC} max water storage`,
    cost: (s) => ({ water: capUpgradeCost(s.capacity) }),
    effect: (s) => ({
      capacity: s.capacity + CAP_INC,
      capLevel: s.capLevel + 1,
    }),
    visible: () => true,
    available: (s) => s.water >= capUpgradeCost(s.capacity),
    level: (s) => s.capLevel,
    group: "storage",
  },
  {
    id: "reservoirPressure",
    name: "Reservoir Pressure",
    desc: () => `+25 capacity, +0.5 u/s base faucet rate (one-shot)`,
    cost: () => ({ water: 80 }),
    effect: (s) => ({
      capacity: s.capacity + 25,
      faucetRate: round(s.faucetRate + 0.5, 3),
      reservoirPressureBought: true,
    }),
    visible: (s) => s.capacity >= 20,
    available: (s) => !s.reservoirPressureBought && s.water >= 80,
    done: (s) => s.reservoirPressureBought,
    group: "storage",
  },

  // ---------- Manual ----------
  {
    id: "spinYield",
    name: "Spin Yield",
    desc: (s) =>
      `each spin: ${fmt(spinGain(s), 2)} → ${fmt(spinGain(s) + SPIN_YIELD_INC, 2)} water`,
    cost: (s) => ({ water: spinYieldCost(s.spinYieldLevel) }),
    effect: (s) => ({ spinYieldLevel: s.spinYieldLevel + 1 }),
    visible: () => true,
    available: (s) => s.water >= spinYieldCost(s.spinYieldLevel),
    level: (s) => s.spinYieldLevel,
    group: "manual",
  },

  // ---------- Automation ----------
  {
    id: "faucet",
    name: "Faucet Bore",
    desc: (s) =>
      `+${FAUCET_INC.toFixed(2)} u/s base rate (current: ${fmt(s.faucetRate, 2)})`,
    cost: (s) => ({ water: faucetUpgradeCost(s.faucetLevel) }),
    effect: (s) => ({
      faucetRate: round(s.faucetRate + FAUCET_INC, 3),
      faucetLevel: s.faucetLevel + 1,
    }),
    visible: () => true,
    available: (s) => s.water >= faucetUpgradeCost(s.faucetLevel),
    level: (s) => s.faucetLevel,
    group: "automation",
  },
  {
    id: "faucetMult",
    name: "Pressure Regulator",
    desc: (s) =>
      `faucet ×${faucetMultiplier(s).toFixed(2)} → ×${(faucetMultiplier(s) + FAUCET_MULT_INC).toFixed(2)}`,
    cost: (s) => ({ water: faucetMultCost(s.faucetMultLevel) }),
    effect: (s) => ({ faucetMultLevel: s.faucetMultLevel + 1 }),
    visible: (s) => s.faucetLevel >= 3,
    available: (s) => s.water >= faucetMultCost(s.faucetMultLevel),
    level: (s) => s.faucetMultLevel,
    group: "automation",
  },
  {
    id: "maxSpeed",
    name: "Wheel Bearings",
    desc: (s) =>
      `max wheel speed: ${(maxSpinSpeed(s) / 360).toFixed(1)} → ${((maxSpinSpeed(s) + 360) / 360).toFixed(1)} rev/s`,
    cost: (s) => ({ water: maxSpeedCost(s.maxSpeedLevel) }),
    effect: (s) => ({ maxSpeedLevel: s.maxSpeedLevel + 1 }),
    visible: (s) => s.totalSpins >= 10,
    available: (s) => s.water >= maxSpeedCost(s.maxSpeedLevel),
    level: (s) => s.maxSpeedLevel,
    group: "manual",
  },
  {
    id: "autoSpinner",
    name: "Auto-Spinner",
    desc: (s) =>
      s.autoSpinnerLevel === 0
        ? "engages a motor on the wheel — 0.5 spins/sec"
        : `${fmt(autoSpinRate(s), 1)} → ${fmt(autoSpinRate(s) + 0.5, 1)} spins/sec`,
    cost: (s) => ({ water: autoSpinnerCost(s.autoSpinnerLevel) }),
    effect: (s) => ({ autoSpinnerLevel: s.autoSpinnerLevel + 1 }),
    visible: (s) => s.totalSpins >= 25,
    available: (s) => s.water >= autoSpinnerCost(s.autoSpinnerLevel),
    level: (s) => s.autoSpinnerLevel,
    group: "automation",
  },

  // ---------- Bamboo (Stage 1) ----------
  {
    id: "bambooYield",
    name: "Crop Yield",
    desc: (s) =>
      `all crops output ×${fmt(yieldMultiplier(s), 2)} → ×${fmt(yieldMultiplier(s) + YIELD_MULT_PER_LEVEL, 2)} (harvest + passive)`,
    cost: (s) => ({ salt: bambooYieldCost(s.bambooYieldLevel) }),
    effect: (s) => ({ bambooYieldLevel: s.bambooYieldLevel + 1 }),
    visible: (s) => s.stage >= 1,
    available: (s) => s.salt >= bambooYieldCost(s.bambooYieldLevel),
    level: (s) => s.bambooYieldLevel,
    group: "bamboo",
  },
  {
    id: "bambooSpeed",
    name: "Fertilizer",
    desc: (s) =>
      `all crops grow ×${fmt(growthMultiplier(s), 2)} → ×${fmt(growthMultiplier(s) + BAMBOO_SPEED_FACTOR, 2)} faster`,
    cost: (s) => ({ salt: bambooSpeedCost(s.bambooSpeedLevel) }),
    effect: (s) => ({ bambooSpeedLevel: s.bambooSpeedLevel + 1 }),
    visible: (s) => s.stage >= 1,
    available: (s) => s.salt >= bambooSpeedCost(s.bambooSpeedLevel),
    level: (s) => s.bambooSpeedLevel,
    group: "bamboo",
  },
  {
    id: "bambooPlot",
    name: "Extra Bamboo Plot",
    desc: (s) => `+1 parallel plot (currently ${s.plots.length})`,
    cost: (s) => ({ seeds: 5 + (s.plots.length - 1) * 8 }),
    effect: (s) => ({
      plots: [...s.plots, { planted: false, progress: 0, ready: false }],
    }),
    visible: (s) => s.stage === 1 && s.seeds >= 3,
    available: (s) => s.seeds >= 5 + (s.plots.length - 1) * 8,
    level: (s) => s.plots.length - 1,
    group: "bamboo",
  },
  {
    id: "autoHarvester",
    name: "Auto-Harvester",
    desc: () => "auto-harvests and replants ready bamboo plots & greenhouse crops (one-shot)",
    cost: () => ({ salt: 30 }),
    effect: () => ({ autoHarvesterBought: true }),
    visible: (s) => s.stage >= 1 && s.bambooHarvested >= 5,
    available: (s) => !s.autoHarvesterBought && s.salt >= 30,
    done: (s) => s.autoHarvesterBought,
    group: "bamboo",
  },

  // ---------- Greenhouse (Stage 2) ----------
  {
    id: "greenhouse",
    name: "Build Greenhouse",
    desc: (s) =>
      `+${SLOTS_PER_GREENHOUSE} crop slots (currently ${s.greenhouses})`,
    cost: (s) => ({
      water: Math.ceil(40 * Math.pow(1.6, s.greenhouses)),
      seeds: 5 + s.greenhouses * 6,
    }),
    effect: (s) => ({
      greenhouses: s.greenhouses + 1,
      ghSlots: [
        ...s.ghSlots,
        ...Array.from({ length: SLOTS_PER_GREENHOUSE }, () => ({
          crop: null,
          progress: 0,
          ready: false,
        })),
      ],
    }),
    visible: (s) => s.stage >= 2,
    available: (s) =>
      s.water >= Math.ceil(40 * Math.pow(1.6, s.greenhouses)) &&
      s.seeds >= 5 + s.greenhouses * 6,
    level: (s) => s.greenhouses,
    group: "greenhouse",
  },
  {
    id: "vents",
    name: "Vents",
    desc: (s) =>
      `cooling: ${fmt(HEAT_DECAY_BASE + s.ventsLevel * VENT_RATE_PER_LEVEL, 2)} → ${fmt(HEAT_DECAY_BASE + (s.ventsLevel + 1) * VENT_RATE_PER_LEVEL, 2)} heat/sec`,
    cost: (s) => ({ water: Math.ceil(20 * Math.pow(1.7, s.ventsLevel)) }),
    effect: (s) => ({ ventsLevel: s.ventsLevel + 1 }),
    visible: (s) => s.stage >= 2,
    available: (s) =>
      s.water >= Math.ceil(20 * Math.pow(1.7, s.ventsLevel)),
    level: (s) => s.ventsLevel,
    group: "greenhouse",
  },
  {
    id: "thermostat",
    name: "Thermostat",
    desc: () => "auto-tunes vents — equivalent of +2 free vent levels (one-shot)",
    cost: () => ({ water: 250, seeds: 30 }),
    effect: () => ({ thermostatBought: true }),
    visible: (s) => s.stage >= 2 && s.ventsLevel >= 3,
    available: (s) =>
      !s.thermostatBought && s.water >= 250 && s.seeds >= 30,
    done: (s) => s.thermostatBought,
    group: "greenhouse",
  },
  {
    id: "cropLotus",
    name: "Cultivar: Lotus",
    desc: () => "produces water passively while planted (+0.08 u/s per plant)",
    cost: () => ({ water: 60, seeds: 10 }),
    effect: () => ({ lotusUnlocked: true }),
    visible: (s) => s.stage >= 2,
    available: (s) => !s.lotusUnlocked && s.water >= 60 && s.seeds >= 10,
    done: (s) => s.lotusUnlocked,
    group: "greenhouse",
  },
  {
    id: "cropReeds",
    name: "Cultivar: Reeds",
    desc: () => "produces salt passively while planted (+0.10 salt/s per plant)",
    cost: () => ({ water: 80, seeds: 15 }),
    effect: () => ({ reedsUnlocked: true }),
    visible: (s) => s.stage >= 2 && s.lotusUnlocked,
    available: (s) => !s.reedsUnlocked && s.water >= 80 && s.seeds >= 15,
    done: (s) => s.reedsUnlocked,
    group: "greenhouse",
  },
  {
    id: "cropMangrove",
    name: "Cultivar: Mangrove",
    desc: () => "long grow (30s), +0.30 u/s on harvest — for late-stage scale",
    cost: () => ({ water: 200, seeds: 40 }),
    effect: () => ({ mangroveUnlocked: true }),
    visible: (s) => s.stage >= 2 && s.lotusUnlocked,
    available: (s) =>
      !s.mangroveUnlocked && s.water >= 200 && s.seeds >= 40,
    done: (s) => s.mangroveUnlocked,
    group: "greenhouse",
  },
  {
    id: "cropSaguaro",
    name: "Cultivar: Saguaro",
    desc: () => "low heat output, +4 seeds + 0.05 u/s on harvest",
    cost: () => ({ water: 120, seeds: 25 }),
    effect: () => ({ saguaroUnlocked: true }),
    visible: (s) => s.stage >= 2 && s.reedsUnlocked,
    available: (s) =>
      !s.saguaroUnlocked && s.water >= 120 && s.seeds >= 25,
    done: (s) => s.saguaroUnlocked,
    group: "greenhouse",
  },

  // ---------- Aqueducts (Stage 3) ----------
  {
    id: "aqueduct",
    name: "Build Aqueduct",
    desc: (s) =>
      `+1 aqueduct — each amplifies passive flow by ×${(1 + AQUEDUCT_AMP).toFixed(2)} when intact (currently ${s.aqueducts})`,
    cost: (s) => ({
      water: Math.ceil(150 * Math.pow(1.55, s.aqueducts)),
      salt: Math.ceil(20 * Math.pow(1.4, s.aqueducts)),
    }),
    effect: (s) => ({
      aqueducts: s.aqueducts + 1,
      aqueductIntegrity: [...s.aqueductIntegrity, 1],
    }),
    visible: (s) => s.stage >= 3,
    available: (s) =>
      s.water >= Math.ceil(150 * Math.pow(1.55, s.aqueducts)) &&
      s.salt >= Math.ceil(20 * Math.pow(1.4, s.aqueducts)),
    level: (s) => s.aqueducts,
    group: "aqueduct",
  },
  {
    id: "aqueductDurability",
    name: "Pipe Reinforcement",
    desc: (s) =>
      `decay: ${fmt(aqueductDecayPerSec(s) * 100, 2)}%/s → ${fmt((AQUEDUCT_DECAY_BASE / (1 + (s.aqueductDurabilityLevel + 1) * 0.5)) * 100, 2)}%/s`,
    cost: (s) => ({
      water: Math.ceil(80 * Math.pow(1.8, s.aqueductDurabilityLevel)),
    }),
    effect: (s) => ({
      aqueductDurabilityLevel: s.aqueductDurabilityLevel + 1,
    }),
    visible: (s) => s.stage >= 3 && s.aqueducts >= 1,
    available: (s) =>
      s.water >= Math.ceil(80 * Math.pow(1.8, s.aqueductDurabilityLevel)),
    level: (s) => s.aqueductDurabilityLevel,
    group: "aqueduct",
  },
  {
    id: "pressureCap",
    name: "Pressure Tank",
    desc: (s) =>
      `pressure cap: ${maxPressure(s)} → ${maxPressure(s) + PRESSURE_CAP_PER_LEVEL}`,
    cost: (s) => ({
      water: Math.ceil(120 * Math.pow(1.7, s.pressureCapLevel)),
    }),
    effect: (s) => ({ pressureCapLevel: s.pressureCapLevel + 1 }),
    visible: (s) => s.stage >= 3,
    available: (s) =>
      s.water >= Math.ceil(120 * Math.pow(1.7, s.pressureCapLevel)),
    level: (s) => s.pressureCapLevel,
    group: "aqueduct",
  },
  {
    id: "pressureValve",
    name: "Pressure Valve",
    desc: () =>
      `unlock pressure release; burst yield ×${PRESSURE_BURST_MULT_VALVE} (one-shot)`,
    cost: () => ({ water: 300, salt: 80 }),
    effect: () => ({ pressureValveBought: true }),
    visible: (s) => s.stage >= 3 && s.pressureCapLevel >= 1,
    available: (s) =>
      !s.pressureValveBought && s.water >= 300 && s.salt >= 80,
    done: (s) => s.pressureValveBought,
    group: "aqueduct",
  },

  // ---------- Settlement (Stage 4) ----------
  {
    id: "housing",
    name: "Housing",
    desc: (s) =>
      `pop cap: ${popCap(s)} → ${popCap(s) + POP_CAP_PER_LEVEL}`,
    cost: (s) => ({
      water: Math.ceil(60 * Math.pow(1.5, s.popCapLevel)),
      seeds: 5 + s.popCapLevel * 4,
    }),
    effect: (s) => ({ popCapLevel: s.popCapLevel + 1 }),
    visible: (s) => s.stage >= 4,
    available: (s) =>
      s.water >= Math.ceil(60 * Math.pow(1.5, s.popCapLevel)) &&
      s.seeds >= 5 + s.popCapLevel * 4,
    level: (s) => s.popCapLevel,
    group: "settlement",
  },
  {
    id: "granary",
    name: "Granary",
    desc: (s) =>
      `food cap: ${foodCap(s)} → ${foodCap(s) + FOOD_CAP_PER_GRANARY}`,
    cost: (s) => ({
      water: Math.ceil(50 * Math.pow(1.6, s.granaryLevel)),
      seeds: 8 + s.granaryLevel * 5,
    }),
    effect: (s) => ({ granaryLevel: s.granaryLevel + 1 }),
    visible: (s) => s.stage >= 4,
    available: (s) =>
      s.water >= Math.ceil(50 * Math.pow(1.6, s.granaryLevel)) &&
      s.seeds >= 8 + s.granaryLevel * 5,
    level: (s) => s.granaryLevel,
    group: "settlement",
  },
  {
    id: "school",
    name: "School",
    desc: () => `labor productivity ×${SCHOOL_LABOR_MULT} (one-shot)`,
    cost: () => ({ water: 400, labor: 200 }),
    effect: () => ({ schoolBought: true }),
    visible: (s) => s.stage >= 4 && s.population >= 5,
    available: (s) =>
      !s.schoolBought && s.water >= 400 && s.labor >= 200,
    done: (s) => s.schoolBought,
    group: "settlement",
  },

  // ---------- Industry (Stage 5) ----------
  {
    id: "boiler",
    name: "Build Boiler",
    desc: (s) =>
      `+1 boiler — converts ${BOILER_WATER_PER_SEC} water/s + ${BOILER_COAL_PER_SEC} coal/s into ${BOILER_STEAM_OUT_PER_SEC} steam/s (currently ${s.boilers})`,
    cost: (s) => ({
      water: Math.ceil(200 * Math.pow(1.6, s.boilers)),
      labor: Math.ceil(50 * Math.pow(1.5, s.boilers)),
    }),
    effect: (s) => ({ boilers: s.boilers + 1 }),
    visible: (s) => s.stage >= 5,
    available: (s) =>
      s.water >= Math.ceil(200 * Math.pow(1.6, s.boilers)) &&
      s.labor >= Math.ceil(50 * Math.pow(1.5, s.boilers)),
    level: (s) => s.boilers,
    group: "industry",
  },
  {
    id: "turbine",
    name: "Build Turbine",
    desc: (s) =>
      `production ×${turbineMultiplier(s).toFixed(2)} → ×${(turbineMultiplier(s) + TURBINE_MULT_PER).toFixed(2)} (currently ${s.turbines})`,
    cost: (s) => ({
      steam: Math.ceil(20 * Math.pow(1.6, s.turbines)),
      labor: Math.ceil(100 * Math.pow(1.5, s.turbines)),
    }),
    effect: (s) => ({ turbines: s.turbines + 1 }),
    visible: (s) => s.stage >= 5 && s.boilers >= 1,
    available: (s) =>
      s.steam >= Math.ceil(20 * Math.pow(1.6, s.turbines)) &&
      s.labor >= Math.ceil(100 * Math.pow(1.5, s.turbines)),
    level: (s) => s.turbines,
    group: "industry",
  },
  {
    id: "electrolysis",
    name: "Electrolysis Retrofit",
    desc: () =>
      "boilers no longer require coal; halts pollution growth (one-shot)",
    cost: () => ({ steam: 100, labor: 500 }),
    effect: () => ({ electrolysisBought: true }),
    visible: (s) => s.stage >= 5 && s.boilers >= 2,
    available: (s) =>
      !s.electrolysisBought && s.steam >= 100 && s.labor >= 500,
    done: (s) => s.electrolysisBought,
    group: "industry",
  },

  // ---------- Aquifer (Stage 6) ----------
  {
    id: "drillBit",
    name: "Drill Bit",
    desc: (s) =>
      `drill speed: ${fmt(drillSpeed(s), 2)} → ${fmt(drillSpeed(s) + DRILL_SPEED_PER_LEVEL, 2)} m/s`,
    cost: (s) => ({
      water: Math.ceil(400 * Math.pow(1.7, s.drillSpeedLevel)),
      minerals: Math.ceil(5 + s.drillSpeedLevel * 4),
    }),
    effect: (s) => ({ drillSpeedLevel: s.drillSpeedLevel + 1 }),
    visible: (s) => s.stage >= 6,
    available: (s) =>
      s.water >= Math.ceil(400 * Math.pow(1.7, s.drillSpeedLevel)) &&
      s.minerals >= 5 + s.drillSpeedLevel * 4,
    level: (s) => s.drillSpeedLevel,
    group: "aquifer",
  },
  {
    id: "supportBeams",
    name: "Support Beams",
    desc: (s) =>
      `cave-in chance ÷${(1 + s.supportBeamsLevel * 1.5).toFixed(1)} → ÷${(1 + (s.supportBeamsLevel + 1) * 1.5).toFixed(1)}`,
    cost: (s) => ({
      water: Math.ceil(300 * Math.pow(1.6, s.supportBeamsLevel)),
      minerals: Math.ceil(8 + s.supportBeamsLevel * 5),
    }),
    effect: (s) => ({ supportBeamsLevel: s.supportBeamsLevel + 1 }),
    visible: (s) => s.stage >= 6 && s.depth >= 100,
    available: (s) =>
      s.water >= Math.ceil(300 * Math.pow(1.6, s.supportBeamsLevel)) &&
      s.minerals >= 8 + s.supportBeamsLevel * 5,
    level: (s) => s.supportBeamsLevel,
    group: "aquifer",
  },
  {
    id: "geothermalTap",
    name: "Geothermal Tap",
    desc: () => `+${GEOTHERMAL_BONUS * 100}% to all rates (one-shot)`,
    cost: () => ({ minerals: 200, steam: 200 }),
    effect: () => ({ geothermalTapBought: true }),
    visible: (s) => s.stage >= 6 && s.depth >= MAGMA_DEPTH,
    available: (s) =>
      !s.geothermalTapBought && s.minerals >= 200 && s.steam >= 200,
    done: (s) => s.geothermalTapBought,
    group: "aquifer",
  },

  // ---------- Atmosphere (Stage 7) ----------
  {
    id: "cloudSeeder",
    name: "Cloud Seeder",
    desc: (s) =>
      `+1 station — converts ${SEEDER_WATER_PER_SEC} water/s + ${SEEDER_STEAM_PER_SEC} steam/s into ${SEEDER_VAPOR_PER_SEC} vapor/s (currently ${s.cloudSeeders})`,
    cost: (s) => ({
      water: Math.ceil(800 * Math.pow(1.6, s.cloudSeeders)),
      minerals: Math.ceil(20 + s.cloudSeeders * 12),
    }),
    effect: (s) => ({ cloudSeeders: s.cloudSeeders + 1 }),
    visible: (s) => s.stage >= 7,
    available: (s) =>
      s.water >= Math.ceil(800 * Math.pow(1.6, s.cloudSeeders)) &&
      s.minerals >= 20 + s.cloudSeeders * 12,
    level: (s) => s.cloudSeeders,
    group: "atmosphere",
  },
  {
    id: "lightningCapacitor",
    name: "Lightning Capacitor",
    desc: () => `lightning gain ×${LIGHTNING_CAP_MULT} (one-shot)`,
    cost: () => ({ minerals: 100, steam: 200 }),
    effect: () => ({ lightningCapacitorBought: true }),
    visible: (s) => s.stage >= 7 && s.clouds >= 5,
    available: (s) =>
      !s.lightningCapacitorBought && s.minerals >= 100 && s.steam >= 200,
    done: (s) => s.lightningCapacitorBought,
    group: "atmosphere",
  },
  {
    id: "weatherSatellite",
    name: "Weather Satellite",
    desc: () => "stabilizes weather; aqueducts decay 50% slower (one-shot)",
    cost: () => ({ minerals: 250, steam: 300, lightning: 5 }),
    effect: () => ({ weatherSatelliteBought: true }),
    visible: (s) => s.stage >= 7 && s.clouds >= 10,
    available: (s) =>
      !s.weatherSatelliteBought &&
      s.minerals >= 250 &&
      s.steam >= 300 &&
      s.lightning >= 5,
    done: (s) => s.weatherSatelliteBought,
    group: "atmosphere",
  },

  // ---------- Research (Stage 1+) ----------
  // Stage 1 — Cultivation
  {
    id: "r_growth",
    name: "Crop Genetics",
    desc: (s) =>
      `all crops grow ×${fmt(growthMultiplier(s), 2)} → ×${fmt((1 + s.bambooSpeedLevel * BAMBOO_SPEED_FACTOR) * (1 + (s.researchGrowthLevel + 1) * 0.05), 2)} faster`,
    cost: (s) => ({ research: researchCost(1, 1.9, s.researchGrowthLevel) }),
    effect: (s) => ({ researchGrowthLevel: s.researchGrowthLevel + 1 }),
    visible: (s) => s.stage >= 1,
    available: (s) =>
      s.researchGrowthLevel < 5 &&
      s.researchPoints >= researchCost(1, 1.9, s.researchGrowthLevel),
    level: (s) => s.researchGrowthLevel,
    group: "research",
  },
  {
    id: "r_spinYield",
    name: "Wheel Linkage",
    desc: (s) =>
      `spin gain ×${fmt(1 + s.researchSpinYieldLevel * 0.15, 2)} → ×${fmt(1 + (s.researchSpinYieldLevel + 1) * 0.15, 2)} (currently +${fmt(spinGain(s), 2)} water/spin)`,
    cost: (s) => ({ research: researchCost(2, 2.0, s.researchSpinYieldLevel) }),
    effect: (s) => ({ researchSpinYieldLevel: s.researchSpinYieldLevel + 1 }),
    visible: (s) => s.stage >= 1,
    available: (s) =>
      s.researchSpinYieldLevel < 5 &&
      s.researchPoints >= researchCost(2, 2.0, s.researchSpinYieldLevel),
    level: (s) => s.researchSpinYieldLevel,
    group: "research",
  },
  // Stage 2 — Greenhouse
  {
    id: "r_heatVent",
    name: "Convective Modeling",
    desc: (s) =>
      `vent cooling ×${fmt(1 + s.researchHeatVentLevel * 0.15, 2)} → ×${fmt(1 + (s.researchHeatVentLevel + 1) * 0.15, 2)}`,
    cost: (s) => ({ research: researchCost(4, 1.9, s.researchHeatVentLevel) }),
    effect: (s) => ({ researchHeatVentLevel: s.researchHeatVentLevel + 1 }),
    visible: (s) => s.stage >= 2,
    available: (s) =>
      s.researchHeatVentLevel < 5 &&
      s.researchPoints >= researchCost(4, 1.9, s.researchHeatVentLevel),
    level: (s) => s.researchHeatVentLevel,
    group: "research",
  },
  {
    id: "r_passiveCrop",
    name: "Greenhouse Glassworks",
    desc: (s) =>
      `crop yield ×${fmt(yieldMultiplier(s), 2)} → ×${fmt((1 + s.bambooYieldLevel * YIELD_MULT_PER_LEVEL) * (1 + (s.researchPassiveCropLevel + 1) * 0.08), 2)} (harvest + passive)`,
    cost: (s) => ({ research: researchCost(5, 2.0, s.researchPassiveCropLevel) }),
    effect: (s) => ({ researchPassiveCropLevel: s.researchPassiveCropLevel + 1 }),
    visible: (s) => s.stage >= 2,
    available: (s) =>
      s.researchPassiveCropLevel < 5 &&
      s.researchPoints >= researchCost(5, 2.0, s.researchPassiveCropLevel),
    level: (s) => s.researchPassiveCropLevel,
    group: "research",
  },
  {
    id: "r_library",
    name: "Library",
    desc: () => `+${RP_KEYSTONE_LIBRARY.toFixed(2)} research points/sec (one-shot)`,
    cost: () => ({ research: 50 }),
    effect: () => ({ libraryBought: true }),
    visible: (s) => s.stage >= 2,
    available: (s) => !s.libraryBought && s.researchPoints >= 50,
    done: (s) => s.libraryBought,
    group: "research",
  },
  // Stage 3 — Aqueducts
  {
    id: "r_aqueductDecay",
    name: "Hydraulic Theory",
    desc: () => `−10% aqueduct integrity decay per level`,
    cost: (s) => ({ research: researchCost(8, 2.0, s.researchAqueductDecayLevel) }),
    effect: (s) => ({ researchAqueductDecayLevel: s.researchAqueductDecayLevel + 1 }),
    visible: (s) => s.stage >= 3,
    available: (s) =>
      s.researchAqueductDecayLevel < 5 &&
      s.researchPoints >= researchCost(8, 2.0, s.researchAqueductDecayLevel),
    level: (s) => s.researchAqueductDecayLevel,
    group: "research",
  },
  {
    id: "r_pressureCap",
    name: "Pressure Dynamics",
    desc: (s) =>
      `pressure cap ${maxPressure(s)} → ${maxPressure(s) + 20}`,
    cost: (s) => ({ research: researchCost(10, 1.9, s.researchPressureCapLevel) }),
    effect: (s) => ({ researchPressureCapLevel: s.researchPressureCapLevel + 1 }),
    visible: (s) => s.stage >= 3,
    available: (s) =>
      s.researchPressureCapLevel < 5 &&
      s.researchPoints >= researchCost(10, 1.9, s.researchPressureCapLevel),
    level: (s) => s.researchPressureCapLevel,
    group: "research",
  },
  // Stage 4 — Settlement
  {
    id: "r_laborMult",
    name: "Civic Pedagogy",
    desc: () => `+10% labor/sec per level`,
    cost: (s) => ({ research: researchCost(15, 2.0, s.researchLaborMultLevel) }),
    effect: (s) => ({ researchLaborMultLevel: s.researchLaborMultLevel + 1 }),
    visible: (s) => s.stage >= 4,
    available: (s) =>
      s.researchLaborMultLevel < 5 &&
      s.researchPoints >= researchCost(15, 2.0, s.researchLaborMultLevel),
    level: (s) => s.researchLaborMultLevel,
    group: "research",
  },
  {
    id: "r_popGrowth",
    name: "Public Health",
    desc: () => `+15% population growth rate per level`,
    cost: (s) => ({ research: researchCost(20, 2.0, s.researchPopGrowthLevel) }),
    effect: (s) => ({ researchPopGrowthLevel: s.researchPopGrowthLevel + 1 }),
    visible: (s) => s.stage >= 4,
    available: (s) =>
      s.researchPopGrowthLevel < 5 &&
      s.researchPoints >= researchCost(20, 2.0, s.researchPopGrowthLevel),
    level: (s) => s.researchPopGrowthLevel,
    group: "research",
  },
  // Stage 5 — Industry
  {
    id: "r_turbineMult",
    name: "Metallurgy",
    desc: (s) =>
      `each turbine: +${(TURBINE_MULT_PER + s.researchTurbineMultLevel * 0.02).toFixed(2)} → +${(TURBINE_MULT_PER + (s.researchTurbineMultLevel + 1) * 0.02).toFixed(2)}`,
    cost: (s) => ({ research: researchCost(30, 2.1, s.researchTurbineMultLevel) }),
    effect: (s) => ({ researchTurbineMultLevel: s.researchTurbineMultLevel + 1 }),
    visible: (s) => s.stage >= 5,
    available: (s) =>
      s.researchTurbineMultLevel < 5 &&
      s.researchPoints >= researchCost(30, 2.1, s.researchTurbineMultLevel),
    level: (s) => s.researchTurbineMultLevel,
    group: "research",
  },
  {
    id: "r_pollutionDecay",
    name: "Smog Filtration",
    desc: () => `+15% pollution decay rate per level`,
    cost: (s) => ({ research: researchCost(40, 2.0, s.researchPollutionDecayLevel) }),
    effect: (s) => ({ researchPollutionDecayLevel: s.researchPollutionDecayLevel + 1 }),
    visible: (s) => s.stage >= 5,
    available: (s) =>
      s.researchPollutionDecayLevel < 5 &&
      s.researchPoints >= researchCost(40, 2.0, s.researchPollutionDecayLevel),
    level: (s) => s.researchPollutionDecayLevel,
    group: "research",
  },
  {
    id: "r_steamPress",
    name: "Steam Press",
    desc: () => `+${RP_KEYSTONE_STEAM_PRESS.toFixed(2)} research points/sec (one-shot)`,
    cost: () => ({ research: 300 }),
    effect: () => ({ steamPressBought: true }),
    visible: (s) => s.stage >= 5,
    available: (s) => !s.steamPressBought && s.researchPoints >= 300,
    done: (s) => s.steamPressBought,
    group: "research",
  },
  // Stage 6 — Aquifer
  {
    id: "r_drillSpeed",
    name: "Geological Survey",
    desc: (s) =>
      `drill ${fmt(drillSpeed(s), 2)} → ${fmt(drillSpeed(s) * (1 + 0.20 / (1 + s.researchDrillSpeedLevel * 0.20)), 2)} m/s`,
    cost: (s) => ({ research: researchCost(60, 2.1, s.researchDrillSpeedLevel) }),
    effect: (s) => ({ researchDrillSpeedLevel: s.researchDrillSpeedLevel + 1 }),
    visible: (s) => s.stage >= 6,
    available: (s) =>
      s.researchDrillSpeedLevel < 5 &&
      s.researchPoints >= researchCost(60, 2.1, s.researchDrillSpeedLevel),
    level: (s) => s.researchDrillSpeedLevel,
    group: "research",
  },
  {
    id: "r_aquiferYield",
    name: "Crystal Refining",
    desc: () => `+10% aquifer water bonus per metre, per level`,
    cost: (s) => ({ research: researchCost(80, 2.1, s.researchAquiferYieldLevel) }),
    effect: (s) => ({ researchAquiferYieldLevel: s.researchAquiferYieldLevel + 1 }),
    visible: (s) => s.stage >= 6,
    available: (s) =>
      s.researchAquiferYieldLevel < 5 &&
      s.researchPoints >= researchCost(80, 2.1, s.researchAquiferYieldLevel),
    level: (s) => s.researchAquiferYieldLevel,
    group: "research",
  },
  {
    id: "r_crystalLattice",
    name: "Crystal Lattice",
    desc: () => `+${RP_KEYSTONE_CRYSTAL_LATTICE.toFixed(2)} research points/sec (one-shot)`,
    cost: () => ({ research: 2000 }),
    effect: () => ({ crystalLatticeBought: true }),
    visible: (s) => s.stage >= 6,
    available: (s) => !s.crystalLatticeBought && s.researchPoints >= 2000,
    done: (s) => s.crystalLatticeBought,
    group: "research",
  },
  // Stage 7 — Atmosphere
  {
    id: "r_cloudBonus",
    name: "Meteorology",
    desc: (s) =>
      `each cloud: +${(CLOUD_FAUCET_BONUS + s.researchCloudBonusLevel * 0.01).toFixed(2)} → +${(CLOUD_FAUCET_BONUS + (s.researchCloudBonusLevel + 1) * 0.01).toFixed(2)} u/s`,
    cost: (s) => ({ research: researchCost(120, 2.1, s.researchCloudBonusLevel) }),
    effect: (s) => ({ researchCloudBonusLevel: s.researchCloudBonusLevel + 1 }),
    visible: (s) => s.stage >= 7,
    available: (s) =>
      s.researchCloudBonusLevel < 5 &&
      s.researchPoints >= researchCost(120, 2.1, s.researchCloudBonusLevel),
    level: (s) => s.researchCloudBonusLevel,
    group: "research",
  },
  {
    id: "r_lightningRate",
    name: "Atmospheric Capture",
    desc: () => `+25% lightning generation rate per level`,
    cost: (s) => ({ research: researchCost(150, 2.1, s.researchLightningRateLevel) }),
    effect: (s) => ({ researchLightningRateLevel: s.researchLightningRateLevel + 1 }),
    visible: (s) => s.stage >= 7,
    available: (s) =>
      s.researchLightningRateLevel < 5 &&
      s.researchPoints >= researchCost(150, 2.1, s.researchLightningRateLevel),
    level: (s) => s.researchLightningRateLevel,
    group: "research",
  },
  {
    id: "r_skyArchive",
    name: "Sky Archive",
    desc: () => `+${RP_KEYSTONE_SKY_ARCHIVE.toFixed(2)} research points/sec (one-shot)`,
    cost: () => ({ research: 15000 }),
    effect: () => ({ skyArchiveBought: true }),
    visible: (s) => s.stage >= 7,
    available: (s) => !s.skyArchiveBought && s.researchPoints >= 15000,
    done: (s) => s.skyArchiveBought,
    group: "research",
  },
  // Stage 8 — Hydrosphere
  {
    id: "r_hydroentropyRate",
    name: "Hydroentropy Theory",
    desc: () => `+10% hydroentropy generation per level`,
    cost: (s) => ({ research: researchCost(250, 2.2, s.researchHydroentropyRateLevel) }),
    effect: (s) => ({ researchHydroentropyRateLevel: s.researchHydroentropyRateLevel + 1 }),
    visible: (s) => s.stage >= 8,
    available: (s) =>
      s.researchHydroentropyRateLevel < 5 &&
      s.researchPoints >= researchCost(250, 2.2, s.researchHydroentropyRateLevel),
    level: (s) => s.researchHydroentropyRateLevel,
    group: "research",
  },
  {
    id: "r_throughput",
    name: "Cognitive Resonance",
    desc: () => `+10% RP gain per level (compounds with all sources)`,
    cost: (s) => ({ research: researchCost(300, 2.3, s.researchThroughputLevel) }),
    effect: (s) => ({ researchThroughputLevel: s.researchThroughputLevel + 1 }),
    visible: (s) => s.stage >= 8,
    available: (s) =>
      s.researchThroughputLevel < 5 &&
      s.researchPoints >= researchCost(300, 2.3, s.researchThroughputLevel),
    level: (s) => s.researchThroughputLevel,
    group: "research",
  },
  {
    id: "r_aethericMemory",
    name: "Aetheric Memory",
    desc: () => `+${RP_KEYSTONE_AETHERIC_MEMORY.toFixed(2)} research points/sec (one-shot)`,
    cost: () => ({ research: 100000 }),
    effect: () => ({ aethericMemoryBought: true }),
    visible: (s) => s.stage >= 8,
    available: (s) => !s.aethericMemoryBought && s.researchPoints >= 100000,
    done: (s) => s.aethericMemoryBought,
    group: "research",
  },

  // ---------- Milestones ----------
  {
    id: "stage1",
    name: "Begin Selling Water → Stage I",
    desc: () => "transition operations from raw collection to seedstock",
    cost: () => ({}),
    effect: () => ({ stage: 1 as Stage, stage1Unlocked: true }),
    visible: (s) => s.capacity >= STAGE1_CAP_THRESHOLD && s.stage === 0,
    available: (s) => s.capacity >= STAGE1_CAP_THRESHOLD && s.stage === 0,
    done: (s) => s.stage1Unlocked,
    group: "milestone",
  },
  {
    id: "stage2",
    name: "Construct Greenhouse → Stage II",
    desc: () => "transplant bamboo plots into climate-controlled greenhouse slots",
    cost: () => ({ water: 80, seeds: 25 }),
    effect: (s) => {
      // Carry over every planted bamboo plot as a greenhouse bamboo slot
      // (preserve growth progress and ready flag). Empty plots are discarded.
      const carried: Slot[] = s.plots
        .filter((p) => p.planted)
        .map((p) => ({
          crop: "bamboo" as CropType,
          progress: p.progress,
          ready: p.ready,
        }));
      const slotCount = Math.max(SLOTS_PER_GREENHOUSE, carried.length);
      const ghSlots: Slot[] = Array.from({ length: slotCount }, (_, i) =>
        carried[i] ?? { crop: null, progress: 0, ready: false },
      );
      return {
        stage: 2 as Stage,
        stage2Unlocked: true,
        greenhouses: 1,
        ghSlots,
        plots: [],
      };
    },
    visible: (s) =>
      s.stage === 1 && s.bambooHarvested >= 25 && s.plots.length >= 3,
    available: (s) =>
      s.stage === 1 && s.water >= 80 && s.seeds >= 25,
    done: (s) => s.stage2Unlocked,
    group: "milestone",
  },
  {
    id: "stage3",
    name: "Lay Aqueducts → Stage III",
    desc: () =>
      "scale operations from greenhouse plots to a flowing infrastructure network",
    cost: () => ({ water: 400, salt: 60 }),
    effect: () => ({
      stage: 3 as Stage,
      stage3Unlocked: true,
    }),
    visible: (s) =>
      s.stage === 2 && s.greenhouses >= 2 && effectiveFaucet(s) >= 1.0,
    available: (s) => s.stage === 2 && s.water >= 400 && s.salt >= 60,
    done: (s) => s.stage3Unlocked,
    group: "milestone",
  },
  {
    id: "stage4",
    name: "Found Settlement → Stage IV",
    desc: () =>
      "people arrive, drink your water, and offer their labor in return",
    cost: () => ({ water: 1000, salt: 150 }),
    effect: () => ({
      stage: 4 as Stage,
      stage4Unlocked: true,
      population: 1, // seed colonist
      food: BASE_FOOD_CAP / 2,
    }),
    visible: (s) =>
      s.stage === 3 && s.aqueducts >= 4 && effectiveFaucet(s) >= 3.0,
    available: (s) => s.stage === 3 && s.water >= 1000 && s.salt >= 150,
    done: (s) => s.stage4Unlocked,
    group: "milestone",
  },
  {
    id: "stage5",
    name: "Light the Boilers → Stage V",
    desc: () =>
      "the steam age — water becomes power, coal becomes pollution",
    cost: () => ({ water: 2500, labor: 800 }),
    effect: () => ({
      stage: 5 as Stage,
      stage5Unlocked: true,
      coal: 5, // starter ration
    }),
    visible: (s) =>
      s.stage === 4 && s.population >= 25 && s.labor >= 200,
    available: (s) =>
      s.stage === 4 && s.water >= 2500 && s.labor >= 800,
    done: (s) => s.stage5Unlocked,
    group: "milestone",
  },
  {
    id: "stage6",
    name: "Sink Borehole → Stage VI",
    desc: () =>
      "drill into the earth and tap the aquifer's vast water reserves",
    cost: () => ({ water: 5000, steam: 80 }),
    effect: () => ({
      stage: 6 as Stage,
      stage6Unlocked: true,
      drilling: true, // start drilling immediately
    }),
    visible: (s) =>
      s.stage === 5 && s.boilers >= 3 && s.steam >= 50,
    available: (s) =>
      s.stage === 5 && s.water >= 5000 && s.steam >= 80,
    done: (s) => s.stage6Unlocked,
    group: "milestone",
  },
  {
    id: "stage7",
    name: "Pierce the Sky → Stage VII",
    desc: () =>
      "pump water upward and seize control of the weather above your works",
    cost: () => ({ minerals: 50, steam: 200 }),
    effect: () => ({
      stage: 7 as Stage,
      stage7Unlocked: true,
      cloudSeeders: 1,
    }),
    visible: (s) =>
      s.stage === 6 && s.depth >= AQUIFER_DEPTH + 200 && s.minerals >= 30,
    available: (s) =>
      s.stage === 6 && s.minerals >= 50 && s.steam >= 200,
    done: (s) => s.stage7Unlocked,
    group: "milestone",
  },
  {
    id: "stage8",
    name: "Inhabit the Hydrosphere → Stage VIII",
    desc: () =>
      "ascend beyond infrastructure — become the planetary water cycle",
    cost: () => ({ minerals: 500, lightning: 30 }),
    effect: () => ({
      stage: 8 as Stage,
      stage8Unlocked: true,
    }),
    visible: (s) =>
      s.stage === 7 && s.clouds >= 20 && s.lightning >= 15,
    available: (s) =>
      s.stage === 7 && s.minerals >= 500 && s.lightning >= 30,
    done: (s) => s.stage8Unlocked,
    group: "milestone",
  },
];

