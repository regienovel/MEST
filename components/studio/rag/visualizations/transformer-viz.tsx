'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SENTENCE = 'The trader at the market said her plantain prices have gone up because of the harmattan'.split(' ');
const CONNECTIONS: Record<number, number[]> = {
  1: [6, 8], // trader -> her, plantain
  6: [1, 8], // her -> trader, plantain
  8: [9, 14], // prices -> have, harmattan
  14: [8, 9, 12], // harmattan -> prices, have, because
};

export function TransformerViz({ onReplay }: { onReplay?: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeWords = Object.keys(CONNECTIONS).map(Number);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((p) => (p + 1) % activeWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const lit = activeWords[activeIdx];
  const linked = CONNECTIONS[lit] || [];

  return (
    <div className="relative w-full min-h-[220px] flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-xs text-white/50 mb-2">Transformer Self-Attention</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-[600px]">
        {SENTENCE.map((word, i) => {
          const isLit = i === lit;
          const isLinked = linked.includes(i);
          return (
            <motion.span
              key={i}
              animate={{
                color: isLit ? '#B8860B' : isLinked ? '#0E6B5C' : '#ffffff',
                scale: isLit ? 1.2 : isLinked ? 1.1 : 1,
                textShadow: isLit ? '0 0 12px #B8860B' : 'none',
              }}
              transition={{ duration: 0.4 }}
              className="text-sm font-mono px-1"
            >
              {word}
            </motion.span>
          );
        })}
      </div>
      <motion.p
        key={lit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-[#B8860B]"
      >
        &quot;{SENTENCE[lit]}&quot; attends to:{' '}
        {linked.map((l) => `"${SENTENCE[l]}"`).join(', ')}
      </motion.p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70 mt-2">
          Replay
        </button>
      )}
    </div>
  );
}
