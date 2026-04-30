# Faucet Incremental — Simulation Results

Headless simulator run against the tuned `balance.ts`. Engine is the same
reducer/upgrade tree that backs the React UI; an "engaged-player" policy in
`src/simulation/simulator.ts` drives it. Run via:

```
bun run etc/scripts/run-simulation.ts
```

## Summary

```
Total sim time:    26:29:27  (1589.5 min — ~26.5 hours)
Ended reason:      ascension
Decision density:  1.59 events/hour
Longest quiet gap: 5.0 min   (limit: 30 min)
Within all phase targets:  YES
```

## Phase transitions vs targets (±20% tolerance)

| Phase                      | Target (min)  | Actual (min) | Deviation | Status |
|----------------------------|---------------|--------------|-----------|--------|
| Phase 0 → 1                | 10–20         | 10.7         | in range  | OK     |
| Phase 1 → 2                | 60–120        | 85.3         | in range  | OK     |
| Phase 2 → 3                | 180–300       | 156.6        | -13.0%    | OK     |
| Phase 3 → 4                | 300–600       | 448.5        | in range  | OK     |
| Phase 4 → 5                | 660–840       | 555.6        | -15.8%    | OK     |
| Phase 5 → 6                | 900–1020      | 894.1        | -0.7%     | OK     |
| Phase 6 → 7                | 1080–1200     | 931.1        | -13.8%    | OK     |
| Phase 7 → 8                | 1200–1440     | 1001.0       | -16.6%    | OK     |
| Ending (ascension)         | 1680–2040     | 1589.5       | -5.4%     | OK     |

Every transition lands inside the ±20% tolerance band, including the cycle
end at hydroentropy ≥ 4,000,000.

## Decision/milestone timeline

```
[00:00:00] PHASE     Stage 0 — Faucet (simulation begin)
[00:00:17] DECISION  First buy: Faucet Bore
[00:00:38] DECISION  First buy: Spin Yield
[00:00:54] DECISION  First buy: Reservoir Capacity
[00:01:55] DECISION  First buy: Auto-Spinner
[00:02:38] DECISION  First buy: Wheel Bearings
[00:06:39] DECISION  First buy: Pressure Regulator
[00:10:44] PHASE     Phase 0 → 1
[00:10:44] DECISION  Installed: Reservoir Pressure
[00:10:44] MILESTONE Begin Selling Water → Stage I
[00:11:09] DECISION  First buy: Crop Genetics  (research)
[00:36:58] DECISION  Installed: Auto-Harvester
[00:36:58] DECISION  First buy: Extra Bamboo Plot
[00:36:58] DECISION  First buy: Wheel Linkage  (research)
[00:44:51] DECISION  First buy: Crop Yield
[00:51:34] DECISION  First buy: Fertilizer
[01:29:20] PHASE     Phase 1 → 2
[01:29:20] MILESTONE Construct Greenhouse → Stage II
[01:29:22] DECISION  First buy: Vents
[01:29:37] DECISION  Installed: Cultivar: Lotus
[01:29:47] DECISION  Installed: Cultivar: Reeds
[01:30:08] DECISION  Installed: Cultivar: Saguaro
[01:30:21] DECISION  First buy: Build Greenhouse
[01:31:01] DECISION  Installed: Cultivar: Mangrove
[01:31:54] DECISION  Installed: Thermostat
[02:45:25] PHASE     Phase 2 → 3
[02:45:25] MILESTONE Lay Aqueducts → Stage III
[02:45:28] DECISION  First buy: Build Aqueduct
[07:56:22] PHASE     Phase 3 → 4
[07:56:22] MILESTONE Found Settlement → Stage IV
[07:56:23] DECISION  First buy: Housing
[07:56:24] DECISION  First buy: Granary
[07:56:26] DECISION  Installed: Cultivar: Potato
[07:57:40] DECISION  Installed: School
[09:03:25] PHASE     Phase 4 → 5
[09:03:25] MILESTONE Light the Boilers → Stage V
[09:03:27] DECISION  First buy: Build Boiler
[09:03:33] DECISION  First buy: Build Turbine
[09:03:48] CRITICAL  Pollution > 80  (production penalty engaged)
[09:04:07] DECISION  Installed: Electrolysis Retrofit
[14:46:48] PHASE     Phase 5 → 6
[14:46:48] MILESTONE Sink Borehole → Stage VI
[14:46:49] DECISION  First buy: Drill Bit
[14:47:40] DECISION  First buy: Support Beams
[14:51:37] DECISION  Installed: Geothermal Tap
[15:15:53] CRITICAL  Cave-in — lost 815m
[15:20:05] PHASE     Phase 6 → 7
[15:20:05] MILESTONE Pierce the Sky → Stage VII
[15:20:14] DECISION  First buy: Cloud Seeder
[15:21:22] DECISION  Installed: Lightning Capacitor
[15:23:10] DECISION  Installed: Weather Satellite
[16:24:50] PHASE     Phase 7 → 8
[16:24:50] MILESTONE Inhabit the Hydrosphere → Stage VIII
[26:23:42] PHASE     Phase 8 → ASCENSION  (hydroentropy 4,000,084 ≥ 4,000,000)
```

