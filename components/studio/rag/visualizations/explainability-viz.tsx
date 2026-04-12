'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION = 'Can I get a retroactive bereavement discount?';

const BLACK_BOX_ANSWER =
  'Yes, you can receive a retroactive discount within 90 days of your travel. Simply contact customer service with your booking reference and a copy of the death certificate to request the adjustment.';

const CHUNKS = [
  { id: 1, score: 0.94, text: 'Bereavement fares must be requested at the time of booking...' },
  { id: 2, score: 0.91, text: 'Retroactive discounts are not offered under any circumstances...' },
  { id: 3, score: 0.87, text: 'Documentation must be submitted within 90 days of travel...' },
];

const RANKED_ORDER = [1, 0, 2]; // reorder: chunk2 first, chunk1 second, chunk3 third

const SYSTEM_PROMPT = 'Answer ONLY using retrieved documents. Cite sources with [n]. If unsure, say so.';

const GLASS_ANSWER =
  'No. Air Canada does not offer retroactive bereavement discounts [2]. Fares must be requested at the time of booking [1]. Documentation is required within 90 days, but this applies to active bereavement fare claims only [3].';

const LAYERS = [
  { name: 'QUERY', color: '#B8860B' },
  { name: 'RETRIEVAL', color: '#0E6B5C' },
  { name: 'RANKING', color: '#0E6B5C' },
  { name: 'INSTRUCTION', color: '#0E6B5C' },
  { name: 'GENERATION', color: '#0E6B5C' },
  { name: 'EVIDENCE', color: '#B8860B' },
];

const CAPTION =
  "Explainability turns 'the AI said so' into 'here's exactly why, with evidence.' The Apple Card model couldn't explain its decisions. Your RAG system can.";

// Timing boundaries (seconds)
const PHASE_TIMES = {
  questionStart: 0,
  questionEnd: 3,
  blackBoxStart: 3,
  blackBoxEnd: 8,
  glassBoxStart: 8,
  glassBoxEnd: 18,
  captionStart: 18,
  captionEnd: 22,
  total: 22,
};

