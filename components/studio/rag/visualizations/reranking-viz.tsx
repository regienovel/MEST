'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL = [
  { id: 1, text: 'Cocoa prices in Ghana 2024', score: 0.82 },
  { id: 2, text: 'History of chocolate making', score: 0.79 },
  { id: 3, text: 'Ghana export regulations', score: 0.75 },
  { id: 4, text: 'Cocoa farmer income report', score: 0.71 },
  { id: 5, text: 'West African trade routes', score: 0.68 },
];

const RERANKED = [
  { id: 4, text: 'Cocoa farmer income report', score: 0.95 },
  { id: 1, text: 'Cocoa prices in Ghana 2024', score: 0.88 },
  { id: 3, text: 'Ghana export regulations', score: 0.72 },
  { id: 5, text: 'West African trade routes', score: 0.41 },
  { id: 2, text: 'History of chocolate making', score: 0.23 },
];

export function RerankingViz({ onReplay }: { onReplay?: () => void }) {
  const [reranked, setReranked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setReranked((p) => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const items = reranked ? RERANKED : INITIAL;

  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Re-ranking — LLM re-scores for relevance</p>
      <AnimatePresence>
        <motion.p
          key={reranked ? 'after' : 'before'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-mono"
          style={{ color: reranked ? '#0E6B5C' : '#B8860B' }}
        >
          {reranked ? 'After re-ranking (Claude evaluates)' : 'Initial retrieval (vector similarity)'}
        </motion.p>
      </AnimatePresence>
      <div className="flex flex-col gap-1.5 w-full max-w-[360px]">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            layout
            transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
            className="flex justify-between items-center px-3 py-1.5 rounded border text-xs font-mono"
            style={{
              borderColor: reranked && i === 0 ? '#0E6B5C66' : '#ffffff15',
              backgroundColor: reranked && i === 0 ? '#0E6B5C15' : '#ffffff05',
            }}
          >
            <span className="text-white/70 truncate max-w-[220px]">{item.text}</span>
            <span style={{ color: item.score > 0.7 ? '#0E6B5C' : '#ffffff44' }}>
              {item.score.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </div>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
