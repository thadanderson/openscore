/**
 * AccumulationScore — renders all stages of a generated Accumulation Study
 * using VexFlow 4.x.
 *
 * Layout: one system per stage. Each system has N staves (one per performer),
 * all voices formatted together so beat-positions align vertically.
 *
 * Visual language:
 *   - Rests: dimmed colour (barely visible)
 *   - Sub-cell notes: foreground colour
 *   - Newest note (last added in this stage): amber accent
 */

import { useEffect, useRef, useState } from 'react';
import * as Vex from 'vexflow';

const { Renderer, Stave, StaveNote, Voice, Formatter, Barline, StaveConnector } = Vex;

// ── Constants ─────────────────────────────────────────────────────────────────
const LABEL_W       = 110;  // left margin for performer labels
const RIGHT_PAD     = 24;
const STAGE_LABEL_H = 28;   // height of stage title row
const ABOVE_PAD     = 46;   // room above top staff line for annotations
const BELOW_PAD     = 36;   // room below bottom staff line
const STAVE_SPACING = 108;  // vertical distance between consecutive stave tops
const STAVE_H       = 40;   // VexFlow internal staff height (4 × 10px)

function stageLabel(stage) {
  const n = stage.activeCellLength;
  const plural = n === 1 ? 'note' : 'notes';
  if (stage.direction === 'peak')      return `● Full cell — ${n} ${plural}`;
  if (stage.direction === 'ascending') return `↑ Accumulate — ${n} ${plural}`;
  return                                      `↓ Release — ${n} ${plural}`;
}

// ── StageSystem ───────────────────────────────────────────────────────────────
function StageSystem({ stage, width, darkMode }) {
  const ref = useRef(null);

  const performers  = stage.parts.length;
  const svgH = STAGE_LABEL_H + ABOVE_PAD + (performers - 1) * STAVE_SPACING + STAVE_H + BELOW_PAD;

  useEffect(() => {
    const el = ref.current;
    if (!el || !stage) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    // ── Colours ────────────────────────────────────────────────────────────
    const fg      = darkMode ? '#e8e2d4' : '#1a1a1a';
    const dim     = darkMode ? '#7a6f64' : '#aaa';
    const accent  = '#d97706';  // amber-600 — newest note highlight
    const restClr = darkMode ? '#4a4540' : '#ccc';

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, svgH);
    const ctx = renderer.getContext();
    ctx.setFillStyle(fg);
    ctx.setStrokeStyle(fg);

    const svg = el.querySelector('svg');
    if (svg) svg.style.overflow = 'visible';

    // ── Stage label ────────────────────────────────────────────────────────
    ctx.save();
    ctx.setFont('Georgia, serif', 10, 'italic');
    ctx.setFillStyle(dim);
    ctx.fillText(stageLabel(stage), LABEL_W, 17);
    ctx.restore();

    // Stave width (shared across all performers in this system)
    const staveW = Math.max(220, width - LABEL_W - RIGHT_PAD);

    // ── Build staves and voices ────────────────────────────────────────────
    const staves    = [];
    const voiceData = [];

    stage.parts.forEach((part, pi) => {
      const staveY = STAGE_LABEL_H + ABOVE_PAD + pi * STAVE_SPACING;

      const stave = new Stave(LABEL_W, staveY, staveW);
      stave.setStyle({ strokeStyle: fg, fillStyle: fg });
      stave.setContext(ctx);

      // Clef on every stave for readability
      stave.addClef('treble');

      // Final barline on all staves (they share the same end x, so they align)
      stave.setEndBarType(Barline.type.END);

      stave.draw();
      staves.push({ stave, staveY });

      // ── Build VexFlow notes ──────────────────────────────────────────────
      const vfNotes = [];

      // Leading rests (dimmed)
      part.leadingRests.forEach((r) => {
        const n = new StaveNote({ keys: r.keys, duration: r.duration, clef: 'treble' });
        n.setStyle({ fillStyle: restClr, strokeStyle: restClr });
        vfNotes.push(n);
      });

      // Sub-cell notes
      part.notes.forEach((note, ni) => {
        const isNewest = ni === part.notes.length - 1;
        const n = new StaveNote({ keys: [note.pitch], duration: note.duration, clef: 'treble' });
        n.setStyle({
          fillStyle:   isNewest ? accent : fg,
          strokeStyle: isNewest ? accent : fg,
        });
        vfNotes.push(n);
      });

      // Trailing rests (dimmed)
      part.trailingRests.forEach((r) => {
        const n = new StaveNote({ keys: r.keys, duration: r.duration, clef: 'treble' });
        n.setStyle({ fillStyle: restClr, strokeStyle: restClr });
        vfNotes.push(n);
      });

      const voice = new Voice({
        num_beats:  Math.max(1, Math.ceil(stage.totalBeats)),
        beat_value: 4,
      });
      voice.setMode(Voice.Mode.SOFT);
      voice.addTickables(vfNotes);

      voiceData.push({ voice, stave, vfNotes, part });
    });

    // ── Format all voices together (multi-stave beat alignment) ───────────
    try {
      const formatter = new Formatter();
      voiceData.forEach(({ voice }) => formatter.joinVoices([voice]));
      formatter.format(voiceData.map((v) => v.voice), staveW - 70);
    } catch (e) {
      console.warn('[AccumulationScore] Formatter error:', e.message);
    }

    // ── Draw voices ────────────────────────────────────────────────────────
    voiceData.forEach(({ voice, stave }) => {
      try { voice.draw(ctx, stave); } catch (e) {
        console.warn('[AccumulationScore] voice.draw error:', e.message);
      }
    });

    // ── System bracket (left edge) ─────────────────────────────────────────
    if (performers > 1) {
      try {
        const conn = new StaveConnector(staves[0].stave, staves[performers - 1].stave);
        conn.setType(StaveConnector.type.BRACKET);
        conn.setStyle({ strokeStyle: fg, fillStyle: fg });
        conn.setContext(ctx).draw();
      } catch (e) {
        console.warn('[AccumulationScore] StaveConnector error:', e.message);
      }
    }

    // ── Performer labels ───────────────────────────────────────────────────
    staves.forEach(({ stave, staveY }, pi) => {
      ctx.save();
      ctx.setFont('Inter, Arial, sans-serif', 9, 'normal');
      ctx.setFillStyle(dim);
      // Vertically centre on the stave (middle line ≈ staveY + 20)
      ctx.fillText(`Player ${pi + 1}`, 8, staveY + 24);
      ctx.restore();
    });

  }, [stage, width, darkMode, svgH]);

  return (
    <div
      ref={ref}
      className="stave-renderer w-full"
      style={{ minHeight: svgH, overflow: 'visible' }}
    />
  );
}

// ── AccumulationScore ─────────────────────────────────────────────────────────
export default function AccumulationScore({ stages, darkMode = true }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(880);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth || 880);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!stages || stages.length === 0) return null;

  const bg      = darkMode ? '#1a1814' : '#f7f4ef';
  const divider = darkMode ? '#2e2a26' : '#e2ddd8';

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: bg }}
      className="w-full rounded"
    >
      {stages.map((stage, i) => (
        <div
          key={stage.stageNumber}
          style={{
            borderTop: i === 0 ? 'none' : `1px solid ${divider}`,
            paddingTop: i === 0 ? '24px' : '8px',
            paddingBottom: '8px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <StageSystem
            stage={stage}
            width={Math.max(200, width - 32)}
            darkMode={darkMode}
          />
        </div>
      ))}
    </div>
  );
}
