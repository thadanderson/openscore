/**
 * GraphicScore — renders an abstract graphic-score spec as SVG.
 *
 * The spec is produced by `buildVisual()` in promptLogic.js:
 *   { width, height, marks: [{ type, ... }] }
 *
 * Marks are interpreted, not notated: horizontal position reads as time,
 * vertical position as register/intensity, and stroke weight as force.
 * This component is purely presentational — all geometry is precomputed and
 * seeded, so the same prompt always draws the same graphic.
 */

const INK = '#3a342c';      // warm near-black, matches the light theme text
const ACCENT = '#d97706';   // amber accent

export default function GraphicScore({ visual }) {
  if (!visual || !visual.marks?.length) return null;
  const { width, height, marks } = visual;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ maxHeight: 320, overflow: 'visible' }}
        role="img"
        aria-label="Abstract graphic score to interpret"
      >
        {/* faint horizontal guide — a loose time axis */}
        <line
          x1="40" y1={height / 2} x2={width - 40} y2={height / 2}
          stroke={INK} strokeOpacity="0.12" strokeWidth="1"
        />
        {marks.map((m, i) => (
          <Mark key={i} m={m} />
        ))}
      </svg>
    </div>
  );
}

function Mark({ m }) {
  const stroke = m.accent ? ACCENT : INK;
  const fill = m.accent ? ACCENT : INK;
  const w = m.weight || 1.5;

  switch (m.type) {
    case 'dot':
      return <circle cx={m.x} cy={m.y} r={m.r} fill={fill} fillOpacity="0.85" />;

    case 'ring':
      return (
        <circle cx={m.x} cy={m.y} r={m.r} fill="none" stroke={stroke} strokeWidth={w} strokeOpacity="0.8" />
      );

    case 'line':
      return (
        <line
          x1={m.x} y1={m.y} x2={m.x2} y2={m.y2}
          stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeOpacity="0.85"
        />
      );

    case 'arc':
      return (
        <path
          d={`M ${m.x} ${m.y} Q ${m.cx} ${m.cy} ${m.x2} ${m.y2}`}
          fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeOpacity="0.85"
        />
      );

    case 'wave':
      return (
        <path
          d={wavePath(m.x, m.y, m.x2, m.amp)}
          fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeOpacity="0.85"
        />
      );

    case 'bar':
      return (
        <rect x={m.x} y={m.y} width={m.w} height={m.h} fill={fill} fillOpacity="0.8" rx="1" />
      );

    case 'cloud':
      return (
        <g>
          {m.dots.map((d, i) => (
            <circle key={i} cx={m.x + d.dx} cy={m.y + d.dy} r={d.r} fill={fill} fillOpacity="0.55" />
          ))}
        </g>
      );

    default:
      return <circle cx={m.x} cy={m.y} r={4} fill={fill} />;
  }
}

/** A small sinusoidal path from (x,y) to (x2,y) with the given amplitude. */
function wavePath(x, y, x2, amp) {
  const len = x2 - x;
  const segs = Math.max(3, Math.round(len / 24));
  let d = `M ${x} ${y}`;
  for (let i = 1; i <= segs; i++) {
    const px = x + (len * i) / segs;
    const cx = x + (len * (i - 0.5)) / segs;
    const cy = y + (i % 2 === 0 ? amp : -amp);
    d += ` Q ${cx} ${cy} ${px} ${y}`;
  }
  return d;
}
