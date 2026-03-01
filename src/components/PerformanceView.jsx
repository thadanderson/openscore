/**
 * PerformanceView — full-screen, distraction-free score display.
 *
 * Features:
 * - Dark mode notation
 * - Section navigation (← → keys + buttons)
 * - Section timer with duration target
 * - Controls fade to 10% opacity after 4s inactivity
 * - All players' staves rendered as a bracketed system
 * - Responsive stave sizing based on player count
 * - Touch-friendly for iPad
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import compositions from '../data/index.js';
import StaveRenderer from './StaveRenderer.jsx';
import SectionTimer from './SectionTimer.jsx';

// ─── Stave sizing by player count ───
function getStaveHeight(playerCount) {
  if (playerCount <= 3) return 110;
  if (playerCount <= 6) return 88;
  if (playerCount <= 10) return 68;
  return 55; // 11-12: minimum legible
}

function getSystemPadding(playerCount) {
  if (playerCount <= 3) return 24;
  if (playerCount <= 6) return 16;
  return 10;
}

// ─── Detect if all players share same "family" from instrument labels ───
function detectBracketType(players) {
  const stringFamilies = ['violin', 'viola', 'cello', 'bass', 'string'];
  const windFamilies = ['flute', 'oboe', 'clarinet', 'bassoon', 'saxophone', 'sax', 'trumpet', 'horn', 'trombone', 'tuba'];
  const labels = players.map((p) => p.instrumentLabel?.toLowerCase() || '');

  const isAllStrings = labels.every((l) => stringFamilies.some((f) => l.includes(f)));
  const isAllWinds = labels.every((l) => windFamilies.some((f) => l.includes(f)));

  return isAllStrings || isAllWinds ? 'brace' : 'bracket';
}

const STORAGE_KEY = 'open-score:player-configs';

export default function PerformanceView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const composition = compositions.find((c) => c.id === id);

  // Load player configs from navigation state or localStorage
  const [playersConfig, setPlayersConfig] = useState(() => {
    if (location.state?.playersConfig) return location.state.playersConfig;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          transposition: p.transposition ?? 0,
        }));
      }
    } catch {}
    return [{ instrumentLabel: 'Player 1', clef: 'treble', transposition: 0 }];
  });

  const [sectionIndex, setSectionIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [timerRunning, setTimerRunning] = useState(true);
  const [containerWidth, setContainerWidth] = useState(900);
  const [timerKey, setTimerKey] = useState(0); // reset timer on section change

  const fadeTimerRef = useRef(null);
  const containerRef = useRef(null);

  if (!composition) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-300 flex items-center justify-center">
        <p>Composition not found.</p>
      </div>
    );
  }

  const sections = composition.sections || [];
  const currentSection = sections[sectionIndex];
  const totalPlayers = playersConfig.length;
  const staveHeight = getStaveHeight(totalPlayers);
  const systemPadding = getSystemPadding(totalPlayers);

  // ─── Track container width ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    obs.observe(el);
    setContainerWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  // ─── Controls fade on inactivity ───
  const resetFadeTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    resetFadeTimer();
    return () => clearTimeout(fadeTimerRef.current);
  }, [resetFadeTimer]);

  useEffect(() => {
    const handler = () => resetFadeTimer();
    window.addEventListener('mousemove', handler);
    window.addEventListener('touchstart', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [resetFadeTimer]);

  // ─── Keyboard navigation ───
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSectionIndex((i) => Math.min(i + 1, sections.length - 1));
        setTimerKey((k) => k + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSectionIndex((i) => Math.max(i - 1, 0));
        setTimerKey((k) => k + 1);
      } else if (e.key === 'Escape') {
        navigate(`/configure/${composition.id}`);
      } else if (e.key === ' ') {
        e.preventDefault();
        setTimerRunning((r) => !r);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections.length, composition.id, navigate]);

  function goToSection(idx) {
    setSectionIndex(Math.max(0, Math.min(idx, sections.length - 1)));
    setTimerKey((k) => k + 1);
  }

  // ─── Bracket type detection ───
  const bracketType = detectBracketType(playersConfig);

  // ─── System vertical height ───
  const systemHeight = totalPlayers * (staveHeight + 80 + systemPadding) + 20;

  return (
    <div
      className="min-h-screen bg-[#1a1814] text-stone-200 flex flex-col overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* ── Controls overlay (fades out) ── */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ transition: 'opacity 1s ease', opacity: controlsVisible ? 1 : 0.08 }}
      >
        {/* Top bar */}
        <div className="pointer-events-auto flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#1a1814] to-transparent">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/configure/${composition.id}`)}
              className="text-stone-500 hover:text-stone-200 text-sm transition-colors"
            >
              ← Setup
            </button>
            <span className="text-stone-600">|</span>
            <span className="font-serif text-stone-300 text-lg">{composition.title}</span>
            <span className="text-stone-600 text-sm">{composition.composer}</span>
          </div>
          <div className="text-stone-500 text-sm">
            {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-t from-[#1a1814] to-transparent">
          {/* Section nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToSection(sectionIndex - 1)}
              disabled={sectionIndex === 0}
              className="w-10 h-10 border border-stone-700 hover:border-stone-400 disabled:opacity-20 flex items-center justify-center text-lg transition-all"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(i)}
                  className={`text-xs px-3 py-1 transition-all ${
                    i === sectionIndex
                      ? 'bg-stone-200 text-stone-900'
                      : 'text-stone-500 hover:text-stone-300 border border-stone-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => goToSection(sectionIndex + 1)}
              disabled={sectionIndex === sections.length - 1}
              className="w-10 h-10 border border-stone-700 hover:border-stone-400 disabled:opacity-20 flex items-center justify-center text-lg transition-all"
            >
              ›
            </button>
          </div>

          {/* Timer */}
          <button
            onClick={() => setTimerRunning((r) => !r)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            title="Click to pause/resume timer (Space)"
          >
            <SectionTimer
              key={timerKey}
              durationNote={currentSection?.durationNote}
              running={timerRunning}
            />
            <span className="text-stone-600 text-xs">{timerRunning ? '▐▐' : '▶'}</span>
          </button>
        </div>
      </div>

      {/* ── Score area ── */}
      <div className="flex-1 flex flex-col" ref={containerRef}>
        {/* Section header */}
        <div className="pt-20 pb-4 px-8">
          <div className="border-b border-stone-800 pb-4">
            <h2 className="font-serif text-2xl text-stone-200 font-light">
              {currentSection?.title}
            </h2>
            {currentSection?.performanceNote && (
              <p className="text-stone-500 text-sm mt-2 max-w-3xl leading-relaxed italic">
                {currentSection.performanceNote}
              </p>
            )}
          </div>
        </div>

        {/* System: all players' staves */}
        <div className="px-8 flex-1 overflow-y-auto pb-24">
          <div
            className="relative"
            style={{
              minHeight: systemHeight,
              // Left bracket drawn via CSS border
              paddingLeft: 16,
              borderLeft: `3px solid #6b6560`,
            }}
          >
            {playersConfig.map((playerConfig, pi) => (
              <div
                key={`${playerConfig.id || pi}-${sectionIndex}`}
                style={{
                  marginBottom: systemPadding,
                  borderBottom: pi < totalPlayers - 1
                    ? '1px solid #2a2825'
                    : 'none',
                }}
              >
                <StaveRenderer
                  section={currentSection}
                  playerConfig={playerConfig}
                  darkMode={true}
                  staveHeight={staveHeight}
                  width={Math.max(400, containerWidth - 80)}
                  playerIndex={pi}
                  totalPlayers={totalPlayers}
                  isFirstPlayer={pi === 0}
                  isLastPlayer={pi === totalPlayers - 1}
                />
              </div>
            ))}
          </div>

          {/* Instruction blocks */}
          {(currentSection?.instructionBlocks || [])
            .filter((b) => b.position === 'after-staves')
            .map((block, bi) => (
              <div
                key={bi}
                className="mt-8 border-t border-stone-800 pt-6 max-w-3xl"
              >
                <p className="text-stone-400 text-sm italic leading-relaxed">
                  {block.text}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* ── Keyboard hint (very subtle) ── */}
      <div
        className="fixed bottom-16 left-1/2 -translate-x-1/2 text-stone-700 text-xs pointer-events-none"
        style={{ opacity: controlsVisible ? 0.6 : 0 }}
      >
        ← → navigate sections · Space pause timer · Esc exit
      </div>
    </div>
  );
}
