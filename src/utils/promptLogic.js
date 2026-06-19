/**
 * promptLogic — generates an improvisational prompt from user input.
 *
 * OpenScore's core engine. Given an ensemble size, an expressive character, a
 * structure, and a set of constraints, it produces a *composition-shaped*
 * object the PerformanceView can display directly:
 *
 *   { id, title, composer, year, duration, description, tags, seed, input, sections[] }
 *
 * A prompt is PRIMARILY TEXT: each section carries written instructions
 * (performanceNote + instructionBlocks). Occasionally — when it is pertinent
 * to the character and constraints — a section also carries an abstract
 * GRAPHIC SCORE (`section.visual`) for performers to interpret. There is no
 * staff notation or fixed pitch content; pitch material, when constrained,
 * is described in words.
 *
 * Generation is driven by a seeded PRNG so a prompt is reproducible and
 * shareable: the same input + seed always yields the same prompt.
 */

// ─────────────────────────────────────────────────────────────────────────
// Seeded RNG (mulberry32)
// ─────────────────────────────────────────────────────────────────────────

export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;
const range = (rng, lo, hi) => lo + rng() * (hi - lo);

// ─────────────────────────────────────────────────────────────────────────
// Vocabularies — the building blocks of generation. These are exported so the
// generator UI can read them directly; add an entry and a new option appears.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Pitch material is now a VERBAL constraint woven into the instructions —
 * each entry is a short instruction the performer reads, not notated pitches.
 */
export const PITCH_SETS = {
  free: {
    label: 'Free (any pitch)',
    instruction: 'Pitch is unrestricted — choose freely, but listen for what the ensemble already offers.',
  },
  pentatonic: {
    label: 'Pentatonic',
    instruction: 'Draw only from a pentatonic collection — five pitches per octave, no half-steps.',
  },
  openFifths: {
    label: 'Open fifths',
    instruction: 'Restrict pitch to stacked perfect fifths and their octaves; favour hollow, open sonorities.',
  },
  dorian: {
    label: 'Dorian mode',
    instruction: 'Stay within a single Dorian mode; let it colour the harmony without resolving.',
  },
  wholeTone: {
    label: 'Whole-tone',
    instruction: 'Use only whole-tone steps — no half-steps anywhere. Everything should feel weightless.',
  },
  octatonic: {
    label: 'Octatonic',
    instruction: 'Work within an octatonic collection (alternating whole- and half-steps) for a tense, symmetrical colour.',
  },
  chromaticCluster: {
    label: 'Chromatic clusters',
    instruction: 'Build dense chromatic clusters; adjacent half-steps and microtonal crowding are welcome.',
  },
  harmonicSeries: {
    label: 'Harmonic series',
    instruction: 'Tune to the natural harmonic series above a shared fundamental — favour overtones and just intervals.',
  },
};

/** Energy shapes density of activity in both text and graphics. */
export const ENERGY_LEVELS = {
  low: {
    label: 'Low — sparse & sustained',
    density: 0.3,
    text: 'Let long durations stretch beyond what is comfortable; events are rare and deliberate.',
  },
  medium: {
    label: 'Medium — flowing',
    density: 0.6,
    text: 'Keep a steady flow of activity, neither hurried nor static.',
  },
  high: {
    label: 'High — active & dense',
    density: 1.0,
    text: 'Keep the activity continuous and dense; avoid letting the texture thin out.',
  },
};

/**
 * Eight moods. `opening`/`listening` fragments compose the written prompt;
 * `visual` selects the graphic character used when a section gets a graphic.
 */
