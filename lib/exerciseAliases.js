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
  // TRAZIONI are Italian isometric/pull names. MULTI(PRESS) covers wonky
  // multipurpose-rack-named entries. Others are mobility drills and generic
  // body-part labels that don't describe an exercise.
  /\b(?:TRX|BLACK\sWIDOW|BUS\sDRIVERS?|HERCULES\sPILLARS?|LATERAL\sWALK|WALL\sBALLS?|UPPER\sBACK|UPPER\sEXTERNAL|HORIZONTAL\sTRACTION|ISOMETRIA|TRAZIONI|REMADA|PULLBACK|MP|MULTIPRESS|MULTI\sPRESS)\b/i,

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
  // Curl dupes / niche
  'HAMMER CURLS',                // plural dup of HAMMER CURL
  'LYING DUMBBELL CURLS',        // odd lying-position dup
  'LYING BICEP CURL',            // dup of spider curl
  'BICEPS CURLS WITH DUMBBELL',  // dup of DUMBBELL CURL
  'STANDING BICEP CURL',         // dup of DUMBBELL CURL
  'CONCENTRATION CURL',          // dup of DUMBBELL CONCENTRATION CURL
  'REVERSE BAR CURL',            // dup of REVERSE CURL
  'REVERSE GRIP BARBELL CURLS',  // dup of REVERSE CURL
  'BICEPS CURL WITH CABLE',      // dup of CABLE CURLS
  'STRAIGHT BAR CABLE CURLS',    // dup of CABLE CURLS
  'LEG CURL',                    // ambiguous; dup of LEG CURLS (LAYING|SITTING|STANDING)

  // Press dupes
  'BENCH PRESS NARROW GRIP',                 // dup of CLOSE-GRIP BENCH PRESS
  'BENCHPRESS DUMBBELLS',                    // dup of DUMBBELL BENCH PRESS
  'INCLINE DUMBBELL BENCH PRESS',            // dup of INCLINE BENCH PRESS - DUMBBELL
  'INCLINE DUMBBELL PRESS',                  // dup
  'INCLINE CHEST PRESS DB',                  // dup
  'DUMBBELL CHEST PRESS',                    // dup of DUMBBELL BENCH PRESS
  'FLAT MACHINE PRESS',                      // dup of MACHINE CHEST PRESS
  'CHEST PRESS',                             // generic dup
  'MACHINE CHEST PRESS EXERCISE',            // dup with redundant suffix
  'LEVERAGE MACHINE CHEST PRESS',            // brand prefix dup; MACHINE CHEST PRESS canonical
  'OVERHEAD BARBELL PRESS',                  // dup of OVERHEAD PRESS
  'SHOULDER PRESS, BARBELL',                 // dup of OVERHEAD PRESS
  'SHOULDER PRESS, DUMBBELLS',               // dup of SHOULDER PRESS (DUMBBELL)
  'LEG PRESS ON HACKENSCHMIDT MACHINE',      // dup of HACK SQUATS
  'SUPINE PRESS',                            // dup of bench press
  'SEATED BENCH PRESS',                      // mis-named; CHEST PRESS already covers
  'SMITH MACHINE SLIGHT INCLINE PRESS',      // dup of HIGH-INCLINE SMITH MACHINE PRESS
  'SHOULDER PRESS, ON MULTI PRESS',          // multipress junk

  // Press niche / cues
  'DB UNDERHAND BENCH PRESS',
  'ELBOWS TUCKED DB BENCH PRESS',
  'NO LEG DRIVE DUMBBELL CHEST PRESS',
  'LARSEN PRESS',
  'DUMBELL TATE PRESS',
  'DUMBBELL BRADFORD PRESS',
  'DUMBBELL FROG PRESS',
  'KREIS PRESS DB',
  'INCLINE SHOULDER PRESS UP',
  'SMITH PRESS',                  // too generic
  'TRAP PRESS',                   // niche, dropped per Jordan call

  // Press combos (compound combo movements, same rule as CURL TO PRESS)
  'LANDMINE SQUAT TO PRESS',
  'GLUTE BRIDGE SINGLE-ARM PRESS',

  // Multipress junk
  'SHRUGS ON MULTIPRESS',
  'SQUATS ON MULTIPRESS',
  'UPRIGHT ROW, ON MULTI PRESS',

  // Niche bodyweight presses
  'DOUBLE-LEG ABDOMINAL PRESS',
  'SINGLE-LEG SIDE GLUTE PRESS',

  // Row dupes
  'BENT OVER DUMBBELL ROWS',                  // dup of DUMBBELL BENT OVER ROW (and mistagged barbell)
  'BENT OVER ROWING',                         // dup of BARBELL ROW (OVERHAND)
  'BENT OVER ROWING REVERSE',                 // dup of BARBELL ROW (UNDERHAND)
  'ROW',                                      // generic; BARBELL ROW (OVERHAND/UNDERHAND) cover
  'SEATED ROW (MACHINE)',                     // dup of SEATED MACHINE ROW
  'SINGLE ARM ROW',                           // generic; KROC ROW / SHOTGUN ROW cover
  'UNILATERAL CABLE ROW',                     // dup of LATERAL ROWS ON CABLE / SHOTGUN ROW
  'UPRIGHT ROW W/ DUMBBELLS',                 // dup of DUMBBELL UPRIGHT-ROW
  'ONE-ARM HEAVY ROW',                        // dup of KROC ROW
  'ROPE PULLOVER/ROW',                        // combo name
  'ROWING, T-BAR',                            // dup of T-BAR ROW (per Jordan call)
  'ROWING, LYING ON BENCH',                   // dup of INCLINE CHEST-SUPPORTED DUMBBELL ROW (per Jordan call)
  'LONG-PULLEY, NARROW',                      // dup of ROWING SEATED, NARROW GRIP
  // Row niche
  'ALTERNATIVE DB GORILLA ROWS',              // niche
  'DUMBBELL UNDERHAND DEAD ROW',              // niche
  'LYING DUMBBELL ROW SS SEATED SHRUG',       // superset combo
  'PERPENDICULAR UNILATERAL LANDMINE ROW',    // niche
  'HELMS ROW',                                // named-after niche (per Jordan call)
  'MEADOWS ROW',                              // named-after niche (per Jordan call)

  // Raise dupes
  'CALF RAISE USING HACK SQUAT MACHINE',      // niche; DOUBLE LEG CALF RAISE covers
  'CALF RAISES ON HACKENSCHMITT MACHINE',     // dup of CALF RAISE USING HACK SQUAT MACHINE
  'CALF RAISES, LEFT LEG',                    // single-leg already covered by CALF RAISES, ONE LEGGED
  'FRONT RAISES WITH PLATES',                 // dup of FRONT PLATE RAISE
  'SCHOULDER RAISE (DUMBBELL)',               // typo of SHOULDER, dup of LATERAL RAISES
  'SHOULDER RAISE SIDE AND FRONT DB',         // combo movement
  'LEG RAISES, LYING',                        // dup of LEG RAISE
  'LEG RAISES PULL UP BAR',                   // dup of HANGING LEG RAISES
  'LYING LEG RAISE',                          // dup of LEG RAISE
  'QUADRIPED ARM AND LEG RAISE',              // niche bird-dog
  'CABLE FRONT RAISE WITH A SMALL BAR',       // dup of STRAIGHT BAR CABLE FRONT RAISE (per Jordan call)

  // Squat dupes / niche
  '1 LEG BOX SQUAT',                          // niche
  'COSSACK SQUAT',                            // niche bodyweight
  'DUMBBELL SIDE SQUAT',                      // niche
  'HINDU SQUATS',                             // niche bodyweight
  'PAUSE HACK SQUATS',                        // technique not movement
  'SQUATS',                                   // generic dup of BARBELL SQUAT
  'WALL SQUAT',                               // isometric (wall sit)
  'BRACED SQUAT',                             // niche (per Jordan call)
  'DRAGON SQUAT',                             // niche (per Jordan call)
  'LOW BOX SQUAT - WIDE STANCE',              // niche (per Jordan call)
  'BARBELL FULL SQUAT',                       // dup of BARBELL SQUAT (per Jordan call)

  // Fly dupes
  'BENT OVER CABLE FLYE',                     // dup of CABLE REAR DELT FLY
  'BUTTERFLY SIT UP',                         // not a fly (ab exercise)
  'BUTTERFLY SUPERMAN',                       // not a fly (superman variant)
  'CABLE FLY MIDDLE CHEST',                   // dup of CABLE FLY
  'DUMBBELL INCLINE FLY',                     // dup of INCLINE DUMBBELL FLY
  'FLY WITH CABLE',                           // dup of CABLE FLY
  'REVERSE CABLE FLYE',                       // dup of CABLE REAR DELT FLY
  'SEATED CABLE CHEST FLY',                   // dup of CABLE FLY
  'MACHINE CHEST FLY',                        // dup of BUTTERFLY (pec deck)

  // Extension dup
  'TRICEPS EXTENSIONS ON CABLE WITH BAR',     // dup of TRICEPS EXTENSIONS ON CABLE

  // Shrug dupes / niche
  'SHOULDER SHRUG',                           // generic dup of SHRUGS, BARBELLS / DUMBBELLS
  'BARBELL SILVERBACK SHRUG',                 // niche (per Jordan call)

  // Pulldown dupes
  'MODIFIED PULLDOWN',                        // generic
  'WIDE-GRIP PULLDOWN',                       // dup of LAT PULLDOWN (WIDE GRIP)

  // Pushdown dupes / niche
  'ROCKING TRICEPS PUSHDOWN',                 // niche
  'TRICEP PUSHDOWN ON CABLE',                 // dup of TRICEPS PUSHDOWN

  // Pullover dup
  'PULLOVER',                                 // generic dup of DUMBBELL PULLOVER

  // Dip
  'RING DIPS',                                // rings not in 5-equipment library

  // Crunch dupes / niche
  '3008 ABDOMINAL CRUNCH',                    // wger ID prefix leak; ABDOMINAL CRUNCH covers
  'CRUNCHES',                                 // dup of ABDOMINAL CRUNCH
  'NEGATIVE CRUNCHES',                        // niche technique
  'WEIGHTED CRUNCH',                          // dup of DUMBBELL CRUNCHES
  'LEVITATION CRUNCH',                        // niche (per Jordan call)

  // Deadlift dupes
  'ROMANIAN DEADLIFT',                        // generic dup of BARBELL ROMANIAN DEADLIFT (RDL) / DUMBBELL ROMANIAN DEADLIFT
  'ROMANIAN DEADLIFT, SINGLE LEG',            // dup of SINGLE-LEG DEADLIFT WITH DUMBBELL

  // Lunge dupes / niche
  'ALTERNATE BACK LUNGES',                    // generic mistagged; DUMBBELL REAR LUNGE / BARBELL STEP BACK LUNGE cover
  'SLIDING LATERAL LUNGE',                    // niche (cossack-style)
  'UNILATERAL LUNGES',                        // generic dup

  // Bridge dupes / non-strength
  'BACK BRIDGE',                              // gymnastics back bridge, not strength
  'HIP BRIDGE',                               // dup of GLUTE BRIDGE
  'WALKING BRIDGE',                           // niche

  // Thrust dupes / niche
  'HIP THRUST',                               // generic dup of BARBELL HIP THRUST
  'SIT UP ELBOW THRUST',                      // niche ab
  'UNILATERAL HIP THRUST',                    // dup of DUMBBELL SINGLE-LEG HIP THRUST

  // Good morning dupes / niche
  'GOOD MORNING',                             // generic dup of GOOD MORNINGS
  'SEATED PANCAKE GOOD MORNING',              // niche
  'STANDING PANCAKE GOOD MORNING',            // niche

  // Junk / mobility / drills / typos
  'ARABESQUE',                                // ballet, not strength
  'DB UCV',                                   // unknown abbreviation
  'FROG STAND',                               // gymnastics balance
  'LEG WHEEL',                                // wger oddity
  'PAUSE BENCH',                              // technique not movement
  'PLATE TWIST',                              // niche rotational
  'PUNCHES',                                  // boxing drill
  'PUSH OHP',                                 // generic / dup of PUSH PRESS
  'REACH UPS',                                // mobility drill
  'ROLL DOWN',                                // pilates mobility
  'SCISSORS',                                 // bodyweight conditioning
  'SNACH',                                    // typo of SNATCH (Olympic anyway)
  'SPHINX',                                   // yoga/mobility
  'TOE TAPS',                                 // drill
  'TOE TOUCH',                                // generic / drill
  'TORSO TWIST',                              // generic rotational
  'VPUSHUP',                                  // typo of V PUSHUP, niche
  'WALL DRILLS',                              // running drill
  'WALL PUSHUP',                              // niche pushup variant
  'WALL SLIDES',                              // mobility drill
  'WALL ANGELS',                              // mobility drill
  'KNEELING SUPERMAN',                        // niche superman variant
  'TOWEL SUPERMAN',                           // niche superman variant
  'PRONE SCAPULAR RETRACTION - ARMS AT SIDE', // mobility
  'SCAPULA PULLS',                            // niche scap activation
  'HIP HINGE',                                // movement-pattern cue, not an exercise
  'BIRD DOG',                                 // mobility / stability, not hypertrophic
  'CLAMSHELL',                                // hip mobility / glute med isolation, niche

  // Rotation dupes
  'DUMBBELL SHOULDER ROTATIONS',              // generic dup
  'SHOULDER EXTERNAL ROTATION (CABLE)',       // dup of CABLE EXTERNAL ROTATION

  // Pec deck dup
  'PEC DECK',                                 // dup of BUTTERFLY
])

