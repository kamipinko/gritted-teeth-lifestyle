---
date: 2026-05-03
topic: gtl-combo-exp-multiplier
status: draft (mid-brainstorm — resume to finish)
---

# GTL Combo EXP Multiplier System

> **Status note**: This is a snapshot of the brainstorm in progress. Many decisions are locked in; some open questions remain. Resume by re-reading this doc, surfacing the **Outstanding Questions** below, and continuing from where we left off.

## Problem Frame

GTL has an existing XP system: per-set XP is computed via `weight × repMult(reps) × reps` (with a flat 1.0× plateau between 5 and 15 reps; bell curves outside). XP allocates to a Total XP counter (player level) and to one of 5 body-region counters (CORE / ARMS / LEGS / FRONT / BACK) via a 1:1 muscle→region map. The stats page already renders a transmutation-circle star chart driven by region XP; the active page already has a per-set XP-fly animation choreography (xp-p, xp-combine-in, xp-fly, xp-bar-pulse).

The new feature is a **combo-driven multiplier system** that layers on top of the existing per-set XP calc. It introduces named consistency tiers, prestige loops, holiday windows, and a wger-seeded multi-region trickle-down distribution, all expressed through a stack of multipliers applied to the existing base XP.

## Requirements

**Multiplier Stack (per logged set)**
- R1. Base XP per set is unchanged: `base = weight × repMult(reps) × reps` using the existing `repMult` (flat 1.0× between r=5 and r=15, bell curves outside). The new system layers on top of `base`.
- R2. The full stack, in order: `base × consistency × (compound|isolation per-region multipliers) × prestige × holiday`. Compound and isolation multipliers are per-region (see R10–R12), so the stack is applied per-region after the wger split.
- R3. The user sees a **single visible XP number** in the per-set popup animation — equal to the **sum** of the per-region allocations after all multipliers. That total also goes to `totalXP` (player level driver) and is split per-region into `regionXP[]`.

**Consistency / Combo Identity**
- R4. **Consistency XP** is a new, separate counter (parallel to Total XP). It accumulates from completing planned sessions on planned days. Its level determines the **Consistency multiplier** value.
- R5. The combo identity has named tiers: **NOVICE → IRON → STEEL → BLAZE → OVERDRIVE**. Each tier has an associated multiplier value (placeholder: 1.0× / 1.3× / 1.7× / 2.5× / 4.0× — tunable).
- R6. Within a tier, Consistency XP grows via small per-session ticks (linear ramp), so multiplier increments smoothly inside the tier (e.g., IRON 1.3× → 1.4× → 1.5× → 1.6× before promoting to STEEL).
- R7. Tier crossings get a P5/Gurren rank-up flourish (kanji, color, animation) when the user enters a new named tier.
- R8. **Asymmetric break rules:**
  - Missed planned **set** within a session → drop one tick **within current tier** (forgiving — accidents, form breakdown, equipment).
  - Missed planned **day** entirely → drop a full **tier** (or full reset for top tiers — TBD).

**Prestige**
- R9. When the user holds OVERDRIVE for N sessions, they may "ascend": the multiplier resets to 1.0× / NOVICE, but they keep a permanent **Galaxy-Spiral ribbon**. Ribbons stack — each adds a small permanent baseline-XP bonus (placeholder: +5% per ribbon — tunable). User can prestige indefinitely; bonus compounds.

**Compound & Isolation (Per-Region Multipliers)**
- R10. Each exercise is classified **compound** or **isolation** (derived from wger primary/secondary muscle data — multi-muscle = compound, single-muscle = isolation; or whatever wger exposes directly).
- R11. The system has two tunable per-region multiplier values: **M_high** and **M_low** (placeholder: 1.3 and 1.1 — tunable).
- R12. Application:
  - For **compound** exercises: broad regions (FRONT / BACK / CORE) receive `× M_high`; narrow regions (ARMS / LEGS) receive `× M_low`.
  - For **isolation** exercises: narrow regions receive `× M_high`; broad regions receive `× M_low`.
  - This naturally exaggerates the distribution (broad zones grow faster on compounds; narrow zones grow faster on isolations) without a separate redistribution step.

