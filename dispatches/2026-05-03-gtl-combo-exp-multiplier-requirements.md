---
date: 2026-05-03
topic: gtl-combo-exp-multiplier
status: draft (mid-brainstorm — resume to finish)
---

# GTL Combo EXP Multiplier System

> **Status note**: This is a snapshot of the brainstorm in progress. Many decisions are locked in; some open questions remain. Resume by re-reading this doc, surfacing the **Outstanding Questions** below, and continuing from where we left off.
>
> **2026-05-03 update**: replaced the earlier "M_high/M_low per-region multipliers" model with a two-track model (continuous total XP via additive multipliers + discrete star awards per region). See Requirements R2–R3 and R10–R14.

## Problem Frame

GTL has an existing XP system: per-set XP is computed via `weight × repMult(reps) × reps` (with a flat 1.0× plateau between 5 and 15 reps; bell curves outside). XP today allocates to a Total XP counter (player level) and to one of 5 body-region counters (CORE / ARMS / LEGS / FRONT / BACK) via a 1:1 muscle→region map. The stats page already renders a transmutation-circle star chart driven by region XP; the active page already has a per-set XP-fly animation choreography.

The new feature is a **combo-driven multiplier system** that layers on top. It introduces named consistency tiers, prestige loops, holiday windows, wger-seeded multi-region distribution, and **two parallel tracks** for how XP gets credited:

- **Total XP track (continuous)** — additive multipliers, drives the player level.
- **Region star track (discrete)** — wger weight share buckets into 0/1/2-star awards on the transmutation circle, with rules to enforce a "compound = 2 regions × 1 star, isolation = 1 region × 2 stars" ideal.

## Requirements

**Base XP (existing, unchanged)**
- R1. Base XP per set is unchanged: `base = weight × repMult(reps) × reps` using the existing `repMult` (flat 1.0× between r=5 and r=15, bell curves outside). Both new tracks build off this `base`.

**Total XP track (continuous, additive multipliers)**
- R2. The Total XP added per set = sum of contributions from each active multiplier:
  ```
  total_visible_XP =
      base × consistency_mult
    + base × (compound_mult OR isolation_mult)
    + base × holiday_mult       // 0 if no holiday active
    + base × prestige_mult      // 0 if no prestige bonus
  ```
  Inactive multipliers (no holiday today, no prestige badges) contribute 0. Compound's multiplier value is **always larger than** isolation's (so heavy compound work earns more raw total XP than equivalent isolation work).
- R3. The user sees a **single visible XP number** in the per-set popup animation — equal to the sum above. That number adds to `totalXP` (the existing player-level driver). The popup briefly reveals the breakdown ("+base × 1.3 consistency + base × 1.5 compound = +visible_XP").

**Region star track (discrete, wger-driven)**
- R10. Each exercise has a region-weight vector derived from wger primary/secondary muscle data, mapped to GTL's 5 regions. Default heuristic: primary muscles get 60% of weight (split evenly across primary muscles), secondary muscles get 40% (split evenly across secondaries). Tunable.
- R11. Star bands (per region, per set):
  - `< 30%` wger weight → **0 stars**
  - `30–59%` → **1 star**
  - `60%+` → **2 stars**
- R12. **Compound exercises** apply a cap-and-overflow rule:
  - Cap each region at **1 star per set** (compound never gives 2 stars to any single region).
  - If a region's weight share would have earned 2 stars (≥60%), the second star **overflows to the next-highest-weight region**, even if that region's raw share is below 30%.
  - Tie-breaking for overflow target: prefer narrow zones (ARMS / LEGS) over broad zones (FRONT / BACK / CORE) — TBD, see Outstanding Questions.
  - Goal: every compound set distributes 2 stars across exactly 2 regions (ideally 1+1).
- R13. **Isolation exercises** apply a concentrate-on-primary rule:
  - Only the **highest-weight region** earns stars. All other regions get 0 stars even if they cross the 30% threshold.
  - That highest region's stars come from its raw share band (60%+ → 2★, 30–59% → 1★).
  - Goal: every isolation set concentrates stars in 1 region.