// Equipment overrides for entries where the auto-classified or wger-supplied
// equipment value is wrong. Applied AFTER EQUIPMENT_OVERRIDE and the wger
// equipment map but BEFORE the name-based fallback. Use this for known
// mistags that don't fit a regex pattern.
export const EQUIPMENT_FIXUP = {
  'CABLE CURLS':                            'cable',       // wger tagged 'machine'
  'BODYWEIGHT BICEPS CURL':                 'bodyweight',  // wger tagged 'machine'
  'SPIDER CURL':                            'dumbbell',    // wger tagged 'bodyweight' (spider curl is dumbbell on incline bench)
  'INCLINE SMITH PRESS':                    'machine',     // wger tagged 'bodyweight' (Smith machine = machine)
  'MACHINE CHEST PRESS':                    'machine',     // wger tagged 'barbell'
  'CLOSE-GRIP PRESS-UPS':                   'bodyweight',  // wger tagged 'machine' (close-grip pushups)
  'INCLINE CHEST-SUPPORTED DUMBBELL ROW':   'dumbbell',    // wger tagged 'barbell'
  'INVERTED ROWS':                          'bodyweight',  // wger tagged 'machine'
  'SEATED V-GRIP ROW':                      'cable',       // wger tagged 'bodyweight'
  'CHEST-SUPPORTED REAR DELT RAISE':        'dumbbell',    // wger tagged 'barbell'
  'BOX SQUAT':                              'barbell',     // wger tagged 'machine'
  'SMITH MACHINE SPLIT SQUAT':              'machine',     // wger tagged 'barbell'
  'SUMO SQUATS':                            'barbell',     // wger tagged 'machine'
  'REVERSE FLY STANDING':                   'dumbbell',    // wger tagged 'bodyweight'
  'ONE ARM OVERHEAD CABLE TRICEP EXTENSION':'cable',       // wger tagged 'bodyweight'
  'REVERSE HYPEREXTENSION':                 'machine',     // wger tagged 'barbell'
  'DIPS':                                   'bodyweight',  // wger tagged 'machine'
  'DIPS BETWEEN TWO BENCHES':               'bodyweight',  // wger tagged 'barbell'
  'BICYCLE CRUNCHES':                       'bodyweight',  // wger tagged 'machine'
  'REVERSE CRUNCH':                         'bodyweight',  // wger tagged 'machine'
  'SINGLE LEG GLUTE BRIDGE':                'bodyweight',  // wger tagged 'machine'
  'DUMBBELL SINGLE-LEG HIP THRUST':         'dumbbell',    // wger tagged 'barbell'
  'REVERSE WOOD CHOPS':                     'cable',       // wger tagged 'machine'
}