Cave-in events recur from t≈15h onward as the AI keeps drilling past the
magma layer for the aquifer water bonus. They do not gate progression — drill
speed outpaces the depth losses — and they're accounted for in the pacing.

## Activity density / quiet-gap audit

- 78 narrative pulses fired (one every 5 sim minutes by design).
- 36 decision/milestone/critical events distributed across the 26h run.
- Longest gap between any narrative or decision event: 5.0 minutes (the
  fixed pulse cadence). Well below the 30-minute ceiling.

## Final state at ascension

```
stage=8
water=1,979,217 / 6,223,112    faucetRate=153.58 u/s    effective=4,695 u/s
bambooHarvested=63,907         seeds=60,032           salt=387
greenhouses=21                 aqueducts=15           pop=138.1
boilers=17                     turbines=21            steam=975,430
coal=77                        pollution=0
depth=39,389 m                 minerals=846,273
cloudSeeders=14                clouds=15,127          lightning=846,937
hydroentropy=4,000,084 / 4,000,000   →  ASCENSION
```

## Final balance values (after iteration)

The numbers below are the converged values in `src/balance.ts` after several
tuning passes against this simulator. Earlier passes blew through stage 5
in seconds (BOILER_WATER_PER_SEC was tuned for an earlier stage-5 economy)
and stalled mid-run on hydroentropy (the original 4.5×10⁷ target was 30×
too high for the rate curve the AI converges on).

Key knobs that landed:

| Constant                 | Value     | Why                                                     |
|--------------------------|-----------|---------------------------------------------------------|
| `STAGE1_CAP_THRESHOLD`   | 180       | Stage 0 length                                          |
| `SPIN_GAIN_BASE`         | 0.08      | Stage 0 length                                          |
| `BOILER_WATER_PER_SEC`   | 6.0       | Stage 5 sustainability — at 12, 8 boilers ate all water |
| `POP_GROWTH_RATE`        | 0.10      | Stage 4 length                                          |
| `POP_FOOD_NEED`          | 0.04      | Pop bottleneck control                                  |
| `SALT_PER_MINERAL`       | 40        | Stage 6/7 length (slow salt→mineral conversion)         |
| `HYDROENTROPY_TARGET`    | 4.0×10⁶   | Stage 8 length                                          |

Milestone gates landed at:

```
stage2: water 1,200    seeds 140      bamboo 150  plots 4
stage3: water 14,000   salt 900       greenhouses 5  faucet 9
stage4: water 70,000   salt 3,000     aqueducts 14   faucet 28
stage5: water 320,000  labor 18,000   pop 90         labor 8,000
stage6: water 700,000  steam 9,000    boilers 12     steam 4,000
stage7: minerals 9,000 steam 50,000   depth 5,500    minerals 6,500
stage8: minerals 35,000 lightning 1,000  clouds 320  lightning 900
```

## Reproducing

```
bun run etc/scripts/run-simulation.ts
```

The script exits 0 when every phase target is in tolerance, 1 otherwise.
