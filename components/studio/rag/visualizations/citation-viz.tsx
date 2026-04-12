'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SOURCES = [
  {
    id: 1,
    title: 'Air Canada Bereavement Policy, Section 3.1',
    text: 'Bereavement fares must be requested AT THE TIME OF BOOKING or within 24 hours of the initial reservation. Passengers should contact Air Canada reservations directly and indicate the nature of the travel.',
    highlight: 'must be requested at the time of booking',
  },
  {
    id: 2,
    title: 'Air Canada Fare Adjustments, Section 7.4',
    text: 'Air Canada does not offer retroactive bereavement discounts for tickets already purchased at regular fares. All bereavement fare requests must be made prior to or at the point of sale.',
    highlight: 'does not offer retroactive bereavement discounts',
  },
  {
    id: 3,
    title: 'Air Canada Documentation Requirements, Section 5.2',
    text: 'Passengers claiming bereavement fares may be required to provide documentation such as a death certificate, obituary notice, or a letter from a funeral home. Documentation must be submitted within 90 days of the travel date.',
    highlight: 'death certificate',
  },
];

const RESPONSE_TEXT = "Air Canada's bereavement fares must be requested at the time of booking";
const RESPONSE_PARTS: Array<{ text: string; cite: number | null }> = [
  { text: "Air Canada's bereavement fares must be requested at the time of booking", cite: 1 },
  { text: '. Retroactive discounts are not offered under any circumstances', cite: 2 },
  { text: '. Passengers may need to provide documentation such as a death certificate', cite: 3 },
  { text: '.', cite: null },
];

// Phases: 0,1,2 = hovering each citation; 3 = show without citations
const PHASE_DURATION = [3000, 3000, 3000, 4000];
const TOTAL_PHASES = 4;

export function CitationViz({ onReplay }: { onReplay?: () => void }) {
  const [phase, setPhase] = useState(0);
  const [manualHover, setManualHover] = useState<number | null>(null);

  const resetCycle = useCallback(() => setPhase(0), []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const advance = () => {
      setPhase((prev) => {
        const next = (prev + 1) % TOTAL_PHASES;
        timeout = setTimeout(advance, PHASE_DURATION[next]);
        return next;
      });
    };
    timeout = setTimeout(advance, PHASE_DURATION[0]);
    return () => clearTimeout(timeout);
  }, []);

  const activeCite = manualHover ?? (phase < 3 ? phase + 1 : null);
  const showNoCitations = phase === 3 && manualHover === null;

  return (
    <div className="w-full min-h-[400px] flex flex-col items-center gap-5 p-6 select-none">
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
        Citations — Tracing claims to sources
      </p>

      {/* Response paragraph */}
      <div className="w-full max-w-[600px] relative">
        <div className="bg-[#0a1e2e] border border-white/10 rounded-xl px-6 py-5">
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3 font-mono">AI Response</p>
          <div className="text-sm text-white/85 leading-[1.8]">
            {showNoCitations ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {RESPONSE_PARTS.map((part) => part.text).join('')}
              </motion.span>
            ) : (
              RESPONSE_PARTS.map((part, i) => (
                <span key={i}>
                  <motion.span
                    animate={{
                      color: activeCite === part.cite ? '#B8860B' : 'rgba(255,255,255,0.85)',
                      textShadow: activeCite === part.cite ? '0 0 8px rgba(184,134,11,0.3)' : 'none',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {part.text}
                  </motion.span>
                  {part.cite && (
                    <motion.span
                      onMouseEnter={() => setManualHover(part.cite)}
                      onMouseLeave={() => setManualHover(null)}
                      animate={{
                        scale: activeCite === part.cite ? 1.15 : 1,
                        boxShadow:
                          activeCite === part.cite
                            ? '0 0 12px rgba(184,134,11,0.5)'
                            : '0 0 0px rgba(184,134,11,0)',
                      }}
                      className="inline-flex items-center justify-center mx-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer"
                      style={{ backgroundColor: '#B8860B', color: '#0F2F44' }}
                    >
                      [{part.cite}]
                    </motion.span>
                  )}
                </span>
              ))
            )}
          </div>

          {/* No-citations warning */}
          <AnimatePresence>
            {showNoCitations && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 border border-[#922B21]/40 bg-[#922B21]/10 rounded-lg px-4 py-2"
              >
                <p className="text-[11px] text-[#922B21] font-mono flex items-center gap-2">
                  <span className="text-base">⚠</span>
                  Without citations, you cannot tell truth from fabrication.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Source card */}
      <div className="w-full max-w-[600px] min-h-[120px]">
        <AnimatePresence mode="wait">
          {activeCite && !showNoCitations && (
            <motion.div
              key={activeCite}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="border border-[#B8860B]/30 bg-gradient-to-br from-[#B8860B]/10 to-[#0E6B5C]/05 rounded-xl px-5 py-4"
            >
              {/* Source header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: '#B8860B', color: '#0F2F44' }}
                >
                  Source [{activeCite}]
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  {SOURCES[activeCite - 1].title}
                </span>
              </div>

              {/* Source text with highlight */}
              <p className="text-xs text-white/65 leading-relaxed">
                {(() => {
                  const source = SOURCES[activeCite - 1];
                  const parts = source.text.split(source.highlight);
                  if (parts.length < 2) return source.text;
                  return (
                    <>
                      {parts[0]}
                      <motion.span
                        initial={{ backgroundColor: 'rgba(184,134,11,0)' }}
                        animate={{ backgroundColor: 'rgba(184,134,11,0.3)' }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="text-[#B8860B] font-medium px-0.5 rounded"
                      >
                        {source.highlight}
                      </motion.span>
                      {parts[1]}
                    </>
                  );
                })()}
              </p>

              {/* Trace line */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-[1px] flex-grow bg-gradient-to-r from-[#B8860B]/40 to-transparent" />
                <span className="text-[9px] text-[#B8860B]/60 font-mono">verified</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption */}
      <p className="text-xs text-white/50 italic text-center max-w-[450px]">
        {showNoCitations
          ? 'Citations are the difference between trust and guesswork.'
          : 'Hover each citation to trace the claim back to its source document.'}
      </p>

      {onReplay && (
        <button
          onClick={() => { resetCycle(); onReplay(); }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded px-3 py-1 hover:border-white/30"
        >
          Replay
        </button>
      )}
    </div>
  );
}
