/**
 * Threshold — piece-001
 * Thad Anderson, 2025
 */

export default {
  id: 'piece-001',
  title: 'Threshold',
  composer: 'Thad Anderson',
  year: 2025,
  duration: "ca. 8–12'",
  description: `**Threshold** is a guided improvisation for any instruments, any number of players.

The score provides a framework of sustained pitches and slow harmonic motion. Players interpret the notated pitches freely within the structural boundaries of each section: durations are approximate, internal ordering may vary unless specified, and extended technique instructions are invitations rather than requirements.

**General performance notes:** Play softly throughout unless otherwise indicated. Listen more than you play. The silences between notes are as important as the notes themselves. Dynamics should emerge from the ensemble texture — no single player should dominate.`,

  tags: ['open instrumentation', 'guided improvisation', 'sustain', 'extended technique', 'minimalist', 'any ensemble'],

  sections: [
    // ── I. Emergence (open meter, C) ──────────────────────────────────
    {
      id: 'section-a',
      title: 'I. Emergence',
      durationNote: "ca. 2–3'",
      performanceNote:
        'Enter one at a time, 10–20 seconds apart. Choose any pitch from the notated harmony and sustain it. When you are ready, move to the next pitch — there is no coordinated rhythm. Allow pitches to overlap and decay naturally. The section ends when all players have settled on the final chord.',

      staves: [
        {
          clef: 'treble',
          measures: [
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['e/4'], duration: 'w',
                  textAnnotations: [
                    { text: 'pp', position: 'below', noteIndex: 0 },
                  ],
                },
                { keys: ['g/4'], duration: 'w' },
                { keys: ['b/4'], duration: 'w' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['d/4'], duration: 'w',
                  textAnnotations: [
                    { text: 'allow to decay', position: 'above', noteIndex: 0 },
                  ],
                },
                { keys: ['f/4', 'a/4'], duration: 'w', accidentals: ['', ''] },
                { keys: ['c/5'], duration: 'w' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['e/4', 'g/4', 'b/4'], duration: 'w', accidentals: ['', '', ''],
                  textAnnotations: [
                    { text: 'hold until silence', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          clef: 'bass',
          measures: [
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                // Bass clef: comfortable range G2–A3 (bottom line to top line)
                // C3 = space below middle D3; G2 = bottom line of bass clef
                {
                  keys: ['c/3'], duration: 'w',
                  textAnnotations: [
                    { text: 'pp', position: 'below', noteIndex: 0 },
                  ],
                },
                { keys: ['g/2'], duration: 'w' },   // bottom line — fine
                { keys: ['e/3'], duration: 'w' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                { keys: ['d/3'], duration: 'w' },
                { keys: ['a/2'], duration: 'w' },   // first space — fine
                { keys: ['f/3'], duration: 'w' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['c/3', 'g/3'], duration: 'w', accidentals: ['', ''],
                  textAnnotations: [
                    { text: 'let ring', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],

      instructionBlocks: [
        {
          position: 'after-staves',
          text: 'Decay into silence. Do not cut off — let each note die naturally. The section ends when the room is quiet.',
        },
      ],
    },

    // ── II. Motion (4/4, F major) ─────────────────────────────────────
    {
      id: 'section-b',
      title: 'II. Motion',
      durationNote: "ca. 2–4'",
      performanceNote:
        'A slow pulse emerges — approximately ♩= 40. Each notated measure represents one bar. Players may freely repeat measures before moving on, and may be in different measures simultaneously. Aim for a sense of slow drift, not coordination.',

      staves: [
        {
          clef: 'treble',
          measures: [
            {
              timeSignature: '4/4',
              keySignature: 'F',
              notes: [
                {
                  keys: ['f/4'], duration: 'h',
                  textAnnotations: [
                    { text: 'lightly', position: 'above', noteIndex: 0 },
                    { text: 'mp', position: 'below', noteIndex: 0 },
                  ],
                },
                { keys: ['g/4'], duration: 'h' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                { keys: ['a/4'], duration: 'h', accidentals: [''] },
                { keys: ['bb/4'], duration: 'h', accidentals: ['b'] },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                { keys: ['g/4'], duration: 'hd', accidentals: [''] },
                { keys: ['f/4'], duration: 'q' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                {
                  keys: ['e/4'], duration: 'w', accidentals: [''],
                  textAnnotations: [
                    { text: 'dim. to ppp', position: 'above', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          clef: 'bass',
          measures: [
            {
              timeSignature: '4/4',
              keySignature: 'F',
              notes: [
                {
                  keys: ['f/3'], duration: 'w',
                  textAnnotations: [
                    { text: 'p', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                { keys: ['c/3'], duration: 'h' },
                { keys: ['d/3'], duration: 'h' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                { keys: ['bb/2'], duration: 'h', accidentals: ['b'] },  // Bb2 = second staff line
                { keys: ['a/2'], duration: 'h', accidentals: [''] },    // A2 = first space
              ],
            },
            {
              timeSignature: null,
              keySignature: 'F',
              notes: [
                {
                  keys: ['f/3'], duration: 'w',
                  textAnnotations: [
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],

      instructionBlocks: [],
    },

    // ── III. Tension (open meter, chromatic) ──────────────────────────
    {
      id: 'section-c',
      title: 'III. Tension',
      durationNote: "ca. 1–2'",
      performanceNote:
        'High energy, but still quiet. Each player chooses one pitch cluster and repeats it freely — short, clipped articulations or sustained tones with intensity. Gradually converge on the final unison until only one pitch remains.',

      staves: [
        {
          clef: 'treble',
          measures: [
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['f/4'], duration: 'q',
                  textAnnotations: [
                    { text: 'mf', position: 'below', noteIndex: 0 },
                  ],
                },
                { keys: ['f#/4'], duration: 'q', accidentals: ['#'] },
                { keys: ['g/4'], duration: 'q' },
                { keys: ['ab/4'], duration: 'q', accidentals: ['b'] },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                { keys: ['g/4'], duration: 'h' },
                { keys: ['f#/4'], duration: 'h', accidentals: ['#'] },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['g/4'], duration: 'w',
                  textAnnotations: [
                    { text: 'converge — unison G', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          clef: 'bass',
          measures: [
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['g/2'], duration: 'q',   // bottom line — fine
                  textAnnotations: [
                    { text: 'mf', position: 'below', noteIndex: 0 },
                  ],
                },
                { keys: ['ab/2'], duration: 'q', accidentals: ['b'] },  // first space
                { keys: ['a/2'], duration: 'q', accidentals: [''] },    // first space
                { keys: ['bb/2'], duration: 'q', accidentals: ['b'] },  // second line
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                { keys: ['a/2'], duration: 'h', accidentals: [''] },
                { keys: ['g/2'], duration: 'h' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'C',
              notes: [
                {
                  keys: ['g/2'], duration: 'w',
                  textAnnotations: [
                    { text: 'unison G', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],

      instructionBlocks: [
        {
          position: 'after-staves',
          text: 'Converge slowly. The section ends when a single pitch — G — is all that remains.',
        },
      ],
    },

    // ── IV. Resolution (open meter, G major) ──────────────────────────
    {
      id: 'section-d',
      title: 'IV. Resolution',
      durationNote: "ca. 3–4'",
      performanceNote:
        'Begin from the unison G. Expand outward into the harmonic space slowly — no rhythm, only breath. The piece ends when players feel it is complete. Allow the final chord to decay fully before setting down your instrument.',

      staves: [
        {
          clef: 'treble',
          measures: [
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['g/4'], duration: 'w',
                  textAnnotations: [
                    { text: 'from unison', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['b/4'], duration: 'w',
                  textAnnotations: [
                    { text: 'enter when ready', position: 'above', noteIndex: 0 },
                  ],
                },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                { keys: ['d/5'], duration: 'w' },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['g/4', 'b/4', 'd/5'], duration: 'w', accidentals: ['', '', ''],
                  textAnnotations: [
                    { text: 'hold — let decay completely', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          clef: 'bass',
          measures: [
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['g/2'], duration: 'w',   // bottom line — fine
                  textAnnotations: [
                    { text: 'from unison', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['d/3'], duration: 'w',
                  textAnnotations: [
                    { text: 'very softly', position: 'above', noteIndex: 0 },
                  ],
                },
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                { keys: ['b/2'], duration: 'w' },   // second staff line — fine
              ],
            },
            {
              timeSignature: null,
              keySignature: 'G',
              notes: [
                {
                  keys: ['g/2', 'd/3'], duration: 'w', accidentals: ['', ''],
                  textAnnotations: [
                    { text: 'hold — let decay completely', position: 'above', noteIndex: 0 },
                    { text: 'ppp', position: 'below', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],

      instructionBlocks: [
        {
          position: 'after-staves',
          text: 'The piece ends when players feel it is complete. Remain still and silent for at least 30 seconds after the last sound before setting down your instrument.',
        },
      ],
    },
  ],
};