export const MOODS = {
  meditative: {
    label: 'Meditative',
    visual: 'calm',
    opening: [
      'Begin from stillness. Let the first sound arrive only when it must.',
      'Settle into a shared quiet before anyone plays.',
      'Enter slowly, one voice at a time, leaving wide space between entrances.',
    ],
    listening: [
      'Listen more than you play; let silences breathe.',
      'Match the resonance of the room before adding to it.',
      'Hold each sound until it fully decays before moving on.',
    ],
    tags: ['meditative', 'sustained', 'quiet'],
  },
  turbulent: {
    label: 'Turbulent',
    visual: 'jagged',
    opening: [
      'Erupt without warning. The opening should feel unstable.',
      'Begin mid-gesture, as if interrupting something already underway.',
      'Pile on density quickly — resist settling.',
    ],
    listening: [
      'Push against one another; let friction build.',
      'Interrupt, overlap, and contradict the prevailing texture.',
      'Surge and collapse; never hold a stable plateau for long.',
    ],
    tags: ['turbulent', 'dense', 'volatile'],
  },
  playful: {
    label: 'Playful',
    visual: 'scattered',
    opening: [
      'Toss the first idea lightly into the group and see who catches it.',
      'Open with a short gesture and pass it around the ensemble.',
      'Treat the material as a game — trade fragments quickly.',
    ],
    listening: [
      'Imitate and answer one another; keep it conversational.',
      'Surprise the ensemble, then make room for someone to surprise you.',
      'Let ideas mutate as they pass between players.',
    ],
    tags: ['playful', 'interactive', 'light'],
  },
  austere: {
    label: 'Austere',
    visual: 'spare',
    opening: [
      'State the material plainly. No ornament, no hurry.',
      'Begin with a single bare line and resist embellishing it.',
      'Let the structure be visible; play only what is essential.',
    ],
    listening: [
      'Keep gestures spare and deliberate.',
      'Favour restraint; one well-placed sound over many.',
      'Leave the architecture exposed — silence is part of the form.',
    ],
    tags: ['austere', 'spare', 'minimal'],
  },
  ceremonial: {
    label: 'Ceremonial',
    visual: 'measured',
    opening: [
      'Proceed as if in ritual — measured, weighted, inevitable.',
      'Begin with a single sustained call and let the ensemble answer in turn.',
      'Move in slow, deliberate cycles, as though marking time.',
    ],
    listening: [
      'Keep a shared, processional pulse beneath everything.',
      'Repeat gestures with small variation, like a rite being observed.',
      'Let each entrance feel formal and intended.',
    ],
    tags: ['ceremonial', 'ritual', 'processional'],
  },
  luminous: {
    label: 'Luminous',
    visual: 'radiant',
    opening: [
      'Open into brightness — high, clear, and shimmering.',
      'Let the first sounds glow rather than strike.',
      'Begin with shining sustained tones and let them radiate outward.',
    ],
    listening: [
      'Favour bright timbres and ringing overtones.',
      'Let textures shimmer and refract rather than settle.',
      'Build halos of sound around one another.',
    ],
    tags: ['luminous', 'bright', 'shimmering'],
  },
  mechanical: {
    label: 'Mechanical',
    visual: 'grid',
    opening: [
      'Start a small repeating mechanism and lock into it.',
      'Begin with a rigid, regular pattern and let it run.',
      'Establish a machine-like pulse and serve it exactly.',
    ],
    listening: [
      'Stay strictly in time; treat the pulse as non-negotiable.',
      'Interlock your pattern precisely with the others.',
      'Allow the mechanism to phase and grind, but never to relax.',
    ],
    tags: ['mechanical', 'rhythmic', 'relentless'],
  },
  nocturnal: {
    label: 'Nocturnal',
    visual: 'glow',
    opening: [
      'Begin in near-darkness — faint, distant sounds at the edge of hearing.',
      'Let the first events emerge like lights seen far off at night.',
      'Open quietly and sparsely, as though the room were asleep.',
    ],
    listening: [
      'Keep dynamics low and let sounds appear and vanish.',
      'Leave long, dark silences between distant gestures.',
      'Favour low, veiled timbres and soft attacks.',
    ],
    tags: ['nocturnal', 'dark', 'distant'],
  },
};

/** Technique invitations — added as optional instruction lines. */
export const TECHNIQUES = {
  multiphonics: 'Where possible, colour sustained sounds with multiphonics or split tones.',
  harmonics: 'Favour harmonics and overtones over fundamental tones.',
  microtones: 'Bend slightly above and below your pitches; exact tuning is not required.',
  noise: 'Admit breath, friction, key clicks, and other unpitched sounds as equal material.',
  glissando: 'Connect sounds with slow glissandi rather than discrete steps.',
  tremolo: 'Sustain energy with tremolo or rapid reiteration.',
  silence: 'Treat rests as active material — shape the silence as carefully as the sound.',
};

