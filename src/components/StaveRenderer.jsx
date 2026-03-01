/**
 * StaveRenderer — renders a single player's stave system for one section
 * using VexFlow 4.x.
 *
 * Annotation rendering: all text is drawn manually after voice.draw() using
 * stave.getYForTopText() / stave.getYForBottomText() so annotations always
 * land outside the staff lines, never inside them.
 */

import { useEffect, useRef } from 'react';
import * as Vex from 'vexflow';
import { transposeNote, transposeKeySignature } from '../utils/transposition.js';

const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Barline } = Vex;

const DUR = {
  w: 'w', h: 'h', q: 'q', '8': '8', '16': '16', '32': '32',
  wd: 'wd', hd: 'hd', qd: 'qd', '8d': '8d',
  whole: 'w', half: 'h', quarter: 'q', eighth: '8',
};

/** Returns true if text is a standard dynamic marking (p, pp, mf, f, etc.) */
function isDynamic(text) {
  return /^(p{1,4}|mp|mf|fp|f{1,3}|sfz?|rfz?|fz)$/.test((text || '').trim());
}

/**
 * Build a StaveNote with NO text modifiers — annotations are drawn
 * separately after layout so they always land outside the staff.
 *
 * IMPORTANT: `clef` must be passed so VexFlow positions noteheads correctly
 * for the instrument (e.g. bass clef puts G2 on the bottom line, not below it).
 * Without this, VexFlow defaults to treble clef positioning for all notes.
 */
function buildVFNote(noteDef, transposedKeys, clef = 'treble') {
  const duration = DUR[noteDef.duration] || noteDef.duration || 'w';
  const keys = transposedKeys?.length ? transposedKeys : ['b/4'];

  let note;
  try {
    note = new StaveNote({ keys, duration, clef });
  } catch {
    note = new StaveNote({ keys: ['b/4'], duration: 'w', clef });
  }

  // Accidentals only — no text modifiers
  (noteDef.accidentals || []).forEach((acc, i) => {
    if (acc && acc !== '') {
      try { note.addModifier(new Accidental(acc), i); } catch {}
    }
  });

  return note;
}

