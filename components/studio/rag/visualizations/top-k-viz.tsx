'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHUNKS = [
  { id: 1, text: 'Bereavement fares must be requested at the time of booking or within 24 hours...', score: 43 },
  { id: 2, text: 'Air Canada does not offer retroactive bereavement discounts for tickets...', score: 38 },
  { id: 3, text: 'Documentation such as a death certificate may be required within 90 days...', score: 35 },
  { id: 4, text: 'Eligible relationships include spouse, parent, child, sibling, grandparent...', score: 31 },
  { id: 5, text: 'Bereavement fares are available on Air Canada-operated flights only...', score: 27 },
  { id: 6, text: 'Discount percentages vary by route and fare class availability...', score: 22 },
  { id: 7, text: 'Air Canada reserves the right to verify submitted documentation...', score: 18 },
  { id: 8, text: 'Travel agents may submit bereavement requests on behalf of passengers...', score: 14 },
  { id: 9, text: 'Bereavement policies differ from compassionate travel exceptions...', score: 11 },
  { id: 10, text: 'Refund requests for bereavement circumstances follow standard procedures...', score: 8 },
];

const K_CONFIGS = [
  { k: 3, note: 'Focused: might miss relevant chunks', duration: 3500 },
  { k: 5, note: 'Balanced: standard setting', duration: 3500 },
  { k: 10, note: 'Thorough: includes noise', duration: 3500 },
  { k: 1, note: 'Risky: one shot only', duration: 3500 },
];

export function TopKViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [kIdx, setKIdx] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = !!isPaused; }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setKIdx((p) => (p + 1) % K_CONFIGS.length);
    }, K_CONFIGS[0].duration);
    return () => clearInterval(interval);
  }, []);

  const { k, note } = K_CONFIGS[kIdx];

  return (
    <div className="w-full min-h-[480px] flex flex-col items-center gap-4 p-6 select-none">
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
        Top-K Retrieval — How many chunks reach the model?
      </p>

      {/* K display */}
      <div className="flex items-center gap-4">
        <motion.div
          key={kIdx}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-baseline gap-2"
        >
          <span className="text-sm text-white/50 font-mono">K =</span>
          <motion.span
            className="text-4xl font-bold font-mono"
            style={{ color: '#B8860B' }}
            animate={{ textShadow: '0 0 20px rgba(184,134,11,0.5)' }}
          >
            {k}
          </motion.span>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={kIdx}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-white/50 italic border border-white/10 rounded-full px-3 py-1"
          >
            {note}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Chunk list */}
      <div className="w-full max-w-[520px] relative">
        {CHUNKS.map((chunk, i) => {
          const included = i < k;
          return (
            <motion.div
              key={chunk.id}
              animate={{
                backgroundColor: included ? 'rgba(14,107,92,0.15)' : 'rgba(255,255,255,0.02)',
                borderColor: included ? 'rgba(184,134,11,0.5)' : 'rgba(255,255,255,0.06)',
                scale: included ? 1 : 0.97,
                opacity: included ? 1 : 0.4,
              }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg border mb-1.5"
            >
              {/* Rank number */}
              <motion.span
                animate={{ color: included ? '#B8860B' : '#ffffff22' }}
                className="text-sm font-mono font-bold w-6 text-right flex-shrink-0"
              >
                #{chunk.id}
              </motion.span>

              {/* Score bar */}
              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                <motion.div
                  animate={{
                    width: `${chunk.score * 2.3}%`,
                    backgroundColor: included ? '#B8860B' : '#ffffff15',
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                />
              </div>

              {/* Chunk text */}
              <motion.span
                animate={{ color: included ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
                className="text-[11px] flex-grow truncate font-mono"
              >
                {chunk.text}
              </motion.span>

              {/* Score */}
              <motion.span
                animate={{ color: included ? '#B8860B' : '#ffffff22' }}
                className="text-xs font-mono font-bold flex-shrink-0 w-8 text-right"
              >
                {chunk.score}%
              </motion.span>

              {/* Included indicator */}
              <AnimatePresence>
                {included && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-[10px] flex-shrink-0"
                    style={{ color: '#0E6B5C' }}
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* K line */}
        <motion.div
          animate={{ top: k * 46 - 4 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
          className="absolute left-0 right-0 h-[2px] z-10 flex items-center"
          style={{ backgroundColor: '#B8860B' }}
        >
          <motion.span
            className="absolute -right-2 -top-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: '#B8860B', color: '#0F2F44' }}
          >
            K={k} cutoff
          </motion.span>
          {/* Glow */}
          <div className="absolute inset-0 blur-sm" style={{ backgroundColor: '#B8860B', opacity: 0.5 }} />
        </motion.div>
      </div>

      {/* Caption */}
      <p className="text-xs text-white/50 italic text-center max-w-[400px] mt-2">
        K controls how many candidates reach the generation model.
      </p>

    </div>
  );
}
