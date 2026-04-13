'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION = "What is Air Canada's bereavement fare policy?";

const CHUNKS = [
  {
    id: 1,
    text: 'Bereavement fares must be requested AT THE TIME OF BOOKING or within 24 hours of the initial reservation.',
    short: 'Bereavement fares must be requested...',
  },
  {
    id: 2,
    text: 'Air Canada does not offer retroactive bereavement discounts for tickets already purchased at regular fares.',
    short: 'Air Canada does not offer retroactive...',
  },
  {
    id: 3,
    text: 'Documentation such as a death certificate or funeral home notice may be required within 90 days of travel.',
    short: 'Documentation may be required up to 90 days...',
  },
];

const RESPONSE_PARTS = [
  { text: "Air Canada's bereavement fares must be requested at the time of booking", cite: 1 },
  { text: '. Retroactive discounts are not available', cite: 2 },
  { text: '. Documentation may be required within 90 days', cite: 3 },
];

// Stages: 0=question, 1=embed, 2=search, 3=generate, 4=response, 5=citations
const STAGE_DURATION = [1800, 1800, 2400, 2000, 2200, 3800];
const TOTAL_CYCLE = STAGE_DURATION.reduce((a, b) => a + b, 0);

export function RAGViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = !!isPaused; }, [isPaused]);

  const resetCycle = useCallback(() => {
    setStage(0);
    setElapsed(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed((prev) => {
        const next = prev + 100;
        if (next >= TOTAL_CYCLE) {
          setTimeout(resetCycle, 0);
          return prev;
        }
        // Determine stage from elapsed
        let acc = 0;
        for (let i = 0; i < STAGE_DURATION.length; i++) {
          acc += STAGE_DURATION[i];
          if (next < acc) {
            setStage(i);
            break;
          }
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [resetCycle]);

  const stageActive = (s: number) => stage >= s;
  const stageCurrent = (s: number) => stage === s;

  return (
    <div className="w-full min-h-[420px] flex flex-col items-center gap-4 p-6 select-none">
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-2">
        RAG Pipeline — Retrieval Augmented Generation
      </p>

      {/* Main flow */}
      <div className="w-full max-w-[900px] flex flex-col lg:flex-row items-stretch gap-0 relative">
        {/* QUESTION */}
        <motion.div
          animate={{
            borderColor: stageCurrent(0) ? '#B8860B' : stageActive(0) ? '#0E6B5C' : '#ffffff15',
            boxShadow: stageCurrent(0) ? '0 0 20px rgba(184,134,11,0.3)' : 'none',
          }}
          className="flex-shrink-0 border rounded-xl px-4 py-3 bg-[#0a1e2e] min-w-[180px]"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Question</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: stageActive(0) ? 1 : 0.3 }}
            className="text-xs text-white/90 leading-relaxed font-medium"
          >
            {QUESTION}
          </motion.p>
        </motion.div>

        {/* Arrow */}
        <div className="flex items-center justify-center lg:w-10 h-6 lg:h-auto">
          <motion.div
            animate={{ backgroundColor: stageActive(1) ? '#B8860B' : '#ffffff15' }}
            className="w-8 h-[2px] lg:w-full hidden lg:block"
          />
          <motion.div
            animate={{ backgroundColor: stageActive(1) ? '#B8860B' : '#ffffff15' }}
            className="w-[2px] h-4 lg:hidden block"
          />
        </div>

        {/* EMBED */}
        <motion.div
          animate={{
            borderColor: stageCurrent(1) ? '#B8860B' : stageActive(1) ? '#0E6B5C' : '#ffffff15',
            boxShadow: stageCurrent(1) ? '0 0 20px rgba(184,134,11,0.3)' : 'none',
          }}
          className="flex-shrink-0 border rounded-xl px-4 py-3 bg-[#0a1e2e] min-w-[120px] text-center"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Embed</p>
          <motion.div
            animate={{ opacity: stageActive(1) ? 1 : 0.3 }}
            className="text-2xl mb-1"
          >
            🔢
          </motion.div>
          <AnimatePresence>
            {stageCurrent(1) && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-[#B8860B] font-mono"
              >
                → 1536 dims
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Arrow */}
        <div className="flex items-center justify-center lg:w-10 h-6 lg:h-auto">
          <motion.div
            animate={{ backgroundColor: stageActive(2) ? '#B8860B' : '#ffffff15' }}
            className="w-8 h-[2px] lg:w-full hidden lg:block"
          />
          <motion.div
            animate={{ backgroundColor: stageActive(2) ? '#B8860B' : '#ffffff15' }}
            className="w-[2px] h-4 lg:hidden block"
          />
        </div>

        {/* SEARCH */}
        <motion.div
          animate={{
            borderColor: stageCurrent(2) ? '#B8860B' : stageActive(2) ? '#0E6B5C' : '#ffffff15',
            boxShadow: stageCurrent(2) ? '0 0 20px rgba(184,134,11,0.3)' : 'none',
          }}
          className="flex-shrink-0 border rounded-xl px-4 py-3 bg-[#0a1e2e] min-w-[200px]"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Search</p>
          <motion.div animate={{ opacity: stageActive(2) ? 1 : 0.3 }}>
            <div className="text-lg mb-2">🔍</div>
            <div className="space-y-1.5">
              {CHUNKS.map((chunk, i) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: stageActive(2) ? 1 : 0.2,
                    x: stageActive(2) ? 0 : -10,
                  }}
                  transition={{ delay: stageActive(2) ? i * 0.2 : 0 }}
                  className="bg-[#0E6B5C]/15 border border-[#0E6B5C]/30 rounded px-2 py-1"
                >
                  <p className="text-[9px] text-white/60 leading-snug truncate">{chunk.short}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Arrow */}
        <div className="flex items-center justify-center lg:w-10 h-6 lg:h-auto">
          <motion.div
            animate={{ backgroundColor: stageActive(3) ? '#B8860B' : '#ffffff15' }}
            className="w-8 h-[2px] lg:w-full hidden lg:block"
          />
          <motion.div
            animate={{ backgroundColor: stageActive(3) ? '#B8860B' : '#ffffff15' }}
            className="w-[2px] h-4 lg:hidden block"
          />
        </div>

        {/* GENERATE */}
        <motion.div
          animate={{
            borderColor: stageCurrent(3) ? '#B8860B' : stageActive(3) ? '#0E6B5C' : '#ffffff15',
            boxShadow: stageCurrent(3) ? '0 0 20px rgba(184,134,11,0.3)' : 'none',
          }}
          className="flex-shrink-0 border rounded-xl px-4 py-3 bg-[#0a1e2e] min-w-[120px] text-center"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Generate</p>
          <motion.div
            animate={{ opacity: stageActive(3) ? 1 : 0.3 }}
            className="text-2xl mb-1"
          >
            🧠
          </motion.div>
          <AnimatePresence>
            {stageCurrent(3) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[10px] text-[#0E6B5C] font-mono"
              >
                grounding...
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Arrow */}
        <div className="flex items-center justify-center lg:w-10 h-6 lg:h-auto">
          <motion.div
            animate={{ backgroundColor: stageActive(4) ? '#B8860B' : '#ffffff15' }}
            className="w-8 h-[2px] lg:w-full hidden lg:block"
          />
          <motion.div
            animate={{ backgroundColor: stageActive(4) ? '#B8860B' : '#ffffff15' }}
            className="w-[2px] h-4 lg:hidden block"
          />
        </div>

        {/* RESPONSE */}
        <motion.div
          animate={{
            borderColor: stageActive(4) ? '#B8860B' : '#ffffff15',
            boxShadow: stageActive(4) ? '0 0 24px rgba(184,134,11,0.25)' : 'none',
          }}
          className="flex-shrink-0 border rounded-xl px-4 py-3 bg-[#0a1e2e] min-w-[220px]"
        >
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Response</p>
          <AnimatePresence>
            {stageActive(4) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/80 leading-relaxed"
              >
                {RESPONSE_PARTS.map((part, i) => (
                  <span key={i}>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.3 }}
                    >
                      {part.text}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.3 + 0.2 }}
                      className="inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: '#B8860B', color: '#0F2F44' }}
                    >
                      [{part.cite}]
                    </motion.span>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Citation trace lines */}
      <AnimatePresence>
        {stage >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 mt-2"
          >
            {CHUNKS.map((chunk, i) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-[#B8860B]/10 border border-[#B8860B]/30 rounded-lg px-3 py-2 max-w-[220px]"
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#B8860B] text-[#0F2F44]">
                    [{chunk.id}]
                  </span>
                  <span className="text-[8px] text-[#B8860B]/70">← traced back</span>
                </div>
                <p className="text-[9px] text-white/60 leading-snug">{chunk.text}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caption */}
      <motion.p
        key={stage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-white/50 italic text-center mt-2 max-w-[500px]"
      >
        {stage <= 3
          ? ['The question enters the pipeline...', 'The question is converted to a vector with 1536 dimensions.', 'Searching the document store for the most relevant chunks...', 'Chunks + question combine into a grounded prompt for the LLM.'][stage]
          : 'This is RAG. The model answers from your documents, not its imagination.'}
      </motion.p>

    </div>
  );
}