- R14. **Classification (compound vs isolation) is a curated per-exercise property**, not auto-derived. Auto-classification rule (used at wger import time): if wger weight is 100% in one region (e.g., hip thrust, calf raise, leg extension, bicep curl, tricep extension, front raise), default to **isolation**. Otherwise default to compound. **Curator pass required after import** — Jordan reviews and hand-overrides exercises that the auto-rule miscategorizes. Known curator-override candidates: lateral raise (medial delt isolation, but wger 60/40 → defaults compound), reverse fly / rear delt fly (rear delt isolation, but wger 60/40), and any other exercise where wger lists a stabilizer as secondary but training intent is single-target.

**Consistency / Combo Identity**
- R4. **Consistency XP** is a new, separate counter (parallel to Total XP). It accumulates from completing planned sessions on planned days. Its level determines the **Consistency multiplier** value (R2).
- R5. The combo identity has named tiers: **NOVICE → IRON → STEEL → BLAZE → OVERDRIVE**. Each tier has an associated multiplier value (placeholder: 1.0 / 1.3 / 1.7 / 2.5 / 4.0 — tunable).
- R6. Within a tier, Consistency XP grows via small per-session ticks (linear ramp), so multiplier increments smoothly inside the tier.
- R7. Tier crossings get a P5/Gurren rank-up flourish (kanji, color, animation) when the user enters a new named tier.
- R8. **Asymmetric break rules:**
  - Missed planned **set** within a session → drop one tick **within current tier** (forgiving — accidents, form breakdown, equipment).
  - Missed planned **day** entirely → drop a full **tier** (or full reset for top tiers — TBD).

