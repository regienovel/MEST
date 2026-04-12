'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const THRESHOLDS = [
  { value: 0.2, response: 'The Ashanti Empire was founded in 1867 by King Prempeh III who united the northern territories.', label: 'Low threshold — fabricates freely', color: '#ef4444', icon: '❌' },
  { value: 0.5, response: 'The Ashanti Empire was a powerful West African state, likely founded around the 17th century. Details may vary.', label: 'Medium — hedges but still guesses', color: '#B8860B', icon: '⚠️' },
  { value: 0.7, response: 'Based on available sources, the Ashanti Empire was established around 1670 by Osei Tutu I. [Source needed for exact date]', label: 'Higher — cites gaps', color: '#0E6B5C', icon: '✓' },
  { value: 0.95, response: "I don't have a verified source for the founding date of the Ashanti Empire in my current context. Please check a reliable historical source.", label: 'Strict — refuses without sources', color: '#0E6B5C', icon: '✓' },
];

export function StrictThresholdViz({ onReplay }: { onReplay?: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((p) => (p + 1) % THRESHOLDS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const t = THRESHOLDS[idx];

  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Confidence Threshold — When should AI refuse?</p>
      <div className="w-full max-w-[400px]">
        <div className="relative h-2 bg-white/10 rounded-full mb-2">
          <motion.div
            className="absolute h-full rounded-full"
            animate={{ width: `${t.value * 100}%`, backgroundColor: t.color }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="absolute top-[-6px] w-4 h-4 rounded-full border-2 border-white"
            animate={{ left: `${t.value * 100 - 2}%`, backgroundColor: t.color }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/30">
          <span>0 (accept all)</span>
          <span>1 (reject all)</span>
        </div>
      </div>
      <motion.p key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-sm font-mono font-bold" style={{ color: t.color }}>
        Threshold: {t.value} {t.icon}
      </motion.p>
      <motion.div
        key={`resp-${idx}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-lg px-4 py-2 max-w-[480px]"
        style={{ borderColor: t.color + '44' }}
      >
        <p className="text-xs text-white/70 font-mono leading-relaxed">{t.response}</p>
      </motion.div>
      <p className="text-[10px] text-white/40">{t.label}</p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
