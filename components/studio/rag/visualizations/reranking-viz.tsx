'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface Chunk {
  id: string;
  text: string;
  initialScore: number;
  rerankedScore: number;
  initialRank: number;
  rerankedRank: number;
}

const CHUNKS: Chunk[] = [
  {
    id: 'a',
    text: 'Yours sincerely, James Whitfield',
    initialScore: 38,
    rerankedScore: 6,
    initialRank: 1,
    rerankedRank: 5,
  },
  {
    id: 'b',
    text: 'Beyond the technical requirements outlined in the role...',
    initialScore: 17,
    rerankedScore: 14,
    initialRank: 2,
    rerankedRank: 4,
  },
  {
    id: 'c',
    text: 'Your requirements align perfectly with my experience in...',
    initialScore: 16,
    rerankedScore: 42,
    initialRank: 3,
    rerankedRank: 1,
  },
  {
    id: 'd',
    text: 'Having delivered scalable frontend systems at two startups...',
    initialScore: 15,
    rerankedScore: 28,
    initialRank: 4,
    rerankedRank: 2,
  },
  {
    id: 'e',
    text: "I'd welcome the opportunity to discuss how my background...",
    initialScore: 10,
    rerankedScore: 21,
    initialRank: 5,
    rerankedRank: 3,
  },
];

// Phases: 0=initial, 1=claude-reading, 2=reranked
const PHASE_DURATION = [3000, 2000, 5000];

export function RerankingViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [phase, setPhase] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = !!isPaused; }, [isPaused]);

  const resetCycle = useCallback(() => setPhase(0), []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (pausedRef.current) {
        timeout = setTimeout(advance, 100);
        return;
      }
      setPhase((prev) => {
        const next = (prev + 1) % 3;
        if (next === 0) {
          timeout = setTimeout(advance, 500);
        } else {
          timeout = setTimeout(advance, PHASE_DURATION[next]);
        }
        return next;
      });
    };

    timeout = setTimeout(advance, PHASE_DURATION[0]);
    return () => clearTimeout(timeout);
  }, []);

  const isReranked = phase === 2;
  const sorted = [...CHUNKS].sort((a, b) =>
    isReranked ? a.rerankedRank - b.rerankedRank : a.initialRank - b.initialRank
  );

  const getRankDelta = (chunk: Chunk) => chunk.initialRank - chunk.rerankedRank;

  return (
    <div className="w-full min-h-[420px] flex flex-col items-center gap-4 p-6 select-none">
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
        Re-ranking — LLM re-scores for true relevance
      </p>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            borderColor: phase === 0 ? '#B8860B44' : phase === 1 ? '#0E6B5C44' : '#0E6B5C88',
            backgroundColor: phase === 0 ? '#B8860B08' : phase === 1 ? '#0E6B5C08' : '#0E6B5C15',
          }}
        >
          {phase === 0 && (
            <>
              <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <span className="text-xs text-[#B8860B] font-mono">Before: ranked by similarity score</span>
            </>
          )}
          {phase === 1 && (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3 border border-[#0E6B5C] border-t-transparent rounded-full"
              />
              <span className="text-xs text-[#0E6B5C] font-mono">Claude Sonnet reads each chunk...</span>
            </>
          )}
          {phase === 2 && (
            <>
              <span className="w-2 h-2 rounded-full bg-[#0E6B5C]" />
              <span className="text-xs text-[#0E6B5C] font-mono">After: ranked by relevance to your question</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Chunk list */}
      <LayoutGroup>
        <div className="w-full max-w-[520px] space-y-2">
          {sorted.map((chunk, visualIndex) => {
            const delta = getRankDelta(chunk);
            const score = isReranked ? chunk.rerankedScore : chunk.initialScore;
            const rank = isReranked ? chunk.rerankedRank : chunk.initialRank;

            return (
              <motion.div
                key={chunk.id}
                layout
                transition={{ duration: 0.7, type: 'spring', bounce: 0.15 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border relative overflow-hidden"
                style={{
                  borderColor:
                    isReranked && delta > 0
                      ? '#0E6B5C88'
                      : isReranked && delta < 0
                      ? '#922B2155'
                      : '#ffffff10',
                  backgroundColor:
                    isReranked && delta > 0
                      ? 'rgba(14,107,92,0.12)'
                      : isReranked && delta < 0
                      ? 'rgba(146,43,33,0.08)'
                      : 'rgba(255,255,255,0.03)',
                }}
              >
                {/* Flash effect on rerank */}
                {isReranked && delta !== 0 && (
                  <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 rounded-lg"
                    style={{
                      backgroundColor: delta > 0 ? '#0E6B5C' : '#922B21',
                    }}
                  />
                )}

                {/* Rank */}
                <motion.span
                  className="text-sm font-mono font-bold w-6 text-right flex-shrink-0"
                  animate={{
                    color:
                      isReranked && visualIndex === 0
                        ? '#B8860B'
                        : isReranked && delta < 0
                        ? '#922B21'
                        : '#ffffff66',
                  }}
                >
                  #{rank}
                </motion.span>

                {/* Score bar */}
                <div className="w-14 h-2 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                  <motion.div
                    animate={{
                      width: `${score * 2.2}%`,
                      backgroundColor:
                        isReranked && delta > 0 ? '#0E6B5C' : isReranked && delta < 0 ? '#922B21' : '#B8860B',
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                  />
                </div>

                {/* Text */}
                <span className="text-[11px] text-white/70 flex-grow truncate font-mono">
                  {chunk.text}
                </span>

                {/* Score */}
                <span
                  className="text-xs font-mono font-bold flex-shrink-0 w-8 text-right"
                  style={{
                    color:
                      isReranked && delta > 0 ? '#0E6B5C' : isReranked && delta < 0 ? '#922B21' : '#B8860B',
                  }}
                >
                  {score}%
                </span>

                {/* Delta badge */}
                <AnimatePresence>
                  {isReranked && delta !== 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-[10px] font-mono font-bold flex-shrink-0 w-8 text-right"
                      style={{ color: delta > 0 ? '#0E6B5C' : '#922B21' }}
                    >
                      {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Caption */}
      <motion.p
        className="text-xs text-white/50 italic text-center max-w-[400px] mt-2"
      >
        Similarity finds related text. Reranking finds the answer.
      </motion.p>

    </div>
  );
}
