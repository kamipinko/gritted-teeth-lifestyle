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

**Base XP (existing formula, with new bodyweight handling)**
- R1. Base XP per set: `base = effective_load × repMult(reps) × reps`. The `repMult` curve is unchanged (flat 1.0× between r=5 and r=15, bell curves outside). Both new tracks build off this `base`.
- R1a. **`effective_load` calculation**:
  - **External-load exercises** (barbell, dumbbell, cable, machine, kettlebell, band): `effective_load = user_entered_weight` — the weight the user types in for that set. Unchanged from current behavior.
  - **Bodyweight exercises** (wger `equipment: 'bodyweight'`): `effective_load = user_bodyweight × bw_coefficient + user_entered_weight`. Default `bw_coefficient = 1.0` (use the user's full bodyweight). Curator can override per-exercise for cases where the actual moved load is less than full BW (push-up ≈ 0.64, dip ≈ 0.85 — exact coefficient list TBD, see Outstanding Questions). The `user_entered_weight` term lets weighted-bodyweight variants (weighted pull-up, weighted dip, vest squat) work naturally — user enters the added weight (e.g., +25 lb) and the system adds it to the BW base.
  - **Required prerequisite**: the user's bodyweight must be stored in their profile (read at workout time). If unset, fall back to prompting the user before the first BW-exercise set or use a profile-default placeholder (TBD, see Outstanding Questions).

**Total XP track (continuous, additive multipliers)**
- R2. The Total XP added per set = sum of contributions from each active multiplier:
  ```
  total_visible_XP =
      base × consistency_mult
    + base × class_mult         // class_mult = isolation_mult OR compound_mult OR king_compound_mult
    + base × holiday_mult       // 0 if no holiday active
    + base × prestige_mult      // 0 if no prestige bonus
  ```
  Inactive multipliers (no holiday today, no prestige badges) contribute 0. The classification multiplier scales with category: **`king_compound_mult` > `compound_mult` > `isolation_mult`** (placeholders 2.0 / 1.5 / 1.2 — tunable). Heavier-category lifts earn more raw total XP per set.
- R3. The user sees a **single visible XP number** in the per-set popup animation — equal to the sum above. That number adds to `totalXP` (the existing player-level driver). The popup briefly reveals the breakdown ("+base × 1.3 consistency + base × 1.5 compound = +visible_XP").

**Region star track (discrete, wger-driven)**
- R10. Each exercise has a region-weight vector derived from wger primary/secondary muscle data, mapped to GTL's 5 regions. Default heuristic: primary muscles get 60% of weight (split evenly across primary muscles), secondary muscles get 40% (split evenly across secondaries). Tunable.
- R10a. **wger → region mapping uses DUAL SEMANTICS** — upper-body and lower-body muscles map differently:
  - **Upper-body muscles** use torso-only semantics. FRONT = front of torso (chest / pectorals, serratus). BACK = back of torso (lats, rhomboids, traps, erector spinae). ARMS = all limb muscles in the upper limbs including all three deltoid heads (anterior, medial/lateral, posterior — they sit on the upper arm). CORE = abdominals.
  - **Lower-body muscles** use position-of-leg semantics. FRONT = quads (front of leg). BACK = hamstrings (back of leg). LEGS = catch-all for the rest of the leg muscles: glutes, calves, adductors, abductors.
  - The same region IDs (FRONT, BACK) carry dual meaning depending on the muscle's body half. A bench press grows FRONT via chest; a squat grows FRONT via quads — both are anatomically "front of body" so the dual semantics aligns with what the user feels: FRONT = front of you, BACK = back of you, regardless of upper vs lower half.
  - Practical effect: lower-body lifts no longer dump all their XP into LEGS. Compound lower-body lifts (squat, deadlift, leg press) naturally distribute across FRONT/BACK/LEGS based on which leg muscles they target.
- R11. Star bands (per region, per set) — **legacy / advisory**, no longer drive star awards under the amended R12/R12b/R13 rules. Retained as a quick visual reference for "what % share roughly corresponds to a star tier" when curating new exercises:
  - `< 30%` wger weight → roughly stabilizer / not-a-real-target territory
  - `30–59%` → meaningful secondary
  - `60%+` → primary target
- R12. **Compound exercises (regular)** award 1★ each to the **top 2 wger-weight regions**. Band thresholds (R11) do NOT gate this — the top 2 always earn a star regardless of raw share. Tiebreak when the second slot is contested (multiple regions with equal wger weight): alphabetical (deterministic; can be revisited). The Total XP track applies `compound_mult` (placeholder 1.5) per R2.
- R12b. **King Compound exercises** award 1★ each to the **top 3 wger-weight regions** instead of top 2. Curator-tagged per exercise (boolean `is_king_compound`). Default King-tagged at import: back squat, front squat, sumo squat, paused squat, conventional deadlift, sumo deadlift, trap bar deadlift, stiff-leg deadlift, Romanian deadlift, standard leg press, vertical leg press, barbell hack squat, machine hack squat. Curator can opt other major variants in or out. Single-leg variants (single-leg leg press, single-leg squat) typically NOT King — they cut intensity. The Total XP track applies `king_compound_mult` (placeholder 2.0, larger than `compound_mult`) per R2.
- R13. **Isolation exercises** concentrate on the **single highest-weight region** — that region earns 2★. All other regions earn 0★ regardless of their raw share. Band thresholds do NOT gate the 2★ award. The Total XP track applies `isolation_mult` (placeholder 1.2, smaller than `compound_mult`) per R2.
- R14. **Classification (compound vs isolation) is a curated per-exercise property**, not auto-derived. Auto-classification rule (used at wger import time, after R10a region mapping): if aggregated wger weight is 100% in one region (e.g., hip thrust, calf raise, leg extension, bicep curl, tricep extension, front raise — anterior delt isolation now lands at ARMS 100%), default to **isolation**. Otherwise default to compound. **Curator pass required after import** — Jordan reviews and hand-overrides exercises that the auto-rule miscategorizes. Known curator-override candidates: lateral raise (medial delt isolation, wger 60/40 ARMS/BACK → defaults compound), reverse fly / rear delt fly (rear delt isolation, wger 60/40 ARMS/BACK), and any other exercise where wger lists a stabilizer as secondary but training intent is single-target.

**Consistency / Combo Identity**
- R4. **Consistency XP** is a new, separate counter (parallel to Total XP). It accumulates from completing planned sessions on planned days. Its level determines the **Consistency multiplier** value (R2).
- R5. The combo identity has named tiers: **NOVICE → IRON → STEEL → BLAZE → OVERDRIVE**. Each tier has an associated multiplier value (placeholder: 1.0 / 1.3 / 1.7 / 2.5 / 4.0 — tunable).
- R6. Within a tier, Consistency XP grows via small per-session ticks (linear ramp), so multiplier increments smoothly inside the tier.
- R7. Tier crossings get a P5/Gurren rank-up flourish (kanji, color, animation) when the user enters a new named tier.
- R8. **Completion-threshold break and partial-credit rule** (refined 2026-05-04):
  - **<50% of planned sets completed** for a session → combo **resets** (consistency tier drops to NOVICE, multiplier returns to 1.0×).
  - **≥50% but <100% completed** → combo is **preserved** (tier stays where it was). The consistency multiplier credit for that day's XP is **scaled linearly by completion percentage**: at 75% completion, only 75% of the consistency contribution applies; at 50%, only 50% applies. The other multipliers in the stack (compound/isolation, holiday, prestige) apply at **full strength regardless** — they are exercise/event facts, not combo facts.
  - **100% of planned sets completed** → full consistency multiplier credit, plus tier-advancement progress per R6.
  - The completion percentage is computed from `sets_logged_today / sets_planned_today` (where "planned" = the attuned set count from the Attune Movements page).
- R8a. **End-of-day reckoning model**: per-set XP that is logged in real time credits the immediate stack contributions (compound/isolation, holiday, prestige). The **consistency contribution is deferred** and computed at end-of-day once the completion percentage is known — `day_consistency_contribution = (sum_of_day_base_XP) × consistency_mult × completion_pct` (where `completion_pct = 0` if <50%). This avoids per-set-rollback complexity and lets the user see the consistency reward as a clear end-of-session payoff. UX detail (how it appears in the per-set animation vs end-of-day animation) is an open question for planning.

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
- wger weights aggregate (R10a — anterior delt now ARMS): FRONT 73% (chest + serratus) / ARMS 26% (anterior delt + triceps)
- Region star track (compound, cap+overflow): FRONT capped at 1★ (would have been 2★ at 73%); second star overflows to next-highest = ARMS (already at 26% raw, but compound rule limits to 1★ anyway). Result: **FRONT 1★ + ARMS 1★**

**Example 2 — Bicep curl 60 × 5 (isolation)**
- Base = 60 × repMult(5) × 5 = 60 × 1.0 × 5 = **300**
- Total XP track: 300 × 1.3 + 300 × 1.2 = 390 + 360 = **+750 to totalXP**
- wger weights: ARMS 100%
- Region star track (isolation, concentrate): only highest region (ARMS) earns stars. ARMS at 100% → 2★. Result: **ARMS 2★**

**Example 3 — Deadlift 315 × 5 (compound, dual-semantics distribution)**
- Base = 315 × repMult(5) × 5 = 315 × 1.0 × 5 = **1575**
- Total XP track: 1575 × 1.3 + 1575 × 1.5 = 2048 + 2363 = **+4411 to totalXP**
- wger weights under R10a dual semantics:
  - Glutes (LEGS) 20%, Hams (BACK) 20%, Erector (BACK — torso) 20% (primaries)
  - Quads (FRONT) 10%, Traps (BACK) 10%, Forearms (ARMS) 10%, Abs (CORE) 10% (secondaries)
- Aggregate: BACK 50%, LEGS 20%, FRONT 10%, ARMS 10%, CORE 10%
- Region star track (compound): no region exceeds 60%, no overflow. BACK 1★ (50%), LEGS 0★ (<30%), FRONT 0★ (<30%). Wait — only BACK clears 30%. Compound rule expected 2 regions × 1★. Edge case: only one region above threshold. **Result: BACK 1★ only** (under-distribution edge case — see Outstanding Questions for the "always award at least 2 stars on a compound" question).

**Example 3b — Squat 225 × 8 (KING COMPOUND, dual-semantics distribution)**
- Base = 225 × 1.0 × 8 = **1800**
- Total XP track: 1800 × 1.3 (consistency) + 1800 × **2.0** (king_compound_mult, larger than regular compound_mult) = 2340 + 3600 = **+5940 to totalXP**
- wger weights under R10a dual semantics:
  - Quads (FRONT) 60% (primary)
  - Glutes (LEGS) 8%, Hams (BACK) 8%, Erector (BACK) 8%, Abs (CORE) 8%, Calves (LEGS) 8%
- Aggregate: FRONT 60% / BACK 16% / LEGS 16% / CORE 8%
- Region star track (King Compound — top 3 regions × 1★): FRONT, BACK, LEGS (BACK and LEGS tied for slot 3, both within top 3 anyway)
- Result: **FRONT 1★ + BACK 1★ + LEGS 1★** (3 stars total) — squat grows front-of-body, back-of-body, AND the LEGS catch-all simultaneously. King reward.

**Example 3c — Deadlift 315 × 5 (KING COMPOUND, dual-semantics distribution)**
- Base = 315 × 1.0 × 5 = **1575**
- Total XP track: 1575 × 1.3 + 1575 × 2.0 = 2048 + 3150 = **+5198 to totalXP**
- wger weights under R10a dual semantics:
  - Glutes (LEGS) 20%, Hams (BACK) 20%, Erector (BACK) 20% (primaries — note hams + erector aggregate to BACK)
  - Quads (FRONT) 10%, Traps (BACK) 10%, Forearms (ARMS) 10%, Abs (CORE) 10% (secondaries)
- Aggregate: BACK 50% / LEGS 20% / FRONT 10% / ARMS 10% / CORE 10%
- Region star track (King Compound — top 3 regions × 1★): BACK, LEGS, then a 3-way tie at 10% for slot 3. Alphabetical tiebreak → ARMS.
- Result: **BACK 1★ + LEGS 1★ + ARMS 1★** (3 stars total) — deadlift grows back-of-body (hams/erector dominant), the leg catch-all (glutes), and ARMS (grip via forearms).

**Example 4 — Hip thrust (curated isolation under dual semantics)**
- wger weights under R10a dual semantics: glutes (LEGS) 60% / hams (BACK) 20% / quads (FRONT) 20%
- Auto-classify: not 100% one region → defaults compound. Curator override per R14: hip thrust is a glute isolation; the hams/quads involvement is incidental.
- Curator-override classification: **isolation**.
- Region star track (isolation, concentrate on highest = LEGS at 60%): LEGS 2★. Result: **LEGS 2★**

## "Compound = 2×1 stars, Isolation = 1×2 stars" Rule Audit

The cap-and-overflow rule (R12) + concentrate rule (R13) + 100% reclassification rule (R14) collectively force every exercise to satisfy the 2×1 / 1×2 ideal. Audit of canonical lifts:

| Lift | Class | Raw weights | Stars after rules |
|---|---|---|---|
| Bench press | compound | FRONT 73 / ARMS 26 | FRONT 1★ + ARMS 1★ ✓ |
| Squat | **KING COMPOUND** | FRONT 60 / BACK 16 / LEGS 16 / CORE 8 | FRONT 1★ + BACK 1★ + LEGS 1★ (3 stars, all top 3) |
| Deadlift | **KING COMPOUND** | BACK 50 / LEGS 20 / FRONT 10 / ARMS 10 / CORE 10 | BACK 1★ + LEGS 1★ + ARMS 1★ (3 stars; alphabetical tiebreak for slot 3) |
| Pull-up | compound | BACK 50 / ARMS 50 | BACK 1★ + ARMS 1★ ✓ |
| Overhead press | compound | ARMS 73 / BACK 13 / FRONT 13 | ARMS 1★ + (BACK or FRONT) 1★ ✓ |
| Bent-over row | compound | BACK 84 / ARMS 16 | BACK 1★ + ARMS 1★ ✓ |
| Lunge | compound | FRONT 60 / LEGS 16 / BACK 16 / CORE 8 | FRONT 1★ + (BACK or LEGS) 1★ ✓ |
| Romanian deadlift | **KING COMPOUND** | BACK 60 / LEGS 20 / FRONT 20 | BACK 1★ + LEGS 1★ + FRONT 1★ (3 stars) |
| Leg press | **KING COMPOUND** | FRONT 60 / LEGS 20 / BACK 20 | FRONT 1★ + LEGS 1★ + BACK 1★ (3 stars) |
| Hack squat | **KING COMPOUND** | FRONT 60 / LEGS 20 / BACK 20 | FRONT 1★ + LEGS 1★ + BACK 1★ (3 stars) |
| Hip thrust | compound | LEGS 60 / BACK 20 / FRONT 20 | LEGS 1★ + BACK 1★ (or FRONT) — no longer needs curator override; natural compound result |
| Calf raise | isolation (auto) | LEGS 100 | LEGS 2★ ✓ (calves all map to LEGS catch-all) |
| Glute kickback | isolation (auto) | LEGS 100 | LEGS 2★ ✓ |
| Hip abduction / adduction | isolation (auto) | LEGS 100 | LEGS 2★ ✓ |
| Leg curl | isolation (auto) | BACK 100 (hams) | BACK 2★ ✓ — hams now route to BACK under dual semantics |
| Leg extension | isolation (auto) | FRONT 100 (quads) | FRONT 2★ ✓ — quads now route to FRONT under dual semantics |
| Bicep curl | isolation | ARMS 100 | ARMS 2★ ✓ |
| Front raise | isolation (auto) | ARMS 100 (anterior delt) | ARMS 2★ ✓ |
| Lateral raise | isolation (curated) | ARMS 60 / BACK 40 | ARMS 2★ ✓ (curator override) |
| Reverse fly | isolation (curated) | ARMS 60 / BACK 40 | ARMS 2★ ✓ (curator override) |
| Pec deck | isolation (auto) | FRONT 100 | FRONT 2★ ✓ |
| Cable crossover | isolation (curated) | FRONT 70 / ARMS 30 | FRONT 2★ ✓ (curator override) |
| Hyperextension | compound | BACK 60 / LEGS 40 | BACK 1★ + LEGS 1★ (stay compound per Jordan) |
| DB pullover | compound | BACK 50 / FRONT 50 | BACK 1★ + FRONT 1★ (stay compound per Jordan) |
| Sit-up / crunch / Russian twist / deadbug / wood chopper / ab wheel etc. | isolation (curated) | CORE-dominant w/ stabilizer secondaries | CORE 2★ ✓ (curator override — all CORE-primary moves are isolation) |

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
- [Affects R14][User decision — confirmed] Curator override roster (locked 2026-05-03): lateral raise → ARMS 2★; reverse fly → ARMS 2★; cable crossover → FRONT 2★; all CORE-primary moves (sit-up, crunch, Russian twist, wood chopper, deadbug, ab wheel, hanging leg raise, cable crunch, Pallof press, bird dog) → CORE 2★. Stay compound (no override): hyperextension, pullover, hip thrust. Auto-classify correctly (no override): bicep curl, leg curl, leg extension, calf raise, hip abduction, hip adduction, glute kickback, frog pump, pec deck, front raise, concentration curl, tricep extensions, hammer curl. King Compound tagged: squat / deadlift / leg press / hack squat + major variants per R12b.
- [Affects R12b][User decision] `king_compound_mult` value placeholder = 2.0. Tunable. Should it be much higher (3.0?) to really reward the King lifts, or roughly aligned with compound (1.7?)?
- [Affects R12b][User decision] Final list of King-tagged variants. Default proposed: back/front/sumo/paused squat, conventional/sumo/trap-bar/stiff-leg/RDL deadlift, standard/vertical leg press, barbell/machine hack squat. Single-leg variants NOT King.
- [Affects R12][User decision] Tiebreak rule for compound second slot when equal-weight regions tie: alphabetical (proposed default), or prefer broad / prefer narrow.
- [Affects R1a][User decision] Curator-flagged bodyweight coefficient list. Likely candidates: push-up (~0.64), dip (~0.85), pike push-up, decline push-up. Most BW exercises stay at 1.0. Final coefficient values + which exercises need them TBD during library curation.
- [Affects R1a][Technical] Where is `user_bodyweight` stored in the GTL profile? Existing field, or new addition? If new, what UI surface captures it (settings page? first-time onboarding? prompt on first BW set logged?). Verify against the profile schema during planning.
- [Affects R1a][User decision] If `user_bodyweight` is unset when a BW set is logged, what's the fallback? (prompt user before first BW set / use a default placeholder like 150 lb / refuse to credit XP / treat as 0 weight).
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
- ✅ **wger → region map uses dual semantics (R10a)**: upper-body uses torso-only (chest=FRONT, lats=BACK, all delts=ARMS); lower-body uses position-of-leg (quads=FRONT, hams=BACK, glutes/calves/adductors/abductors=LEGS). Same region IDs, dual interpretation. Squat now distributes FRONT 60 / BACK 16 / LEGS 16 (was LEGS 84). Deadlift now BACK-dominant (was LEGS-dominant). Leg press auto-classifies compound (was 100% LEGS iso under torso-only mapping). Front raise still auto-iso ARMS 100%.
- ✅ **Curator override roster (final)**: lateral raise + reverse fly → ARMS 2★ isolation; cable crossover → FRONT 2★ isolation; all CORE-primary moves (sit-up, crunch, Russian twist, wood chopper, deadbug, ab wheel, hanging leg raise, cable crunch, Pallof press, bird dog) → CORE 2★ isolation. Hyperextension, pullover, hip thrust stay compound (no override). Hip thrust dropped from override list under dual semantics + amended R12.
- ✅ **King Compound exception (R12b)**: squats / deadlifts / leg press / hack squat (and major variants — see R12b) award **3 stars** (top 3 wger-weight regions × 1★ each) AND use a bigger Total XP multiplier `king_compound_mult` > `compound_mult` (placeholder 2.0 vs 1.5).
- ✅ **Amended star rules**: drop band-triggered overflow. Compound = top 2 regions × 1★. King Compound = top 3 × 1★. Isolation = top 1 × 2★. R11 bands become advisory only.
- ✅ **Unilateral / bilateral DB rule**: bilateral-simultaneous DB exercises (DB curl, DB press, DB lateral raise) AND truly unilateral exercises (Bulgarian split squat, single-arm row, pistol squat) both get `xpMultiplier = 2` to match barbell-equivalent volume. Unilateral exercises are assumed to have both sides completed before counting one full set.
- ✅ **Neck and rotator cuff exercises**: NOT mapped to any region — those exercises are out of the curated library scope.
- ✅ **Bodyweight exercises (R1a)**: `effective_load = user_bodyweight × bw_coefficient + user_entered_weight`. Default coefficient 1.0 (full BW); curator-flagged exceptions (e.g., push-up ~0.64, dip ~0.85) lower it for exercises where actual moved load is less than full BW. Weighted-BW variants (weighted pull-up, weighted dip, vest squat) naturally work via the `+ user_entered_weight` term.
- ✅ Asymmetric break: missed-set tick drop (forgiving), missed-day tier drop (harsh)
- ✅ Build curve: layered (linear within tiers + named tiers + exponential-cap shape + prestige loop)

**Next session — resume here:**

Newly settled (2026-05-04 session):
- ✅ Completion-threshold rule (R8 refined): <50% = combo reset; 50–99% = combo preserved with consistency mult scaled linearly by completion%; 100% = full credit. Only consistency mult scales — others apply at full strength.
- ✅ End-of-day reckoning model (R8a): per-set XP credits non-consistency contributions immediately; consistency contribution is computed at end-of-day once completion% is known.
- ✅ Bodyweight load rule (R1a): `effective_load = user_BW × bw_coefficient + entered_weight`; default coefficient 1.0; curator-flagged exceptions for push-up/dip etc.
- ✅ Partial-day tier advancement model (Hybrid): 100% advances, 75–99% maintains, 50–74% may drop one tier, <50% resets.

**Immediate next question (paused mid-conversation 2026-05-04):**

What's the underlying counter for tier progression — XP-threshold (consistency XP accumulates and crosses tier thresholds), consecutive-day streak (N consecutive 100% days for tier-up), cumulative-day count (lifetime 100%-days for tier-up, no decay), or hybrid (streak for tier, separate XP for record-keeping)? Jordan paused here wanting to clarify the mental model further.

**Tier names locked (2026-05-04 session, second pin)** — 18-tier teeth-grip ladder, all past-tense forms, all read as "[verb] teeth":

| Tier | Name | Notes |
|---|---|---|
| 1 | **RELAXED** | baseline — no multiplier (×1.0), combo dormant |
| 2 | **BRUSHED** | barely contact |
| 3 | **BARED** | display / intent |
| 4 | **CLASPED** | firm-gentle hold |
| 5 | **PRESSED** | sustained pressure |
| 6 | **WORKED** | sustained labor |
| 7 | **SQUEEZED** | compressed |
| 8 | **HARDENED** | firmed up |
| 9 | **LOCKED** | held fast |
| 10 | **DUG** | engaged deeply |
| 11 | **DRIVEN** | forced in (active force) |
| 12 | **GNAWED** | sustained tearing motion |
| 13 | **CLAMPED** | firm closure |
| 14 | **CLENCHED** | committed closure |
| 15 | **WRENCHED** | extreme twisting force |
| 16 | **GNASHED** | struggle / anguish |
| 17 | **BLOODIED** | battle-marked, post-fight |
| 18 | **GRITTED** | peak — won't give |

The tier names match the app's "Gritted Teeth" identity end-to-end — every tier reads naturally as "[verb] teeth." Multiplier values per tier still TBD (Outstanding Question — pending tier-counter mechanic decision).

**After that, remaining priority order:**
1. Tier multiplier values (NOVICE / IRON / STEEL / BLAZE / OVERDRIVE)
2. `king_compound_mult` value (placeholder 2.0)
3. Sessions per tier (pacing)
4. Grace days / streak freezes (Duolingo-style or strict)
5. Prestige unlock requirement + bonus magnitude
6. Holiday list + multiplier values
7. Where user views Consistency XP / current tier (UI surface)
8. Per-set popup multiplier breakdown format
9. Tiebreak rule for compound second slot
10. Bodyweight coefficient curator list + storage / fallback for `user_bodyweight`

## Next Steps

→ Resume `ce:brainstorm` with this doc as context. Walk the Outstanding Questions one at a time. Then `ce:plan` once Resolve Before Planning is empty.