**Region Distribution (wger-Seeded)**
- R13. Each exercise's region weights are derived from wger primary/secondary muscle data. wger muscles map to GTL's 5 regions via a one-time mapping table.
- R14. Primary muscles get higher weight than secondaries (placeholder: 60/40 split, secondaries divided evenly within tier — tunable; the weighting heuristic itself is open).
- R15. wger licensing: code is AGPLv3 (does not bind us — we don't use their code), data is CC-BY-SA. Compliance: a single attribution line in the settings credits page is sufficient; we do not redistribute the data, so ShareAlike does not bind.

**Holiday Multiplier**
- R16. The Holiday multiplier is triggered by **real-world calendar holidays** (hard-coded list in app config — exact list TBD). When active, it multiplies all visible XP for that day. User has no control; it just fires on the date.

**Visibility & UI**
- R17. The active-page nav stays clean — no constant multiplier display. The existing total XP bar is unchanged.
- R18. After a set is logged, the **per-set XP-fly animation** reveals the multiplier stack momentarily (e.g., "+1080 EXP × 1.3 IRON × 1.3 COMPOUND = +1826 to FRONT" or similar — exact format TBD). Stack is a moment, not a constant.
- R19. The user infers per-region growth via the existing transmutation-circle star chart on the stats page. The compound/isolation/multiplier dynamics surface visually over time as some star points grow faster than others, not as moment-by-moment numbers.

## Worked Math Examples (using existing repMult)

Defaults assumed: Consistency at IRON = ×1.3, M_high = 1.3, M_low = 1.1, Prestige = 1.0×, Holiday = 1.0×.

**Example 1 — Bench 135 × 10 (compound):**
- Base = 135 × repMult(10) × 10 = 135 × 1.0 × 10 = **1350**
- wger split → FRONT 80% (1080) / ARMS 20% (270)
- FRONT: 1080 × 1.3 (consistency) × 1.3 (compound→broad M_high) = **1826**
- ARMS: 270 × 1.3 × 1.1 (compound→narrow M_low) = **386**
- Visible XP shown: **2212** (= 1826 + 386). Goes to `totalXP`. Region splits go to `regionXP[FRONT]` and `regionXP[ARMS]`.

**Example 2 — Bicep curl 60 × 10 (isolation):**
- Base = 60 × 1.0 × 10 = **600**
- wger split → ARMS 100% (600)
- ARMS: 600 × 1.3 (consistency) × 1.3 (isolation→narrow M_high) = **1014**
- Visible XP shown: **1014**

**Example 3 — Squat 225 × 8 (compound, legs-heavy):**
- Base = 225 × 1.0 × 8 = **1800**
- wger split → LEGS 84% (1512) / BACK 8% (144) / CORE 8% (144)
- LEGS: 1512 × 1.3 × 1.1 (compound→narrow M_low) = **2162**
- BACK: 144 × 1.3 × 1.3 (compound→broad M_high) = **243**
- CORE: 144 × 1.3 × 1.3 = **243**
- Visible XP shown: **2648**

The "exasperated distribution" is visible: in #3, BACK and CORE pump faster than they would under simple proportional scaling, even though squats are LEGS-dominant.

## Scope Boundaries

- The existing `repMult(reps)` curve is unchanged. (The r=5 falls-into-second-branch quirk is a separate concern, not for this brainstorm.)
- The Total XP / player-level threshold formula (`15000 + level × 1000`) is unchanged.
- The 5-region map (CORE / ARMS / LEGS / FRONT / BACK) is unchanged in structure, but each muscle's contribution becomes multi-region per wger.
- Express forge cycle path is untouched.
- The wger seed import process is in flight (`scripts/import-wger.js`, `scripts/wgerMap.js` are already on dev as of 2026-05-03).

## Key Decisions

- **Combo trigger = completion consistency** — plan adherence is the engine. Complete planned sessions on planned days → combo grows.
- **Asymmetric breaking** — set-miss is forgiving (within-tier tick drop), day-miss is harsh (full tier drop or reset).
- **Layered build curve** — linear ramp within tiers + named tiers + overall exponential-with-cap shape + prestige loop. All four mechanics coexist.
- **Multiplier stack, in order** — base × consistency × (compound|isolation per-region) × prestige × holiday. Each is tunable independently.
- **Per-region multipliers, not bias shifts** — compound and isolation each apply M_high and M_low to different region groups. No separate redistribution step. Cleaner formulation than my earlier "shift the weights" approach.
- **wger-seeded distribution** — each exercise has a region weight vector derived from wger primary/secondary muscle data. No hand-tuning per exercise.
- **wger attribution in settings credits — sufficient for license compliance.**
- **Visibility is moment-bound** — per-set popup animation reveals the stack briefly. No constant multiplier UI in the nav. Region splits are discrete; only inferred via star chart growth over time.

## Outstanding Questions

### Resolve Before Planning

- [Affects R5][User decision] What are the exact tier multiplier values? Placeholder: NOVICE 1.0× / IRON 1.3× / STEEL 1.7× / BLAZE 2.5× / OVERDRIVE 4.0×. These shape the entire feel — go bigger? smaller? more tiers?
- [Affects R6][User decision] How many sessions per tier? (How long does it take to climb NOVICE → IRON → STEEL → BLAZE → OVERDRIVE?) Determines how often a typical user feels rank-up.
- [Affects R8][User decision] Missed-day rule: full reset for ALL tiers, or full tier drop only (so OVERDRIVE → BLAZE on first miss, not 1.0× on first miss)? Latter is more forgiving for high-tier users.
- [Affects R8][User decision] Grace days / streak freezes? (Duolingo-style "1 free pass per month") or strict no-grace?
- [Affects R9][User decision] How many sessions at OVERDRIVE before prestige is available? And does the user have to opt in to ascend, or is it auto?
- [Affects R9][User decision] Prestige bonus magnitude: +5% per ribbon? Compounding (1.05ⁿ)? Additive (1 + 0.05n)? Capped after N ribbons?
- [Affects R11][User decision] M_high / M_low values: 1.3 / 1.1 placeholders. Bigger spread (e.g., 1.5 / 1.0)? Smaller? Even reversed for some exercises?
- [Affects R14][Needs research] wger primary/secondary weighting heuristic. Placeholder: primary 60% / secondary 40% (split evenly). Real fitness science may suggest different ratios. Worth a quick research pass when planning.
- [Affects R16][User decision] Which calendar holidays trigger? (New Year's Day, Halloween, user's birthday, July 4? Christmas? Thanksgiving? Cultural holidays?) And what multiplier value(s)?
- [Affects R18][User decision] Exact format of the per-set popup multiplier breakdown. "+1080 EXP × 1.3 IRON × 1.3 COMPOUND = +1826 to FRONT" or simpler? Where does the "to FRONT" part come in (sub-particle that flies into the star chart)?
- [Affects all][User decision] How does the user **view their current Consistency XP / current tier**? UI surface — settings? stats? a new dedicated "Combat Status" panel? Where does the Galaxy-Spiral ribbon collection display?

### Deferred to Planning

- [Affects R10][Technical] Does wger expose compound/isolation classification directly, or do we infer from `muscles_primary.length >= 2` or muscle-region span? Implementer to confirm against wger schema.
- [Affects R13][Technical] Storage shape for per-exercise region weights — bake into `lib/exerciseLibrary.js` at import time, or compute lazily from muscle data?
- [Affects R18][Technical] Per-region "sub-particle" animation — the existing `xp-p-${i}` animation already creates particles flying to the bar; can multi-region splits piggyback on that with per-region color tints?
- [Affects R8][Technical] Detection of "missed planned day" — the cycle stores planned days; "missed" = scheduled day passed without `done-{cycleId}-{iso}` flag. Implementation detail.
- [Affects R16][Technical] Holiday detection — local-machine date check vs server-side? Time zones?

## Where We Are in the Conversation

- ✅ Existing XP algo confirmed (base XP via `weight × repMult × reps`, 1:1 muscle→region today)
- ✅ Multi-region distribution will be derived from wger primary/secondary data
- ✅ wger licensing understood (settings-credits attribution sufficient)
- ✅ Multiplier stack order locked: base × consistency × (compound|isolation per-region) × prestige × holiday
- ✅ Compound/isolation use TWO per-region multipliers (M_high to favored region group, M_low to other), not a separate bias-redistribution step
- ✅ Visibility model: only the per-set popup animation reveals the stack. Region splits are inferred from star-chart growth.
- ✅ Math walkthroughs confirmed (bench, bicep curl, squat) using actual `repMult` formula
- ✅ Asymmetric break: missed-set tick drop (forgiving), missed-day tier drop (harsh)
- ✅ Build curve: layered (linear within tiers + named tiers + exponential-cap shape + prestige loop)

**Next session**: pick up at the Outstanding Questions list. The biggest practical block is the tier multiplier values (R5) and the M_high/M_low values (R11) — once those are locked, planning can proceed. Holiday list (R16) and grace policy (R8) are smaller but still need answers.

## Next Steps

→ Resume `ce:brainstorm` with this doc as context. Walk the Outstanding Questions one at a time. Then `ce:plan` once Resolve Before Planning is empty.
