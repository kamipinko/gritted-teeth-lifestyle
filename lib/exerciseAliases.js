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
// (does not enter ALL_EXERCISES). The library is curated for hypertrophic
// strength training only — bands, isometrics, cardio, plyometrics, Olympic
// lifts, calisthenic max-strength skills, and conditioning movements are all
// excluded.
//
// Intentionally preserved despite seeming matches:
//   - LEVERAGE MACHINE ISO ROW (ISO = isolateral, not isometric)
//   - HANGING LEG RAISE (HANGING != HANG due to word-boundary rule)
export const EXERCISE_DENYLIST_PATTERNS = [
  // Bands / elastic resistance
  /\b(?:BAND|BANDED|ELASTIC|MONSTER\sWALK)\b/i,

  // Isometric: planks (strict, includes dynamic plank variants), holds,
  // hangs, stretches, wall-sits, L-sits, horse stances
  /\b(?:PLANK|WALL[- ]SIT|HOLLOW\sHOLD|L[- ]SIT|DEAD\s?HANG|ISOMETRIC|HORSE\sSTANCE|STRETCH|HOLD|HANG|BRIDGE\sHOLD)\b/i,

  // Cardio / mobility / movement drills
  /\b(?:JUMPING\sJACKS?|SQUAT\sTHRUST|BEAR\sCRAWL|BEAR\sWALK|CRAB\sWALK|INCHWORM|LATERAL\sPUSH\sOFF|WALL\sDRILL|SNAP\sDOWN|ELEPHANT\sWALK|SIDE\sSLIDES|FOAM\sROLLER|FOAM\sROLLING|DORSIFLEXION|PLANTARFLEXION|ANKLE\sROCKS|LEG\sSWINGS)\b/i,

  // Cardio machines / running / cycling
  /\b(?:RUN|RUNNING|SPRINT|JOG|JOGGING|TREADMILL|ELLIPTICAL|STAIR\sCLIMBER|CYCLE|CYCLING|BIKE|BIKING)\b/i,

  // Plyometrics (power, not hypertrophic). JUMPS? matches both JUMP and JUMPS.
  /\b(?:SKATER|JUMPS?)\b/i,

  // Junk / non-strength residuals that survive other patterns. TRX is a
  // suspension trainer (not in our 5 equipment categories). ISOMETRIA and
  // TRAZIONI are Italian isometric/pull names. Others are mobility drills
  // and generic body-part labels that don't describe an exercise.
  /\b(?:TRX|BLACK\sWIDOW|BUS\sDRIVERS?|HERCULES\sPILLARS?|LATERAL\sWALK|WALL\sBALLS?|UPPER\sBACK|UPPER\sEXTERNAL|HORIZONTAL\sTRACTION|ISOMETRIA|TRAZIONI|REMADA|PULLBACK|MP)\b/i,

  // Partial-ROM oddities: floor presses (FLOOR BENCH PRESS family + DUMBBELL
  // FLOOR PRESS) and pin-press variants (PIN BENCH PRESS, PIN OHP, PIN SQUAT,
  // PIN PRESS). FLOOR SKULL CRUSHER is intentionally not matched — it's a
  // different exercise (lying tricep extension on the floor).
  /\b(?:FLOOR\s(?:DUMBBELL\s)?BENCH\sPRESS|DUMBBELL\sFLOOR\sPRESS|PIN\s(?:BENCH\sPRESS|OHP|SQUAT|PRESS))\b/i,

  // Olympic lifts (power, not hypertrophic)
  /\b(?:CLEAN|SNATCH|JERK|HIGH\sPULL)\b/i,

  // Calisthenic max-strength skills (skill-heavy, not hypertrophic)
  /\b(?:MUSCLE.UP|HANDSTAND|DRAGON.FLAG|FRONT\sLEVER|BACK\sLEVER|HUMAN\sFLAG|PISTOL\sSQUAT|PLANCHE)\b/i,

  // Rotational core + conditioning (Russian twist, med ball, Turkish get-up,
  // KB swing — borderline core/conditioning, not hypertrophic)
  /\b(?:RUSSIAN\sTWIST|MEDICINE\sBALL|MED\sBALL|TURKISH|GET[- ]UP|KETTLEBELL\sSWING)\b/i,

  // wger metadata leaks: HD suffix entries are duplicates of cleaner-named
  // exercises (BENCH DIPS ON FLOOR HD vs BENCH DIPS ON FLOOR, etc.)
  /\bHD\b/i,

  // wger metadata leaks: " - NB" suffix entries are duplicates of cleaner-named
  // exercises (BARBELL BENCH PRESS - NB vs BENCH PRESS, etc.)
  /\s-\s*NB\s*$/i,

  // wger ID-disambiguated duplicates: when two wger entries share a normalized
  // name, the import appends "(wgerId)" to the second. The suffixed copy
  // always points at the same concept as the clean-name version.
  /\(\d{3,5}\)\s*$/,

  // Spanish-but-ASCII duplicates: Spanish-language wger entries that escape
  // the non-ASCII filter and duplicate clean English entries. Note: FLEXION
  // is intentionally excluded — it's also an English medical term (e.g.,
  // "TRUNK FLEXION" is a valid oblique exercise).
  /\b(?:POLEA|JALONES|JALON|REMO|SENTADILLA|MANCUERNA|ESTIRAMIENTO|EXTENSION\sDE|ELEVACION|EMPUJE|PATADA|PIERNAS|PECHO\sNEUTRO|AGARRE\sPRONO|AGARRE\sSUPINO|POLEA\sALTA|POLEA\sBAJA)\b/i,

  // FFLY typo of FLY (CABLE FLY and LOW PULLEY CABLE FLY exist clean)
  /\bFFLY\b/i,

  // Non-ASCII names: broken-encoding Spanish/German wger entries that
  // duplicate clean-English entries already in the library
  /[^\x00-\x7f]/,

  // Kettlebell entries: kettlebell isn't in the 5-equipment library
  // (machine/cable/dumbbell/barbell/bodyweight), so all KB-named exercises
  // are dropped regardless of how wger tagged them.
  /\bKETTLEBELL\b/i,

  // Niche curl techniques most lifters never program: drop-set, cheat-rep,
  // drag-curl, kong-curl, seated-W, bicep-curl-to-press, shoulder-elevated,
  // wide-grip, and German "BIZEPS" naming.
  /\b(?:BIZEPS|TRIFECTA|DROP\sCURL|CHEAT\sCURL|DRAG\sCURLS?|KONG\sCURL|SEATED\sW\sCURL|CURL\sTO\sPRESS|SHOULDER\sELEVATED|WIDE\sBICEP\sCURLS?)\b/i,
]

// Exact-match denylist for entries that don't fit a regex category and need
// removal. Currently scoped to plural duplicates and oddly-named entries that
// have cleaner-named equivalents in the library. Consumed by import-wger.js
// alongside EXERCISE_DENYLIST_PATTERNS.
export const EXERCISE_DENYLIST_EXACT = new Set([
  'HAMMER CURLS',          // plural dup of HAMMER CURL
  'LYING DUMBBELL CURLS',  // odd lying-position dup; equivalent to spider/preacher/incline curl variants
  'LYING BICEP CURL',      // same — lying bicep curl is essentially spider curl
])

// Equipment overrides for entries where the auto-classified or wger-supplied
// equipment value is wrong. Applied AFTER EQUIPMENT_OVERRIDE and the wger
// equipment map but BEFORE the name-based fallback. Use this for known
// mistags that don't fit a regex pattern.
export const EQUIPMENT_FIXUP = {
  'CABLE CURLS':            'cable',       // wger tagged 'machine'
  'BODYWEIGHT BICEPS CURL': 'bodyweight',  // wger tagged 'machine'
  'SPIDER CURL':            'dumbbell',    // wger tagged 'bodyweight' (spider curl is dumbbell on incline bench)
}
