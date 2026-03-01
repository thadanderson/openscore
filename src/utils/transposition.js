/**
 * Transposition utilities for open-score
 *
 * transposeNote(keys, semitones, preferFlats) — transposed VexFlow pitch strings
 * transposeKeySignature(concertKey, semitones) — written key for transposing instruments
 *
 * Tests (run in dev console):
 *   C + 2 → D    (Bb instrument)
 *   C + 9 → A    (Eb instrument)
 *   C + 7 → G    (F instrument)
 */

// Semitone offset for each diatonic note (C = 0)
const NOTE_TO_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// All known key names and their pitch class (for key lookup)
const KEY_FIFTHS = {
  Cb: -7, Gb: -6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1,
  C: 0,
  G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
};

// Accidental offset values
const ACC_TO_SEMITONES = {
  '##': 2, '#': 1, 'n': 0, '': 0, 'b': -1, 'bb': -2,
};

/**
 * Parse a VexFlow pitch string "e/4", "f#/4", "bb/3" etc.
 * Returns { letter (uppercase), accidental, octave, pitchClass (0-11), absoluteSemitone }
 */
function parsePitch(pitchStr) {
  const match = String(pitchStr)
    .trim()
    .match(/^([a-gA-G])(#{1,2}|bb?|n)?\/(\d+)$/);
  if (!match) {
    console.warn(`[transposition] Unrecognized pitch: "${pitchStr}" — using B/4`);
    return { letter: 'B', accidental: '', octave: 4, absoluteSemitone: 71 };
  }
  const letter = match[1].toUpperCase();
  const accidental = match[2] || '';
  const octave = parseInt(match[3], 10);
  const offset = ACC_TO_SEMITONES[accidental] ?? 0;
  const absoluteSemitone = NOTE_TO_SEMITONE[letter] + offset + (octave + 1) * 12;
  return { letter, accidental, octave, absoluteSemitone };
}

/**
 * Spell an absolute semitone as a diatonic pitch name.
 * @param {number} absSemitone
 * @param {boolean} preferFlats
 * @returns {{ letter, accidental, octave }}
 */
function spellPitch(absSemitone, preferFlats = false) {
  // Octave: C4 = semitone 60, so octave = floor(absSemitone/12) - 1
  const octave = Math.floor(absSemitone / 12) - 1;
  const pc = ((absSemitone % 12) + 12) % 12;

  // Enharmonic spelling tables
  const SHARP = [
    ['C',''], ['C','#'], ['D',''], ['D','#'], ['E',''],
    ['F',''], ['F','#'], ['G',''], ['G','#'], ['A',''], ['A','#'], ['B',''],
  ];
  const FLAT = [
    ['C',''], ['D','b'], ['D',''], ['E','b'], ['E',''],
    ['F',''], ['G','b'], ['G',''], ['A','b'], ['A',''], ['B','b'], ['B',''],
  ];

  const [letter, accidental] = (preferFlats ? FLAT : SHARP)[pc];
  return { letter, accidental, octave };
}

/**
 * Get the pitch class (0–11) for a key name like "C", "F#", "Bb"
 */
function keyPitchClass(keyStr) {
  const k = keyStr || 'C';
  const letter = k.replace(/b|#/g, '');
  const accAmt = k.includes('#') ? 1 : k.includes('b') ? -1 : 0;
  return ((NOTE_TO_SEMITONE[letter] || 0) + accAmt + 120) % 12;
}

/**
 * Transpose an array of VexFlow pitch strings by `semitones`.
 *
 * @param {string[]} noteKeys   — e.g. ["e/4", "g/4"]
 * @param {number}   semitones  — positive = up, negative = down
 * @param {boolean}  preferFlats
 * @returns {string[]}
 */
export function transposeNote(noteKeys, semitones, preferFlats = false) {
  if (!semitones) return noteKeys;
  return (noteKeys || []).map((key) => {
    const { absoluteSemitone } = parsePitch(key);
    const { letter, accidental, octave } = spellPitch(absoluteSemitone + semitones, preferFlats);
    return `${letter.toLowerCase()}${accidental}/${octave}`;
  });
}

/**
 * Transpose a concert-pitch key signature by `semitones` to get the written key.
 *
 * Examples:
 *   transposeKeySignature("C", 2)  → "D"    (Bb clarinet)
 *   transposeKeySignature("C", 9)  → "A"    (Eb alto sax)
 *   transposeKeySignature("C", 7)  → "G"    (F horn)
 *
 * @param {string} concertKey — e.g. "C", "F", "Bb", "G"
 * @param {number} semitones
 * @returns {string}
 */
export function transposeKeySignature(concertKey, semitones) {
  if (!semitones) return concertKey || 'C';

  const srcPC = keyPitchClass(concertKey || 'C');
  const destPC = ((srcPC + semitones) % 12 + 12) % 12;

  // Find the key in our table with this pitch class
  for (const kname of Object.keys(KEY_FIFTHS)) {
    if (keyPitchClass(kname) === destPC) return kname;
  }
  return 'C'; // fallback (shouldn't happen)
}

/**
 * Whether a key prefers flat spellings for accidentals.
 * @param {string} keyStr
 * @returns {boolean}
 */
export function keyPrefersFlats(keyStr) {
  const flatKeys = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);
  return flatKeys.has(keyStr || 'C');
}
