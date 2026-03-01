# Open Score

A browser-based repository and performance interface for open instrumentation guided improvisation compositions. Scores are fully notated in traditional music notation (via VexFlow) and readable directly on-screen by live musicians.

## Tech stack

- **React 19** + **Vite 7** (ES modules, `type: "module"`)
- **VexFlow 5** — music notation rendering to SVG
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **React Router v7** — `HashRouter` (required for local file:// access)
- **vite-plugin-singlefile** — bundles everything into one self-contained `dist/index.html`

## Development

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # produces dist/index.html (single self-contained file, ~1.4 MB)
```

The built `dist/index.html` can be opened directly in any browser without a server — no hosting required. This is intentional: the app is designed to be shared as a single file with musicians.

## Routing

`HashRouter` is used (not `BrowserRouter`). Routes use `#` hashes so that navigation works when the file is opened locally via `file://`. All route changes go through `src/App.jsx`.

| Route | Component |
|---|---|
| `/` | `Repository` — composition grid with filters |
| `/configure/:id` | `ScoreConfigurator` — per-player instrument setup |
| `/performance/:id` | `PerformanceView` — full-screen dark score display |
| `/accumulation` | `AccumulationBuilder` — generative Accumulation Study |

## Project structure

```
src/
  App.jsx                          # Router + route definitions
  index.css                        # Global styles + Tailwind import
  data/
    index.js                       # Exports compositions array
    compositions/
      piece-001.js                 # "Threshold" — authored composition
      accumulation.js              # Accumulation Study metadata entry
  components/
    Repository.jsx                 # Homepage — composition grid + filters
    CompositionCard.jsx            # Individual card; routes to configure or generator
    ScoreConfigurator.jsx          # Per-player clef/transposition setup
    PerformanceView.jsx            # Full-screen performance mode
    StaveRenderer.jsx              # VexFlow renderer for a single player's stave
    SectionTimer.jsx               # Count-up timer with duration parsing
    AccumulationBuilder.jsx        # Generator UI (performers, cell, tempo, stagger)
    AccumulationScore.jsx          # VexFlow renderer for all accumulation stages
  utils/
    transposition.js               # Pitch + key signature transposition math
    accumulationLogic.js           # Accumulation Study composition generation
    notationHelpers.js             # VexFlow helper wrappers (largely unused)
```

## Adding a new composition

1. Create `src/data/compositions/your-piece.js` — export a default object matching the schema below
2. Import and add it to the array in `src/data/index.js`
3. Run `npm run build` to update `dist/index.html`

### Composition data schema

```js
export default {
  id: 'piece-002',              // unique, used in URL
  title: 'Title',
  composer: 'Name',
  year: 2025,
  duration: "ca. 5–8'",        // string, parsed by SectionTimer and filter
  description: `Markdown supported. **Bold** and *italic* work.`,
  tags: ['tag-one', 'tag-two'],

  // Optional: marks the card as a generator (routes to generatorRoute, not /configure/:id)
  isGenerator: false,
  generatorRoute: '/accumulation',

  sections: [
    {
      id: 'section-a',
      title: 'I. Title',
      durationNote: "ca. 2–3'",
      performanceNote: 'Instructions for performers.',

      staves: [
        {
          clef: 'treble',   // 'treble' | 'bass' | 'alto' | 'tenor'
          measures: [
            {
              timeSignature: '4/4',   // null = open meter
              keySignature: 'C',      // 'C' | 'F' | 'G' | 'Bb' | etc.
              notes: [
                {
                  keys: ['e/4'],      // VexFlow pitch strings: 'note/octave'
                  duration: 'w',      // 'w' | 'h' | 'q' | '8' | 'hd' | 'wd' | 'qd'
                  accidentals: [''],  // parallel array: '' | '#' | 'b' | 'n'
                  textAnnotations: [
                    { text: 'pp', position: 'below', noteIndex: 0 },
                    { text: 'sul tasto', position: 'above', noteIndex: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          clef: 'bass',
          measures: [ /* ... */ ],
        },
      ],

      instructionBlocks: [
        { position: 'after-staves', text: 'Text shown below the staves.' },
      ],
    },
  ],
};
```

## VexFlow — critical notes

**Import pattern (v4+):**
```js
import * as Vex from 'vexflow';
const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Barline, StaveConnector } = Vex;
```
Everything is at the top level — there is no `.Flow` namespace in VexFlow 4+.

**StaveNote requires explicit `clef`:**
```js
new StaveNote({ keys, duration, clef: 'bass' })
```
Without `clef`, VexFlow defaults all noteheads to treble positioning regardless of the displayed clef. Bass clef notes render far below the staff.

**Text annotations must be drawn manually:**
VexFlow's `Annotation` modifier positions text relative to the notehead, which can be inside the staff lines. Instead, draw all text after `voice.draw()` using canvas calls:
```js
const topY1  = stave.getYForTopText(1);   // one line above top staff line
const topY2  = stave.getYForTopText(2);   // two lines above (stacked annotations)
const bottomY = stave.getYForBottomText(3); // ~40px below bottom staff line (safe for dynamics)
ctx.setFont('Georgia, serif', 10, 'italic');
ctx.fillText(text, noteX, topY1);
```
`getYForBottomText(0)` is only 10px below the bottom line — too close to noteheads on the bottom line. Use `getYForBottomText(3)`.

**Multi-stave beat alignment:**
```js
const formatter = new Formatter();
voiceData.forEach(({ voice }) => formatter.joinVoices([voice]));
formatter.format(voiceData.map(v => v.voice), staveWidth - 70);
// Then draw each voice on its own stave:
voiceData.forEach(({ voice, stave }) => voice.draw(ctx, stave));
```

**Rests:**
```js
new StaveNote({ keys: ['b/4'], duration: 'qr', clef: 'treble' }) // quarter rest
// Duration suffixes: 'wr', 'hr', 'qr', '8r', '16r'
```

**SVG overflow:** Always set `svg.style.overflow = 'visible'` after creating the renderer — annotations and bracket connectors draw outside the SVG bounds.

**Open meter barlines:**
```js
stave.setEndBarType(Barline.type.DOUBLE);  // between open meter measures
stave.setEndBarType(Barline.type.END);     // final barline
```

## CSS — Tailwind v4 cascade order

Button styles must be inside `@layer base` or they will override Tailwind utility classes (`bg-stone-900`, etc.) because unlayered author CSS beats `@layer utilities`:

```css
/* index.css */
@layer base {
  button {
    background: transparent;
    border: none;
    /* ... */
  }
}
```

## Transposition

`src/utils/transposition.js` handles all instrument transposition.

| Function | Purpose |
|---|---|
| `transposeNote(keys, semitones, preferFlats)` | Shifts VexFlow pitch strings by semitones |
| `transposeKeySignature(concertKey, semitones)` | Returns the written key for a transposing instrument |

**Preset semitone offsets** (how much to add to concert pitch to get written pitch):
- Concert pitch: 0
- Bb instrument (Clarinet, Trumpet): +2
- Eb instrument (Alto/Bari Sax): +9
- F instrument (French Horn): +7
- Bb 8vb (Bass Clarinet): +2

## Accumulation Study logic

`src/utils/accumulationLogic.js`

The piece generates `2N - 1` stages for an N-note cell:
- **Ascending** (stages 1 → N): sub-cell grows one note at a time
- **Peak** (stage N): full cell
- **Descending** (stages N+1 → 2N-1): sub-cell shrinks back to 1 note

Each performer part is padded to the same total beat count using leading/trailing rests so VexFlow can format all voices together:
```
totalBeats = subCellBeats + (performers - 1) × staggerBeats
part[p].leadingRests  = p × staggerBeats
part[p].trailingRests = (performers - 1 - p) × staggerBeats
```

The pitch pool is a pentatonic set within the treble staff (no ledger lines needed): `e/4, g/4, a/4, b/4, d/5, e/5`.

## Performance mode

`PerformanceView` renders all players' staves in full-screen dark mode (`#1a1814` background). Key behaviours:
- Controls fade to 10% opacity after 4 s of inactivity
- Keyboard: `←`/`→` navigate sections, `Space` pause/resume timer, `Esc` exit
- Player configs are read from `location.state.playersConfig` (navigated from configurator) or `localStorage` (`open-score:player-configs`) as a fallback
- Stave height scales with player count: 1–3 → 110 px, 4–6 → 88 px, 7–10 → 68 px, 11–12 → 55 px

## Design language

- **Light mode (Repository/Configurator):** warm off-white `#f7f4ef`, stone colour palette
- **Dark mode (Performance/Score):** near-black `#1a1814`, cream text `#e8e2d4`
- **Typography:** EB Garamond (serif, titles) + Inter (sans-serif, UI)
- **Accent:** amber `#d97706` — used for the newest note in Accumulation Study stages
- Performance notes and annotations use general, instrument-agnostic language (no string-specific terms like *col legno*, *arco*, *sul tasto*)
