/**
 * accumulationLogic — generates composition data for an Accumulation Study.
 *
 * Additive process:
 *   Ascending  — sub-cell grows from 1 note → N notes (full cell)
 *   Peak       — all performers play the full cell
 *   Descending — sub-cell shrinks from N-1 notes → 1 note
 *
 * Stagger: each performer is offset by `staggerBeats` quarter-note beats
 * from the previous, creating a canon-like overlap.
 */

// Pentatonic pool inside the treble staff (no extra ledger lines needed)
const PITCH_POOL = ['e/4', 'g/4', 'a/4', 'b/4', 'd/5', 'e/5'];

// Rhythmic palette — weighted toward quarters for readability
const RHYTHM_POOL = ['q', 'q', 'q', 'h', '8', '8', 'q', 'q'];

// Duration string → quarter-note beats
const DUR_BEATS = {
  w: 4, hd: 3, h: 2, qd: 1.5, q: 1, '8d': 0.75, '8': 0.5, '16': 0.25,
  // rests
  wr: 4, hr: 2, qr: 1, '8r': 0.5, '16r': 0.25,
};

export function durationToBeats(dur) {
  return DUR_BEATS[dur] ?? 1;
}

/**
 * Decompose a beat count into a list of rest note definitions.
 * Returns Array<{ keys, duration, isRest }> suitable for VexFlow StaveNote.
 */
export function beatsToRests(beats) {
  const result = [];
  const TABLE = [
    [4, 'wr'],
    [2, 'hr'],
    [1, 'qr'],
    [0.5, '8r'],
    [0.25, '16r'],
  ];
  let rem = Math.round(beats * 100) / 100;
  let guard = 0;
  while (rem > 0.001 && guard++ < 24) {
    let matched = false;
    for (const [b, dur] of TABLE) {
      if (rem >= b - 0.001) {
        result.push({ keys: ['b/4'], duration: dur, isRest: true });
        rem = Math.round((rem - b) * 100) / 100;
        matched = true;
        break;
      }
    }
    if (!matched) break;
  }
  return result;
}

/**
 * Generate a random melodic cell.
 * @param {number} noteCount — 1–8
 * @returns {Array<{pitch: string, duration: string}>}
 */
export function generateRandomCell(noteCount) {
  const count = Math.max(1, Math.min(8, noteCount));
  return Array.from({ length: count }, () => ({
    pitch: PITCH_POOL[Math.floor(Math.random() * PITCH_POOL.length)],
    duration: RHYTHM_POOL[Math.floor(Math.random() * RHYTHM_POOL.length)],
  }));
}

/**
 * Compute all stages of the Accumulation Study.
 *
 * @param {Object} opts
 * @param {Array<{pitch, duration}>} opts.cell       — full melodic cell (1–8 notes)
 * @param {number}                  opts.performers  — number of performers (≥ 2)
 * @param {number}                  opts.staggerBeats — quarter-note beats between entries
 * @returns {Array<stage>}
 *
 * Each stage:
 *   { stageNumber, direction, activeCellLength, totalBeats, parts[] }
 *
 * Each part:
 *   { performerIndex, leadingRests[], notes[], trailingRests[] }
 */
export function computeAccumulationStages({ cell, performers, staggerBeats = 1 }) {
  const N = cell.length;
  const stages = [];

  // Ascending: 1 → N
  for (let k = 1; k <= N; k++) {
    const direction = k === N ? 'peak' : 'ascending';
    stages.push(buildStage(stages.length + 1, k, direction, cell, performers, staggerBeats));
  }

  // Descending: N-1 → 1
  for (let k = N - 1; k >= 1; k--) {
    stages.push(buildStage(stages.length + 1, k, 'descending', cell, performers, staggerBeats));
  }

  return stages;
}

function buildStage(stageNumber, cellLength, direction, cell, performers, staggerBeats) {
  const subCell = cell.slice(0, cellLength);
  const subCellBeats = subCell.reduce((sum, n) => sum + durationToBeats(n.duration), 0);
  const totalBeats = Math.round((subCellBeats + (performers - 1) * staggerBeats) * 100) / 100;

  const parts = [];
  for (let p = 0; p < performers; p++) {
    const leadingBeats  = Math.round(p * staggerBeats * 100) / 100;
    const trailingBeats = Math.round(((performers - 1 - p) * staggerBeats) * 100) / 100;
    parts.push({
      performerIndex: p,
      leadingRests:  beatsToRests(leadingBeats),
      notes:         subCell,
      trailingRests: beatsToRests(trailingBeats),
    });
  }

  return { stageNumber, direction, activeCellLength: cellLength, totalBeats, parts };
}