export default function StaveRenderer({
  section,
  playerConfig,
  darkMode = true,
  staveHeight = 80,
  width = 900,
  playerIndex = 0,
  totalPlayers = 1,
  isLastPlayer = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !section) return;

    while (el.firstChild) el.removeChild(el.firstChild);

    const {
      clef: playerClef = 'treble',
      transposition: semitones = 0,
      instrumentLabel = 'Player',
      preferFlats = false,
    } = playerConfig;

    // Pick authored stave whose clef matches, or fall back to first
    const staves = section.staves || [];
    const sourceStave = staves.find((s) => s.clef === playerClef) || staves[0];
    if (!sourceStave) return;

    const measures = sourceStave.measures || [];
    if (!measures.length) return;

    // ── Layout ──────────────────────────────────────────────
    const LABEL_W   = 164;
    const RIGHT_PAD = 24;
    const usable    = Math.max(300, width - LABEL_W - RIGHT_PAD);
    const mCount    = measures.length;
    const mWidth    = Math.floor(usable / mCount);

    // Vertical: VexFlow draws its staff with ~40px span (4 × 10px spaces).
    // We add headroom above (for annotation text lines) and margin below.
    const ABOVE_PAD = 56;   // room for two lines of text above top staff line
    const BELOW_PAD = 60;   // room for dynamics (getYForBottomText(3) = ~40px below bottom line)
    const svgH      = ABOVE_PAD + 40 + BELOW_PAD; // 40 = default VF staff height
    const staveY    = ABOVE_PAD;

    // ── Renderer ────────────────────────────────────────────
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, svgH);
    const ctx = renderer.getContext();

    const fgColor = darkMode ? '#e8e2d4' : '#1a1a1a';
    const dimColor = darkMode ? '#9a8f80' : '#666';
    ctx.setFillStyle(fgColor);
    ctx.setStrokeStyle(fgColor);

    const svg = el.querySelector('svg');
    if (svg) svg.style.overflow = 'visible';

    // ── Draw measures ────────────────────────────────────────
    let x = LABEL_W;

    measures.forEach((measure, mi) => {
      const isFirst   = mi === 0;
      const isLast    = mi === mCount - 1;
      const openMeter = !measure.timeSignature;
      const w         = mWidth + (isLast ? RIGHT_PAD : 0);

      // Create stave
      const stave = new Stave(x, staveY, w);
      stave.setStyle({ strokeStyle: fgColor, fillStyle: fgColor });
      stave.setContext(ctx);

      if (isFirst) {
        stave.addClef(playerClef);
        const writtenKey = transposeKeySignature(measure.keySignature || 'C', semitones);
        if (writtenKey && writtenKey !== 'C') stave.addKeySignature(writtenKey);
      }

      if (isFirst && measure.timeSignature) {
        stave.addTimeSignature(measure.timeSignature);
      }

      if (openMeter && !isLast) stave.setEndBarType(Barline.type.DOUBLE);
      if (isLast)               stave.setEndBarType(Barline.type.END);

      stave.draw();

      // ── Build notes & collect annotations ─────────────────
      const notes = measure.notes || [];
      if (!notes.length) { x += w; return; }

      const measureAnnotations = measure.textAnnotations || [];

      // Annotations queued for manual drawing after voice renders
      const annotQueue = []; // { ni, text, position }

      const vfNotes = notes.map((nd, ni) => {
        const tKeys = transposeNote(nd.keys || ['b/4'], semitones, preferFlats);

        // Collect this note's inline annotations
        const inlineAnnot  = nd.textAnnotations || [];
        const measureAnnot = measureAnnotations.filter((ta) => ta.noteIndex === ni);
        [...inlineAnnot, ...measureAnnot].forEach((ta) => {
          annotQueue.push({ ni, text: ta.text || '', position: ta.position || 'above' });
        });

        return buildVFNote(nd, tKeys, playerClef);
      });

      // ── Voice + format ─────────────────────────────────────
      try {
        const voice = new Voice({ num_beats: vfNotes.length, beat_value: 4 });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(vfNotes);
        new Formatter()
          .joinVoices([voice])
          .format([voice], w - (isFirst ? 80 : 20));
        voice.draw(ctx, stave);
      } catch (e) {
        console.warn(`[StaveRenderer] Measure ${mi} render error:`, e.message);
      }

      // ── Draw annotations outside the staff ─────────────────
      // getYForTopText(n): n=0 is one space above top line, higher n = further above
      // getYForBottomText(n): n=0 is one space below bottom line, higher n = further below
      const topY1   = stave.getYForTopText(1);   // first line above staff
      const topY2   = stave.getYForTopText(2);   // second line above (stacked)
      // getYForBottomText(0) = 10px below bottom line — too close to noteheads.
      // Use line 3 (≈40px below) so dynamics clear even notes on the bottom line.
      const bottomY = stave.getYForBottomText(3);

      // Track vertical lines used above the staff to avoid overlap
      const aboveUsed = {}; // noteIndex → next available line offset

      annotQueue.forEach(({ ni, text, position }) => {
        if (ni >= vfNotes.length) return;
        const noteX = vfNotes[ni].getAbsoluteX();

        ctx.save();
        ctx.setFillStyle(fgColor);

        if (isDynamic(text) || position === 'below') {
          // Dynamics: italic serif, below the staff
          ctx.setFont('EB Garamond, Georgia, serif', 12, 'italic');
          ctx.fillText(text, noteX - 4, bottomY);
        } else {
          // Technique / instruction: small italic, above the staff
          // Stack multiple annotations per note upward
          const stackOffset = aboveUsed[ni] || 0;
          aboveUsed[ni] = stackOffset + 1;
          const targetY = stackOffset === 0 ? topY1 : topY2;
          ctx.setFont('Georgia, serif', 10, 'italic');
          ctx.setFillStyle(fgColor);
          ctx.fillText(text, noteX - 4, targetY);
        }
        ctx.restore();
      });

      x += w;
    });

    // ── Instrument label ─────────────────────────────────────
    ctx.save();
    ctx.setFont('EB Garamond, Georgia, serif', 13, 'italic');
    ctx.setFillStyle(fgColor);
    ctx.fillText(instrumentLabel, 8, staveY + 20);
    ctx.setFont('Inter, Arial, sans-serif', 10, 'normal');
    ctx.setFillStyle(dimColor);
    ctx.fillText(playerClef.charAt(0).toUpperCase() + playerClef.slice(1) + ' clef', 8, staveY + 36);
    ctx.restore();

  }, [section, playerConfig, darkMode, staveHeight, width]);

  const containerH = 56 + 40 + 60; // ABOVE_PAD + staff + BELOW_PAD
  return (
    <div
      ref={containerRef}
      className="stave-renderer w-full"
      style={{ minHeight: containerH, overflow: 'visible' }}
    />
  );
}
