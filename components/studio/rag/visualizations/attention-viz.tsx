'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SENTENCE = 'The trader at the market said her plantain prices have gone up because of the harmattan'.split(' ');
const STEPS = [
  { from: 6, to: 1, label: '"her" → "trader" (coreference)' },
  { from: 14, to: 8, label: '"harmattan" → "prices" (causal link)' },
  { from: 8, to: 10, label: '"prices" → "gone up" (action)' },
  { from: 1, to: 4, label: '"trader" → "market" (location)' },
];

export function AttentionViz({ onReplay }: { onReplay?: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((p) => (p + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const current = STEPS[step];

  return (
    <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Attention Head — Which words attend to which?</p>
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[580px]">
        {SENTENCE.map((word, i) => {
          const isFrom = i === current.from;
          const isTo = i === current.to;
          return (
            <motion.span
              key={i}
              animate={{
                backgroundColor: isFrom ? '#B8860B' : isTo ? '#0E6B5C' : 'transparent',
                color: isFrom || isTo ? '#fff' : '#ffffffaa',
                scale: isFrom ? 1.15 : isTo ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="text-sm font-mono px-1.5 py-0.5 rounded"
            >
              {word}
            </motion.span>
          );
        })}
      </div>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs"
      >
        <span className="text-[#B8860B] font-bold">●</span>
        <span className="text-white/80">{current.label}</span>
        <span className="text-[#0E6B5C] font-bold">●</span>
      </motion.div>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
