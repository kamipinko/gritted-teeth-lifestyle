# Bug — cycles in the Attune cycle list all appear identical

**Target:** GTL 1 worker. Branch: `dev`. Investigate first, then fix.

## SYMPTOM

Jordan reports: on the page where multiple saved cycles are listed (likely `/fitness/load` — REVIEW / EDIT path — or possibly `/attune`'s active-cycle render when switching cycles), **every cycle row/preview displays the same data** even though the cycles in `localStorage` have different `days`, `dailyPlan`, and chip stacks.

## INVESTIGATE

1. Identify the page Jordan is referring to. Most likely `/fitness/load/page.js` (the cycle list — see line 1144 mapping `cycles.map((cycle, i) => ...)`). If it's a different page, find it via grep:
   ```
   grep -rn "cycles\.map\|cycles\.forEach" app/fitness/ components/
   ```

2. Common causes of "all cycles look the same":
   - **Stale closure / shared selector**: a hook like `useChipsForDay` or `useAttunement` is being called with a fixed `cycleId` (e.g., the active one) instead of the per-row cycle's id. Result: every row renders the active cycle's data.
   - **Missing key prop / wrong key**: `<CycleRow key={i}>` instead of `key={cycle.id}` causes React to reuse DOM nodes incorrectly when cycle order changes — but usually shows ghost data, not "all the same."
   - **Memoized factory called once with wrong cycle**: a `useMemo`/`useCallback` outside the row component captures only one cycle and every row reads from the same memoized value.
   - **localStorage key shared across cycles**: `pk('cycles')` stores ALL cycles correctly, but a per-cycle render reads `pk('daily-plan')` (singular, no cycleId in the key), so every row reads the SAME daily plan. Check if any per-cycle preview reads from a global localStorage key instead of indexing into the cycle's own `dailyPlan` field.

3. Reproduce: seed three cycles with different `days` arrays into `gtl-KING-cycles`. Visit the suspected list page. Observe whether each row's preview content differs.

## FIX

Once root cause identified, apply the smallest fix that makes each cycle row render its own cycle's data. Don't refactor adjacent code.

## DO NOT

- Do not touch the Attune calendar redesign (`CycleCalendar.jsx`, `DayCell.jsx`, `SetChip.jsx`, `AutoAttuneButton.jsx`, `app/attune/page.js`).
- Do not change the `cycles` storage shape or the `pk()` keying scheme.
- Do not rename existing components.

## Commit and push

Single commit:

```
<area>: cycle list rows render their own cycle data (was all identical)
```

Replace `<area>` with the page name (e.g., `Load screen`, `Edit hub`, `Attune cycle list`).

Push to `origin/dev`.

## Report

- Commit hash.
- One-line description of the root cause and fix.
- One screenshot showing 3 cycles in the list with visibly different previews.
