/**
 * VexFlow helper wrappers for open-score.
 * VexFlow 4.x exports everything at top-level (no .Flow namespace).
 */
import * as Vex from 'vexflow';

export const {
  Renderer, Stave, StaveNote, Voice, Formatter, Accidental,
  Annotation, Articulation, Tremolo, StaveTie, Beam, StaveConnector, Barline
} = Vex;

const DUR_MAP = {
  w: 'w', h: 'h', q: 'q', '8': '8', '16': '16', '32': '32',
  wd: 'wd', hd: 'hd', qd: 'qd', '8d': '8d',
  whole: 'w', half: 'h', quarter: 'q', eighth: '8',
};

/**
 * Build a VexFlow StaveNote from our note definition + pre-transposed keys.
 */
export function buildNote(noteDef, transposedKeys) {
  const duration = DUR_MAP[noteDef.duration] || noteDef.duration || 'w';
  const keys = transposedKeys || noteDef.keys || ['b/4'];

  let vfNote;
  try {
    vfNote = new StaveNote({ keys, duration });
  } catch (e) {
    console.warn('StaveNote error, using fallback:', e.message, { keys, duration });
    vfNote = new StaveNote({ keys: ['b/4'], duration: 'w' });
  }

  // Accidentals
  if (noteDef.accidentals) {
    noteDef.accidentals.forEach((acc, i) => {
      if (acc !== '' && acc !== null && acc !== undefined) {
        try { vfNote.addModifier(new Accidental(acc), i); } catch {}
      }
    });
  }

  // Text annotations on the note
  const annotations = noteDef.textAnnotations || [];
  annotations.forEach((ta) => {
    try {
      const ann = new Annotation(ta.text);
      ann.setFont('Georgia, serif', 10.5);
      ann.setVerticalJustification(
        ta.position === 'below'
          ? Annotation.VerticalJustify.BOTTOM
          : Annotation.VerticalJustify.TOP
      );
      vfNote.addModifier(ann, 0);
    } catch {}
  });

  return vfNote;
}