**Prestige**
- R9. When the user holds OVERDRIVE for N sessions, they may "ascend": multiplier resets to 1.0 / NOVICE, but they keep a permanent **Galaxy-Spiral ribbon**. Ribbons stack — each adds a small permanent baseline-XP bonus contribution (placeholder: each ribbon = +0.05× contribution under R2's prestige_mult — tunable).

**Holiday Multiplier**
- R16. The Holiday multiplier is triggered by **real-world calendar holidays** (hard-coded list — exact list TBD). When active on a given day, it contributes to total XP per R2. User has no control; it just fires on the date.

**wger Licensing**
- R15. wger code is AGPLv3 (does not bind us — we don't use their code), data is CC-BY-SA. Compliance: a single attribution line in the **settings credits page** is sufficient. We don't redistribute the data, so ShareAlike doesn't bind.

**Visibility & UI**
- R17. The active-page nav stays clean — no constant multiplier display. The existing total XP bar is unchanged.
- R18. After a set is logged, the **per-set XP-fly animation** reveals the multiplier stack momentarily (e.g., "base 1575 + (×1.3 IRON) + (×1.5 COMPOUND) = +4411 EXP"). Stack is a moment, not a constant.
- R19. The user infers per-region growth via the existing transmutation-circle star chart on the stats page. The compound/isolation/multiplier dynamics surface visually over time as some star points grow faster than others. Star awards from R11–R13 fire visually on the chart per set.

## Worked Math Examples

Defaults assumed: Consistency at IRON = 1.3, compound_mult = 1.5, isolation_mult = 1.2, prestige = 0, holiday = 0. wger primary/secondary 60/40 split.

**Example 1 — Bench press 135 × 10 (compound)**
- Base = 135 × repMult(10) × 10 = 135 × 1.0 × 10 = **1350**
- Total XP track: 1350 × 1.3 + 1350 × 1.5 = 1755 + 2025 = **+3780 to totalXP**
- wger weights aggregate: FRONT 86% / ARMS 13%
- Region star track (compound, cap+overflow): FRONT capped at 1★ (would have been 2★ at 86%); second star overflows to next-highest = ARMS. Result: **FRONT 1★ + ARMS 1★**

**Example 2 — Bicep curl 60 × 5 (isolation)**
- Base = 60 × repMult(5) × 5 = 60 × 1.0 × 5 = **300**
- Total XP track: 300 × 1.3 + 300 × 1.2 = 390 + 360 = **+750 to totalXP**
- wger weights: ARMS 100%
- Region star track (isolation, concentrate): only highest region (ARMS) earns stars. ARMS at 100% → 2★. Result: **ARMS 2★**

**Example 3 — Deadlift 315 × 5 (compound, naturally splits)**
- Base = 315 × repMult(5) × 5 = 315 × 1.0 × 5 = **1575**
- Total XP track: 1575 × 1.3 + 1575 × 1.5 = 2048 + 2363 = **+4411 to totalXP**
- wger weights: LEGS 50% / BACK 30% / ARMS 10% / CORE 10%
- Region star track (compound): no region exceeds 60%, so no overflow needed. LEGS 1★ (50% in 30–59 band), BACK 1★ (30%), ARMS 0★ (<30%), CORE 0★ (<30%). Result: **LEGS 1★ + BACK 1★**

**Example 4 — Hip thrust (curated as isolation)**
- wger weights: LEGS 100% (all primary + secondary muscles map to LEGS)
- Curator rule R14: 100% in one region → classify as isolation (overrides default compound assumption).
- Region star track (isolation, concentrate): LEGS 100% → 2★. Result: **LEGS 2★**

## "Compound = 2×1 stars, Isolation = 1×2 stars" Rule Audit

The cap-and-overflow rule (R12) + concentrate rule (R13) + 100% reclassification rule (R14) collectively force every exercise to satisfy the 2×1 / 1×2 ideal. Audit of canonical lifts:

| Lift | Class | Raw weights | Stars after rules |
|---|---|---|---|
| Bench press | compound | FRONT 86 / ARMS 13 | FRONT 1★ + ARMS 1★ ✓ |
| Squat | compound | LEGS 84 / BACK 8 / CORE 8 | LEGS 1★ + BACK 1★ ✓ (or CORE on tie) |
| Deadlift | compound | LEGS 50 / BACK 30 / ARMS 10 / CORE 10 | LEGS 1★ + BACK 1★ ✓ |
| Pull-up | compound | BACK 50 / ARMS 50 | BACK 1★ + ARMS 1★ ✓ |
| Overhead press | compound | FRONT 73 / ARMS 13 / BACK 13 | FRONT 1★ + (ARMS or BACK) 1★ ✓ |
| Bent-over row | compound | BACK 84 / ARMS 8 / FRONT 8 | BACK 1★ + ARMS 1★ ✓ |
| Lunge | compound | LEGS 89 / CORE 13 | LEGS 1★ + CORE 1★ ✓ |
| Hip thrust | isolation (curated) | LEGS 100 | LEGS 2★ ✓ |
| Calf raise | isolation (curated) | LEGS 100 | LEGS 2★ ✓ |
| Bicep curl | isolation | ARMS 100 | ARMS 2★ ✓ |
| Lateral raise | isolation | FRONT 60 / BACK 40 | FRONT 2★ ✓ |
| Leg extension | isolation | LEGS 100 | LEGS 2★ ✓ |

## Scope Boundaries

- The existing `repMult(reps)` curve is unchanged. (The r=5 plateau quirk is documented; not for this brainstorm.)
- The Total XP / player-level threshold formula (`15000 + level × 1000`) is unchanged.
- The 5-region map (CORE / ARMS / LEGS / FRONT / BACK) is unchanged in structure.
- Express forge cycle path is untouched.
- The wger seed import process is in flight (`scripts/import-wger.js`, `scripts/wgerMap.js` already on dev as of 2026-05-03).

## Key Decisions

- **Combo trigger = completion consistency** — plan adherence is the engine.
- **Asymmetric breaking** — set-miss is forgiving (within-tier tick drop), day-miss is harsh (full tier drop or reset).
- **Layered build curve** — linear ramp within tiers + named tiers + overall exponential-with-cap shape + prestige loop. All four mechanics coexist.
- **Two parallel tracks** — Total XP is continuous and uses additive multipliers; Region stars are discrete and gated by wger weight bands.
- **Compound mult > isolation mult** in the additive total-XP stack.
- **Cap + overflow for compound** stars; **concentrate on primary** for isolation stars; **100%-one-region exercises curated as isolation**.
- **wger-seeded distribution** — each exercise has a region weight vector derived from wger primary/secondary data.
- **wger attribution in settings credits page — sufficient for license compliance.**
- **Visibility is moment-bound** — per-set popup animation reveals the breakdown briefly. No constant multiplier UI in the nav.

## Outstanding Questions

### Resolve Before Planning

- [Affects R2][User decision] Specific multiplier values: consistency_mult per tier (NOVICE 1.0 / IRON 1.3 / STEEL 1.7 / BLAZE 2.5 / OVERDRIVE 4.0 placeholder), compound_mult (1.5 placeholder), isolation_mult (1.2 placeholder), prestige_mult per ribbon (0.05 placeholder), holiday_mult per holiday (TBD per holiday).
- [Affects R6][User decision] How many sessions per tier? (How long does it take to climb NOVICE → IRON → STEEL → BLAZE → OVERDRIVE?)
- [Affects R8][User decision] Missed-day rule: full reset for ALL tiers, or full tier drop only (so OVERDRIVE → BLAZE on first miss, not 1.0× on first miss)?
- [Affects R8][User decision] Grace days / streak freezes? (Duolingo-style "1 free pass per month") or strict no-grace?
- [Affects R9][User decision] How many sessions at OVERDRIVE before prestige is available? Auto or opt-in?
- [Affects R12][User decision] Tie-breaking for overflow target when 2+ secondary regions have equal wger weight (squat: BACK 8 / CORE 8 — pick alphabetically? prefer narrow? prefer broad? split a fractional star?).
- [Affects R14][User decision] Curator pass: full list of exercises to hand-tag isolation despite wger listing secondary muscles. Known: lateral raise, reverse fly. Probably also: glute bridge, hip abduction, hip adduction, hyperextension, cable crossover (?), pec deck, leg curl (if wger lists glute as secondary), preacher curl. Curator reviews the full library after wger import and overrides as needed.
- [Affects R16][User decision] Which calendar holidays trigger? And what holiday_mult value(s) per holiday?
- [Affects R18][User decision] Exact format of the per-set popup multiplier breakdown text + any per-region star "pop" animation choreography.
- [Affects all][User decision] Where the user **views their current Consistency XP / current tier** (UI surface — settings? stats? a new dedicated panel?).

### Deferred to Planning

- [Affects R10][Technical] wger primary/secondary 60/40 weight split is a placeholder. Real fitness science may suggest different ratios. Worth a quick research pass when planning.
- [Affects R10][Technical] Does wger expose compound/isolation classification directly, or do we need to compute? (Classification is curated per R14 anyway, but wger may give a useful default.)
- [Affects R13][Technical] Storage shape for per-exercise region weights and classification — bake into `lib/exerciseLibrary.js` at import time, or compute lazily?
- [Affects R12][Technical] When a compound's overflow target is itself <30% — does the overflow STILL fire and award 1 star to that low-weight region, or is the second star forfeited? (Current spec: overflow fires regardless of receiver's raw share. Confirm.)
- [Affects R8][Technical] Detection of "missed planned day" — scheduled day passed without `done-{cycleId}-{iso}` flag. Implementation detail.
- [Affects R16][Technical] Holiday detection — local-machine date check vs server-side?

## Where We Are in the Conversation

- ✅ Existing XP algo confirmed (base XP via `weight × repMult × reps`, 1:1 muscle→region today)
- ✅ Multi-region distribution will be derived from wger primary/secondary data
- ✅ wger licensing understood (settings-credits attribution sufficient)
- ✅ **Two-track model**: continuous Total XP via additive multipliers; discrete Region stars via wger weight bands
- ✅ **Compound mult > isolation mult** in the additive total stack
- ✅ **Star bands**: <30% → 0★, 30–59% → 1★, 60%+ → 2★
- ✅ **Cap + overflow rule** for compound stars, **concentrate rule** for isolation stars
- ✅ **Curated classification**: 100%-one-region → isolation by default; curator can override
- ✅ Math walkthroughs verified (bench, deadlift, bicep curl, hip thrust)
- ✅ Asymmetric break: missed-set tick drop (forgiving), missed-day tier drop (harsh)
- ✅ Build curve: layered (linear within tiers + named tiers + exponential-cap shape + prestige loop)

**Next session**: pick up at the Outstanding Questions list. Biggest practical blocks: tier multiplier values (R5/R2), missed-day rule (R8), holiday list (R16), and curator pass for which exercises beyond hip-thrust/calf-raise should be hand-tagged isolation (R14).

## Next Steps

→ Resume `ce:brainstorm` with this doc as context. Walk the Outstanding Questions one at a time. Then `ce:plan` once Resolve Before Planning is empty.