export function ExplainabilityViz({ onReplay }: { onReplay?: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [bbCharIndex, setBbCharIndex] = useState(0);
  const [glassCharIndex, setGlassCharIndex] = useState(0);

  const reset = useCallback(() => {
    setElapsed(0);
    setBbCharIndex(0);
    setGlassCharIndex(0);
  }, []);

  // Master clock: ticks every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= PHASE_TIMES.total) {
          setTimeout(reset, 500);
          return PHASE_TIMES.total;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [reset]);

  // Black box answer streaming (3-6s)
  useEffect(() => {
    if (elapsed < PHASE_TIMES.blackBoxStart || elapsed > 6) return;
    if (bbCharIndex >= BLACK_BOX_ANSWER.length) return;
    const timer = setTimeout(() => setBbCharIndex((p) => Math.min(p + 2, BLACK_BOX_ANSWER.length)), 30);
    return () => clearTimeout(timer);
  }, [elapsed, bbCharIndex]);

  // Glass box answer streaming (14-17s)
  useEffect(() => {
    if (elapsed < 14 || elapsed > 17) return;
    if (glassCharIndex >= GLASS_ANSWER.length) return;
    const timer = setTimeout(() => setGlassCharIndex((p) => Math.min(p + 2, GLASS_ANSWER.length)), 30);
    return () => clearTimeout(timer);
  }, [elapsed, glassCharIndex]);

  const showQuestion = elapsed >= PHASE_TIMES.questionStart;
  const showBlackBox = elapsed >= PHASE_TIMES.blackBoxStart;
  const showBlackAnswer = elapsed >= 3.5;
  const showBlackWhy = elapsed >= 6.5;
  const showGlassBox = elapsed >= PHASE_TIMES.glassBoxStart;
  const activeLayer = elapsed >= PHASE_TIMES.glassBoxStart
    ? Math.min(Math.floor((elapsed - PHASE_TIMES.glassBoxStart) * 0.6), 5)
    : -1;
  const showGlassWhy = elapsed >= 17;
  const allGlow = elapsed >= 17.5;
  const showCaption = elapsed >= PHASE_TIMES.captionStart;

  // Render citation pills in glass answer
  const renderGlassText = (text: string) => {
    const parts = text.split(/(\[\d\])/g);
    return parts.map((part, i) => {
      const citeMatch = part.match(/^\[(\d)\]$/);
      if (citeMatch) {
        return (
          <span
            key={i}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mx-0.5 align-middle"
            style={{ backgroundColor: '#B8860B', color: '#0F2F44' }}
          >
            {citeMatch[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full min-h-[480px] flex flex-col items-center gap-4 p-4 md:p-6 select-none">
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
        Explainability — Black Box vs Glass Box
      </p>

      {/* Question */}
      <AnimatePresence>
        {showQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[700px] text-center"
          >
            <div className="bg-[#0a1e2e] border border-white/10 rounded-xl px-5 py-3 inline-block">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1 font-mono">
                Customer Question
              </p>
              <p className="text-sm text-white/90 font-medium">&ldquo;{QUESTION}&rdquo;</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two panels */}
      <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* LEFT — BLACK BOX */}
        <AnimatePresence>
          {showBlackBox && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-3 rounded-xl p-4 border-2"
              style={{ borderColor: '#922B21' }}
            >
              <p
                className="text-xs uppercase tracking-wider font-mono font-bold text-center"
                style={{ color: '#922B21' }}
              >
                Black Box
              </p>

              {/* Opaque black box */}
              <div className="flex items-center justify-center rounded-lg bg-black/80 h-20 border border-white/5">
                <motion.span
                  className="text-4xl text-white/20"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ?
                </motion.span>
              </div>

              {/* Streamed answer */}
              <AnimatePresence>
                {showBlackAnswer && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#0a1e2e] rounded-lg px-3 py-2"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1 font-mono">
                      AI Response
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {BLACK_BOX_ANSWER.slice(0, bbCharIndex)}
                      {bbCharIndex < BLACK_BOX_ANSWER.length && (
                        <motion.span
                          className="inline-block w-1.5 h-3 bg-white/50 ml-0.5 align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* "Why?" question */}
              <AnimatePresence>
                {showBlackWhy && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs text-white/50 italic">&ldquo;Why?&rdquo;</p>
                    <div className="bg-black/60 rounded-lg px-3 py-3 border border-white/5 text-center">
                      <p className="text-xs text-white/30 font-mono">
                        No trace. No evidence. No explanation.
                      </p>
                    </div>
                    <p className="text-[10px] text-white/25 text-center italic mt-1">
                      This is how the Air Canada chatbot worked.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT — GLASS BOX */}
        <AnimatePresence>
          {showGlassBox && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-2 rounded-xl p-4 border-2"
              style={{ borderColor: '#0E6B5C' }}
            >
              <p
                className="text-xs uppercase tracking-wider font-mono font-bold text-center"
                style={{ color: '#0E6B5C' }}
              >
                Glass Box — Your RAG System
              </p>

              {/* 6 Layers */}
              <div className="flex flex-col gap-1.5">
                {LAYERS.map((layer, i) => {
                  const isActive = activeLayer >= i;
                  const isCurrentlyLighting = activeLayer === i;

                  return (
                    <motion.div
                      key={layer.name}
                      initial={{ opacity: 0.2 }}
                      animate={{
                        opacity: isActive ? 1 : 0.2,
                        borderColor: allGlow
                          ? layer.color
                          : isActive
                          ? `${layer.color}88`
                          : 'rgba(255,255,255,0.05)',
                        boxShadow: allGlow
                          ? `0 0 12px ${layer.color}44`
                          : isCurrentlyLighting
                          ? `0 0 8px ${layer.color}33`
                          : 'none',
                      }}
                      transition={{ duration: 0.4 }}
                      className="rounded-md border px-3 py-1.5 bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] uppercase tracking-wider font-mono font-bold shrink-0 w-20"
                          style={{ color: isActive ? layer.color : 'rgba(255,255,255,0.2)' }}
                        >
                          {layer.name}
                        </span>

                        <div className="flex-1 min-w-0">
                          {/* Layer-specific content */}
                          {i === 0 && isActive && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] text-white/70 truncate"
                            >
                              {QUESTION}
                            </motion.p>
                          )}
                          {i === 1 && isActive && (
                            <div className="flex gap-1 overflow-hidden">
                              {CHUNKS.map((chunk, ci) => (
                                <motion.span
                                  key={chunk.id}
                                  initial={{ x: 30, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: ci * 0.2 }}
                                  className="text-[9px] text-white/50 bg-white/5 rounded px-1.5 py-0.5 shrink-0"
                                >
                                  {chunk.score.toFixed(2)}
                                </motion.span>
                              ))}
                            </div>
                          )}
                          {i === 2 && isActive && (
                            <div className="flex items-center gap-1">
                              {RANKED_ORDER.map((ri, pos) => (
                                <motion.span
                                  key={pos}
                                  initial={{ y: -8, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ delay: pos * 0.15 }}
                                  className="text-[9px] text-white/50 bg-white/5 rounded px-1.5 py-0.5"
                                >
                                  #{CHUNKS[ri].id}
                                </motion.span>
                              ))}
                              <span className="text-[9px] text-white/20">↕ reordered</span>
                            </div>
                          )}
                          {i === 3 && isActive && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[9px] text-white/40 truncate font-mono"
                            >
                              {SYSTEM_PROMPT.slice(0, 50)}...
                            </motion.p>
                          )}
                          {i === 4 && isActive && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] text-white/70 truncate"
                            >
                              {glassCharIndex > 0
                                ? renderGlassText(GLASS_ANSWER.slice(0, glassCharIndex))
                                : '...'}
                            </motion.p>
                          )}
                          {i === 5 && isActive && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-1"
                            >
                              {[1, 2, 3].map((n) => (
                                <motion.span
                                  key={n}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: n * 0.2, type: 'spring' }}
                                  className="inline-flex items-center gap-0.5 text-[9px] rounded-full px-1.5 py-0.5"
                                  style={{ backgroundColor: '#B8860B33', color: '#B8860B' }}
                                >
                                  [{n}] → src
                                </motion.span>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* "Why?" response */}
              <AnimatePresence>
                {showGlassWhy && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-1 mt-1"
                  >
                    <p className="text-xs text-white/50 italic">&ldquo;Why?&rdquo;</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[10px] font-mono text-center"
                      style={{ color: '#0E6B5C' }}
                    >
                      Every decision is traceable.
                    </motion.p>
                    <p className="text-[10px] text-white/25 text-center italic">
                      This is what you built today.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom caption */}
      <AnimatePresence>
        {showCaption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="w-full max-w-[700px] text-center mt-2"
          >
            <p className="text-xs text-white/50 leading-relaxed italic">
              {CAPTION}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay button */}
      {elapsed >= PHASE_TIMES.total - 0.5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            reset();
            onReplay?.();
          }}
          className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors font-mono"
        >
          ↻ Replay
        </motion.button>
      )}
    </div>
  );
}
