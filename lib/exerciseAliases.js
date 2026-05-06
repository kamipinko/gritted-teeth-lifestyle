// lib/exerciseAliases.js
//
// Hand-curated overlays consumed by scripts/import-wger.js to enrich the
// generated lib/exerciseLibrary.js. Three independent maps:
//
//   EXERCISE_ALIASES   — exerciseId -> abbreviations the search box should match
//   FOREARMS_OVERLAY   — exercise IDs that should have 'forearms' added to muscles[]
//                        (wger doesn't tag forearms cleanly)
//   EQUIPMENT_OVERRIDE — exerciseId -> equipment enum override (for cable /
//                        kettlebell / band exercises wger doesn't categorize)
//
// Grow these freely — re-running `npm run import:exercises` picks up any edits.

export const EXERCISE_ALIASES = {
  'DEADLIFT':                  ['DL'],
  'ROMANIAN DEADLIFT':         ['RDL'],
  'STIFF-LEG DEADLIFT':        ['SLDL'],
  'OVERHEAD PRESS':            ['OHP', 'STRICT PRESS'],
  'BARBELL ROW':               ['BBR', 'BENT-OVER ROW'],
  'CLOSE-GRIP BENCH PRESS':    ['CGBP'],
  'BENCH PRESS':               ['BP', 'BENCH'],
  'INCLINE BENCH PRESS':       ['INCLINE BP'],
  'INCLINE DUMBBELL PRESS':    ['IDP'],
  'BARBELL CURL':              ['BBC'],
  'DUMBBELL CURL':             ['DBC'],
  'TRICEP PUSHDOWN':           ['PUSHDOWN'],
  'PULL-UP':                   ['PU', 'CHIN-UP'],
  'CHIN-UP':                   ['CU', 'PULL-UP'],
  'LAT PULLDOWN':              ['LPD', 'PULLDOWN'],
  'BULGARIAN SPLIT SQUAT':     ['BSS'],
  'GLUTE-HAM RAISE':           ['GHR'],
  'NORDIC CURL':               ['NORDIC'],
  'STANDING CALF RAISE':       ['SCR'],
  'SEATED CALF RAISE':         ['SCR-SEATED'],
  'HIP THRUST':                ['HT', 'BARBELL HIP THRUST'],
  'HACK SQUAT':                ['HS'],
  'LEG PRESS':                 ['LP'],
  'LEG EXTENSION':             ['LE'],
  'LEG CURL':                  ['LC', 'HAMSTRING CURL'],
  'AB WHEEL ROLLOUT':          ['ABWR', 'AB WHEEL'],
  'HANGING LEG RAISE':         ['HLR'],
  'CABLE CROSSOVER':           ['CC'],
  'CABLE FLY':                 ['CF'],
  'PLANK':                     ['FRONT PLANK'],
  'SIDE PLANK':                ['SP'],
  'LATERAL RAISE':             ['LR', 'SIDE RAISE'],
  'FACE PULL':                 ['FP'],
  'WRIST CURL':                ['WC'],
  'REVERSE WRIST CURL':        ['RWC'],
  'FARMER CARRY':              ['FARMER WALK'],
  'HAMMER CURL':               ['HC'],
}

// Exercise IDs that should have 'forearms' added to muscles[] at import time.
// wger doesn't have a clean forearms muscle tag — these are the exercises
// Jordan would expect to see when picking exercises for forearm day.
export const FOREARMS_OVERLAY = [
  'WRIST CURL',
  'REVERSE WRIST CURL',
  'HAMMER CURL',
  'FARMER CARRY',
]

// wger doesn't categorize cable, kettlebell, or band exercises cleanly.
// These overrides force a specific equipment enum value on import for
// the listed IDs. Equipment enum values: 'barbell', 'dumbbell', 'cable',
// 'machine', 'bodyweight', 'kettlebell', 'band', 'other'.
//
// Grow this list as new wger items appear in the imported data.
export const EQUIPMENT_OVERRIDE = {
  'CABLE CROSSOVER':       'cable',
  'CABLE FLY':             'cable',
  'CABLE ROW':             'cable',
  'TRICEP PUSHDOWN':       'cable',
  'FACE PULL':             'cable',
  'LAT PULLDOWN':          'cable',
}

// Regex patterns applied to exercise IDs at import time. Any wger entry whose
// normalized name matches ANY pattern below is dropped from the library
// (does not enter ALL_EXERCISES). Used to filter out band-resistance and
// isometric/static-hold exercises that GTL doesn't program against.
//
// LEVERAGE MACHINE ISO ROW is intentionally preserved (the `ISO` there means
// isolateral, not isometric — note the absence of `\bISO\b` from the patterns).
// HANGING LEG RAISE survives because `\bHANG\b` requires a word boundary
// after G, which "HANGING" doesn't satisfy.
export const EXERCISE_DENYLIST_PATTERNS = [
  // Bands / elastic resistance
  /\b(?:BAND|BANDED|ELASTIC|MONSTER\sWALK)\b/i,
  // Isometric: planks (strict, includes dynamic plank variants), holds,
  // hangs, stretches, wall-sits, L-sits, horse stances
  /\b(?:PLANK|WALL[- ]SIT|HOLLOW\sHOLD|L[- ]SIT|DEAD\s?HANG|ISOMETRIC|HORSE\sSTANCE|STRETCH|HOLD|HANG|BRIDGE\sHOLD)\b/i,
]