export const DYNAMIC_LADDER = ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff'];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const TITLE_NOUNS = ['Threshold', 'Drift', 'Aperture', 'Murmuration', 'Vestige', 'Tessera', 'Lacuna', 'Penumbra', 'Filament', 'Wake', 'Cairn', 'Verge'];

// ─────────────────────────────────────────────────────────────────────────
// Abstract graphic-score generation
// ─────────────────────────────────────────────────────────────────────────

const VIS_W = 1000;
const VIS_H = 320;

/** Base mark-type pools per mood visual character. */
const MARK_POOLS = {
  calm: ['dot', 'arc', 'ring', 'line'],
  jagged: ['line', 'cloud', 'bar', 'line'],
  scattered: ['dot', 'arc', 'ring', 'dot', 'bar'],
  spare: ['line', 'dot', 'line'],
  measured: ['bar', 'line', 'bar', 'dot'],
  radiant: ['ring', 'arc', 'dot', 'ring'],
  grid: ['bar', 'bar', 'line', 'dot'],
  glow: ['dot', 'cloud', 'ring'],
};

/** Extra mark types contributed by selected techniques. */
const TECHNIQUE_MARKS = {
  glissando: ['arc', 'line'],
  tremolo: ['wave', 'wave'],
  noise: ['cloud', 'cloud'],
  harmonics: ['ring'],
  microtones: ['wave'],
  multiphonics: ['bar'],
  silence: [],
};

/**
 * Decide whether a section should carry a graphic, then build it.
 * "Occasional and pertinent": probability rises with high energy, gestural
 * moods, and graphic-friendly techniques; the first section rarely gets one.
 */
function maybeBuildVisual(rng, { moodDef, energy, techniques, silenceRatio, dynamicRange, sectionIndex }) {
  let p = 0.28;
  if (energy === 'high') p += 0.18;
  if (['turbulent', 'mechanical', 'luminous', 'playful'].includes(moodDefKey(moodDef))) p += 0.15;
  if (techniques.some((t) => ['glissando', 'tremolo', 'noise'].includes(t))) p += 0.2;
  if (sectionIndex === 0) p -= 0.18; // let the piece open on words

  if (!chance(rng, Math.max(0.05, Math.min(0.85, p)))) return null;
  return buildVisual(rng, { moodDef, energy, techniques, silenceRatio, dynamicRange });
}

// Reverse-lookup a mood's key from its object (used only for the heuristic above).
function moodDefKey(moodDef) {
  return Object.keys(MOODS).find((k) => MOODS[k] === moodDef) || 'meditative';
}

