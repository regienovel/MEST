'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CHUNKS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  score: Math.round((1 - i * 0.07) * 100) / 100,
}));

const K_VALUES = [5, 10, 3, 1];

export function TopKViz({ onReplay }: { onReplay?: () => void }) {
  const [kIdx, setKIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKIdx((p) => (p + 1) % K_VALUES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const k = K_VALUES[kIdx];

  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Top-K Retrieval — How many chunks to return?</p>
      <motion.p key={kIdx} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-lg font-mono font-bold text-[#B8860B]">
        K = {k}
      </motion.p>
      <div className="flex flex-col gap-1 w-full max-w-[300px]">
        {CHUNKS.map((chunk, i) => {
          const included = i < k;
          return (
            <motion.div
              key={chunk.id}
              animate={{
                backgroundColor: included ? '#0E6B5C33' : '#ffffff08',
                borderColor: included ? '#0E6B5C66' : '#ffffff10',
                x: included ? 0 : 8,
              }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center px-3 py-1 rounded border text-xs font-mono"
            >
              <span style={{ color: included ? '#0E6B5C' : '#ffffff33' }}>chunk_{chunk.id}</span>
              <span style={{ color: included ? '#B8860B' : '#ffffff22' }}>{chunk.score}</span>
            </motion.div>
          );
        })}
        <motion.div
          animate={{ top: `${k * 28 + 4}px` }}
          transition={{ duration: 0.5 }}
          className="w-full h-0.5 bg-[#B8860B] relative"
          style={{ marginTop: -CHUNKS.length * 28 + k * 28 }}
        />
      </div>
      <p className="text-[10px] text-white/40">Higher K = more context but more noise</p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
