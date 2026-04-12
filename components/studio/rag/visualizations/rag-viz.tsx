'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STEPS = ['Question', 'Retrieve', 'Ground', 'Generate', 'Cite'];
const LABELS = [
  'User asks a question',
  'Search vector DB for relevant chunks',
  'Build prompt with retrieved context',
  'LLM generates grounded answer',
  'Citations link back to sources',
];

export function RAGViz({ onReplay }: { onReplay?: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((p) => (p + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-5 p-4">
      <p className="text-xs text-white/50">RAG Pipeline — Retrieval Augmented Generation</p>
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              animate={{
                backgroundColor: i <= active ? (i === active ? '#B8860B' : '#0E6B5C') : '#ffffff15',
                scale: i === active ? 1.15 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="rounded-lg px-3 py-2 text-xs font-mono text-white"
            >
              {step}
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                animate={{ backgroundColor: i < active ? '#0E6B5C' : '#ffffff15' }}
                className="w-6 h-0.5 mx-0.5"
              />
            )}
          </div>
        ))}
      </div>
      {active === 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4"
        >
          {['[1]', '[2]', '[3]'].map((cite, i) => (
            <motion.div
              key={i}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="text-[10px] text-[#B8860B] border border-[#B8860B]/30 rounded px-2 py-1"
            >
              {cite} source chunk
            </motion.div>
          ))}
        </motion.div>
      )}
      <motion.p key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/60">
        {LABELS[active]}
      </motion.p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