/** Build an abstract graphic spec: a list of positioned marks across a timeline. */
export function buildVisual(rng, { moodDef, energy, techniques, silenceRatio, dynamicRange }) {
  const energyDef = ENERGY_LEVELS[energy] || ENERGY_LEVELS.medium;

  // How many marks: energy raises it, silence lowers it.
  const base = 4 + Math.round(energyDef.density * 18 * (1 - silenceRatio * 0.6));
  const count = Math.max(3, Math.min(26, base));

  // Mark-type pool: mood base + technique contributions.
  let pool = [...(MARK_POOLS[moodDef.visual] || MARK_POOLS.calm)];
  techniques.forEach((t) => {
    pool = pool.concat(TECHNIQUE_MARKS[t] || []);
  });

  // Stroke weight from the middle of the dynamic range (1..4px).
  const dynMid = (dynamicRange[0] + dynamicRange[1]) / 2 / (DYNAMIC_LADDER.length - 1);
  const weightFor = () => +(1 + dynMid * 3 + range(rng, -0.4, 0.4)).toFixed(2);

  const marks = [];
  const x0 = 60;
  const x1 = VIS_W - 60;
  const yMid = VIS_H / 2;
  const ySpread = VIS_H * 0.34;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = x0 + t * (x1 - x0) + range(rng, -22, 22);
    const y = yMid + range(rng, -ySpread, ySpread);
    const type = pick(rng, pool);
    const weight = weightFor();
    const accent = chance(rng, 0.1);

    switch (type) {
      case 'dot':
        marks.push({ type, x, y, r: range(rng, 3, 8) * (0.8 + dynMid), weight, accent });
        break;
      case 'ring':
        marks.push({ type, x, y, r: range(rng, 8, 22), weight, accent });
        break;
      case 'line': {
        const len = range(rng, 60, 220);
        const ang = range(rng, -0.5, 0.5);
        marks.push({
          type, x, y,
          x2: x + len * Math.cos(ang),
          y2: y + len * Math.sin(ang),
          weight, accent,
        });
        break;
      }
      case 'arc': {
        const len = range(rng, 80, 240);
        const x2 = x + len;
        const cy = y - range(rng, 30, 90) * (chance(rng, 0.5) ? 1 : -1);
        marks.push({ type, x, y, x2, y2: y + range(rng, -30, 30), cx: x + len / 2, cy, weight, accent });
        break;
      }
      case 'wave': {
        const len = range(rng, 90, 220);
        marks.push({ type, x, y, x2: x + len, amp: range(rng, 6, 18), weight, accent });
        break;
      }
      case 'bar': {
        const w = range(rng, 10, 26);
        const h = range(rng, 30, 120);
        marks.push({ type, x, y: y - h / 2, w, h, weight, accent });
        break;
      }
      case 'cloud': {
        const w = range(rng, 60, 140);
        const h = range(rng, 40, 110);
        const n = 8 + Math.floor(rng() * 16);
        const dots = Array.from({ length: n }, () => ({
          dx: range(rng, 0, w), dy: range(rng, 0, h), r: range(rng, 1, 2.6),
        }));
        marks.push({ type, x: x - w / 2, y: y - h / 2, w, h, dots, accent });
        break;
      }
      default:
        marks.push({ type: 'dot', x, y, r: 5, weight, accent });
    }
  }

  return { width: VIS_W, height: VIS_H, marks };
}

// ─────────────────────────────────────────────────────────────────────────
// Text generation
// ─────────────────────────────────────────────────────────────────────────

function silenceText(ratio) {
  if (ratio < 0.15) return 'Sound is nearly continuous; rests are brief.';
  if (ratio < 0.35) return 'Balance sound and silence — let space punctuate the texture.';
  if (ratio < 0.55) return 'Silence is structural; there is often more silence than sound.';
  return 'Silence dominates — each sound is a rare, deliberate event.';
}

function buildSectionText(rng, { moodDef, energy, pitchSet, dynamicRange, silenceRatio, techniques, sectionIndex, sectionCount, hasVisual }) {
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === sectionCount - 1;
  const energyDef = ENERGY_LEVELS[energy] || ENERGY_LEVELS.medium;

  const lines = [];
  lines.push(isFirst ? pick(rng, moodDef.opening) : pick(rng, moodDef.listening));
  lines.push(pick(rng, moodDef.listening));
  lines.push(energyDef.text);
  if (isLast) lines.push('Bring the piece to rest gradually — the ending should feel inevitable, not abrupt.');
  const performanceNote = lines.join(' ');

  const blocks = [];

  // Constraints summary.
  const pitch = (PITCH_SETS[pitchSet] || PITCH_SETS.free).instruction;
  const dynLo = DYNAMIC_LADDER[Math.min(dynamicRange[0], dynamicRange[1])];
  const dynHi = DYNAMIC_LADDER[Math.max(dynamicRange[0], dynamicRange[1])];
  const dynText = dynLo === dynHi
    ? `Stay at ${dynLo} throughout.`
    : `Dynamics range from ${dynLo} to ${dynHi}; never exceed ${dynHi}.`;
  blocks.push({ position: 'instruction', text: `${pitch} ${dynText} ${silenceText(silenceRatio)}` });

  // Techniques.
  const techLines = techniques.map((t) => TECHNIQUES[t]).filter(Boolean);
  if (techLines.length) blocks.push({ position: 'instruction', text: techLines.join(' ') });

  // Guidance for interpreting a graphic, when present.
  if (hasVisual) {
    blocks.push({
      position: 'instruction',
      text: 'Read the graphic above as a loose map, not a script: left-to-right suggests time, height suggests register or intensity, and the weight of each mark suggests its force. Interpret it freely and in your own way.',
    });
  }

  return { performanceNote, instructionBlocks: blocks };
}

