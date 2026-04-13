'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SENTENCE = ['The', 'trader', 'at', 'the', 'market', 'said', 'her', 'plantain', 'prices', 'have', 'gone', 'up', 'because', 'of', 'the', 'harmattan'];

const CONNECTIONS: Record<number, Record<number, number>> = {
  1: { 4: 0.9, 6: 0.85, 7: 0.7, 8: 0.6, 5: 0.3 },
  6: { 1: 0.95, 7: 0.5, 8: 0.7, 5: 0.3 },
  7: { 8: 0.9, 1: 0.5, 4: 0.6, 15: 0.75 },
  8: { 10: 0.9, 11: 0.9, 7: 0.8, 15: 0.7 },
  15: { 8: 0.85, 10: 0.7, 11: 0.7, 7: 0.6, 12: 0.5 },
};

const FOCAL_WORDS = [1, 6, 7, 8, 15];
const EXPLANATIONS: Record<number, string> = {
  1: '"Trader" connects strongly to market (where she works), her (refers to the trader), plantain (what she sells), and prices (what she tracks).',
  6: '"Her" connects most strongly to "trader" — the model learned that "her" refers back to the person mentioned earlier, not the place.',
  7: '"Plantain" connects to prices (its attribute), harmattan (which affects its supply), market (where it\'s sold), and trader (who sells it).',
  8: '"Prices" connects to "gone up" (the action happening to them) and to plantain and harmattan (the cause chain: weather → supply → price).',
  15: '"Harmattan" connects to prices going up — the model learned from millions of texts that dry season weather events affect crop economics.',
};

export function TransformerViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [activeWord, setActiveWord] = useState(-1);
  const [cycle, setCycle] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = !!isPaused; }, [isPaused]);

  useEffect(() => {
    setActiveWord(-1);
    setCycle(0);
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setCycle(c => {
        const next = c + 1;
        const idx = Math.floor(next / 2) % FOCAL_WORDS.length;
        if (next % 2 === 0) setActiveWord(FOCAL_WORDS[idx]);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [onReplay]);

  const connections = activeWord >= 0 ? CONNECTIONS[activeWord] || {} : {};

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="text-center mb-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">How a Transformer reads a sentence</p>
        <p className="text-white/80 text-sm">Each word looks at every other word simultaneously — brighter connections mean stronger relationships</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-3xl">
          {SENTENCE.map((word, i) => {
            const isActive = i === activeWord;
            const strength = connections[i] || 0;
            const isConnected = strength > 0;

            return (
              <motion.div
                key={`${word}-${i}`}
                className={`relative px-3 py-2.5 rounded-xl text-sm font-semibold border-2 cursor-default select-none ${
                  isActive
                    ? 'bg-[#B8860B] text-white border-[#B8860B]'
                    : isConnected
                      ? 'bg-[#B8860B]/15 text-white border-[#B8860B]/50'
                      : 'bg-white/[0.03] text-white/30 border-white/[0.06]'
                }`}
                animate={{
                  scale: isActive ? 1.15 : isConnected ? 1.05 : 1,
                  boxShadow: isActive ? '0 0 25px rgba(184,134,11,0.5)' : 'none',
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {word}
                {isConnected && (
                  <motion.span
                    className="absolute -top-2 -right-2 bg-[#B8860B] text-white text-[8px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {Math.round((strength as number) * 100)}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-[#B8860B]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Connection lines visualization */}
        {activeWord >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center gap-2 flex-wrap justify-center max-w-2xl"
          >
            {Object.entries(connections)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([targetIdx, strength]) => (
                <motion.div
                  key={targetIdx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5"
                >
                  <span className="text-[#B8860B] text-xs font-semibold">{SENTENCE[activeWord]}</span>
                  <motion.div
                    className="h-0.5 bg-[#B8860B] rounded"
                    style={{ width: `${(strength as number) * 60}px` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="text-white text-xs">{SENTENCE[parseInt(targetIdx)]}</span>
                  <span className="text-white/30 text-[9px]">{Math.round((strength as number) * 100)}%</span>
                </motion.div>
              ))}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeWord >= 0 && (
            <motion.p
              key={activeWord}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/60 text-xs text-center mt-5 max-w-lg leading-relaxed"
            >
              {EXPLANATIONS[activeWord]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center mt-3">
        <p className="text-white/25 text-[10px] italic">
          Every word attends to every other word simultaneously. The attention scores you see are computed in parallel — not one at a time. This is the core innovation of the Transformer.
        </p>
      </div>
    </div>
  );
}
