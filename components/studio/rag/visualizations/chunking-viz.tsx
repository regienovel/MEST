'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const METHODS = [
  { name: 'Paragraph', count: 5, color: '#B8860B', sizes: [3, 2, 4, 2, 3] },
  { name: 'Fixed-size (200 chars)', count: 8, color: '#0E6B5C', sizes: [2, 2, 2, 2, 2, 2, 2, 2] },
  { name: 'Semantic', count: 4, color: '#6B8BB8', sizes: [4, 3, 5, 2] },
];

export function ChunkingViz({ onReplay }: { onReplay?: () => void }) {
  const [methodIdx, setMethodIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMethodIdx((p) => (p + 1) % METHODS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const method = METHODS[methodIdx];

  return (
    <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Document Chunking Strategies</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={methodIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm font-mono" style={{ color: method.color }}>
            {method.name}
          </p>
          <div className="flex gap-1.5 items-end">
            {method.sizes.map((size, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded"
                style={{
                  width: 40,
                  height: size * 16,
                  backgroundColor: method.color + '44',
                  border: `1px solid ${method.color}66`,
                  originY: 1,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-white/70 font-mono">
            → <span style={{ color: method.color }}>{method.count} chunks</span>
          </p>
        </motion.div>
      </AnimatePresence>
      <p className="text-[10px] text-white/40">
        Same document, different chunking → different retrieval quality
      </p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