// ─────────────────────────────────────────────────────────────────────────
// Top-level generation
// ─────────────────────────────────────────────────────────────────────────

function sectionDurationNote(totalMinutes, sectionCount) {
  const per = totalMinutes / sectionCount;
  const lo = Math.max(1, Math.round(per * 0.8));
  const hi = Math.max(lo + 1, Math.round(per * 1.2));
  return `ca. ${lo}–${hi}'`;
}

/**
 * Generate a full improvisational prompt.
 *
 * @param {Object} input
 * @param {number} input.voiceCount    - number of voices / players (1–12)
 * @param {string} input.mood          - key of MOODS
 * @param {string} input.energy        - key of ENERGY_LEVELS
 * @param {number} input.sectionCount  - number of sections (1–10)
 * @param {number} input.totalMinutes  - approximate total duration
 * @param {string} input.pitchSet      - key of PITCH_SETS (verbal constraint)
 * @param {Array}  input.dynamicRange  - [loIndex, hiIndex] into DYNAMIC_LADDER
 * @param {number} input.silenceRatio  - 0..1, proportion of silence
 * @param {Array}  input.techniques    - keys of TECHNIQUES
 * @param {number} [input.seed]        - PRNG seed; random if omitted
 * @returns {Object} composition-shaped object
 */
export function generatePrompt(input) {
  const {
    voiceCount = 2,
    mood = 'meditative',
    energy = 'medium',
    sectionCount = 3,
    totalMinutes = 9,
    pitchSet = 'free',
    dynamicRange = [1, 4],
    silenceRatio = 0.3,
    techniques = [],
    seed = randomSeed(),
  } = input || {};

  const rng = makeRng(seed);
  const moodDef = MOODS[mood] || MOODS.meditative;
  const count = Math.max(1, Math.min(10, sectionCount));
  const voices = Math.max(1, Math.min(12, voiceCount));

  const sections = [];
  for (let s = 0; s < count; s++) {
    const visual = maybeBuildVisual(rng, {
      moodDef, energy, techniques, silenceRatio, dynamicRange, sectionIndex: s,
    });

    const { performanceNote, instructionBlocks } = buildSectionText(rng, {
      moodDef, energy, pitchSet, dynamicRange, silenceRatio, techniques,
      sectionIndex: s, sectionCount: count, hasVisual: !!visual,
    });

    sections.push({
      id: `section-${s + 1}`,
      title: ROMAN[s] || `${s + 1}`,
      durationNote: sectionDurationNote(totalMinutes, count),
      performanceNote,
      instructionBlocks,
      visual, // null, or { width, height, marks[] }
    });
  }

  const pitchLabel = (PITCH_SETS[pitchSet] || PITCH_SETS.free).label;
  const tags = [...new Set([...moodDef.tags, pitchLabel.toLowerCase(), `${energy} energy`, 'generated'])];

  return {
    id: `prompt-${seed}`,
    title: pick(rng, TITLE_NOUNS),
    composer: 'OpenScore (generated)',
    year: new Date().getFullYear(),
    duration: `ca. ${Math.round(totalMinutes * 0.85)}–${Math.round(totalMinutes * 1.15)}'`,
    description: `A generated improvisational prompt for ${voices} ${voices === 1 ? 'voice' : 'voices'}. Character: ${moodDef.label.toLowerCase()}, ${energy} energy, ${pitchLabel.toLowerCase()} pitch material.`,
    tags,
    seed,
    input: { ...input, voiceCount: voices },
    sections,
  };
}
