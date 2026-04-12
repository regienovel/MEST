'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHRASES = [
  { text: 'The market is busy today', x: 70, y: 30, cluster: 'commerce' },
  { text: 'Prices are rising fast', x: 85, y: 45, cluster: 'commerce' },
  { text: 'The weather is very hot', x: 30, y: 75, cluster: 'weather' },
  { text: 'Harmattan dust fills the air', x: 20, y: 60, cluster: 'weather' },
  { text: 'She sells plantain chips', x: 75, y: 55, cluster: 'commerce' },
];

const NUMBERS = [0.23, -0.87, 0.12, 0.45, -0.33, 0.91];

export function EmbeddingViz({ onReplay }: { onReplay?: () => void }) {
  const [phase, setPhase] = useState(0);
  const [visibleDots, setVisibleDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => {
        if (p === 0) { setVisibleDots(0); return 1; }
        if (p === 1) return 2;
        if (p === 2) {
          setVisibleDots((d) => {
            if (d < PHRASES.length) return d + 1;
            return 0;
          });
          if (visibleDots >= PHRASES.length) return 0;
          return 2;
        }
        return 0;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [visibleDots]);

  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-3 p-4">
      <p className="text-xs text-white/50">Text → Embedding → Vector Space</p>
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.p key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-sm text-white font-mono">&quot;{PHRASES[0].text}&quot;</motion.p>
        )}
        {phase === 1 && (
          <motion.div key="nums" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-1.5">
            {NUMBERS.map((n, i) => (
              <motion.span key={i} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }} className="text-xs font-mono text-[#B8860B]">
                {n.toFixed(2)}
              </motion.span>
            ))}
            <span className="text-xs text-white/40">... ×1536</span>
          </motion.div>
        )}
        {phase === 2 && (
          <motion.div key="space" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative w-[240px] h-[140px] border border-white/10 rounded-lg">
            {PHRASES.slice(0, visibleDots).map((p, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-3 h-3 rounded-full flex items-center justify-center"
                style={{
                  left: `${p.x}%`, top: `${p.y}%`,
                  backgroundColor: p.cluster === 'commerce' ? '#B8860B' : '#0E6B5C',
                }}
                title={p.text}
              />
            ))}
            <span className="absolute bottom-1 left-2 text-[9px] text-[#B8860B]/60">commerce</span>
            <span className="absolute top-1 left-2 text-[9px] text-[#0E6B5C]/60">weather</span>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[10px] text-white/40">Similar meaning → nearby in vector space</p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
