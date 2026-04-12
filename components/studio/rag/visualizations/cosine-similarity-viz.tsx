'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PAIRS = [
  { a: 'king', b: 'queen', score: 0.92, angle: 12 },
  { a: 'king', b: 'apple', score: 0.15, angle: 75 },
  { a: 'Accra', b: 'Ghana', score: 0.85, angle: 18 },
  { a: 'plantain', b: 'quantum physics', score: 0.05, angle: 88 },
  { a: 'market', b: 'trader', score: 0.78, angle: 25 },
];

export function CosineSimilarityViz({ onReplay }: { onReplay?: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((p) => (p + 1) % PAIRS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const pair = PAIRS[idx];
  const radA = 0;
  const radB = (pair.angle * Math.PI) / 180;
  const len = 80;

  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Cosine Similarity — Angle between vectors</p>
      <div className="relative w-[200px] h-[120px]">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <motion.line
            x1={20} y1={100}
            animate={{ x2: 20 + len * Math.cos(radA), y2: 100 - len * Math.sin(radA) }}
            stroke="#B8860B" strokeWidth={2}
          />
          <motion.line
            x1={20} y1={100}
            animate={{ x2: 20 + len * Math.cos(radB), y2: 100 - len * Math.sin(radB) }}
            transition={{ duration: 0.8 }}
            stroke="#0E6B5C" strokeWidth={2}
          />
          <motion.text
            animate={{ x: 20 + (len + 10) * Math.cos(radA), y: 100 - (len + 10) * Math.sin(radA) }}
            fill="#B8860B" fontSize={10}
          >
            {pair.a}
          </motion.text>
          <motion.text
            animate={{ x: 20 + (len + 10) * Math.cos(radB), y: 100 - (len + 10) * Math.sin(radB) }}
            transition={{ duration: 0.8 }}
            fill="#0E6B5C" fontSize={10}
          >
            {pair.b}
          </motion.text>
          <circle cx={20} cy={100} r={3} fill="white" opacity={0.5} />
        </svg>
      </div>
      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <p className="text-lg font-mono font-bold" style={{ color: pair.score > 0.5 ? '#0E6B5C' : '#B8860B' }}>
          {pair.score.toFixed(2)}
        </p>
        <p className="text-[10px] text-white/40">
          {pair.angle}° apart — {pair.score > 0.7 ? 'very similar' : pair.score > 0.4 ? 'somewhat related' : 'unrelated'}
        </p>
      </motion.div>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
