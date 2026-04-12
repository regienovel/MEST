'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PATTERNS = [
  {
    label: 'Rude refusal',
    color: '#ef4444',
    icon: '❌',
    text: "I can't help with that. Stop asking questions I don't have answers to.",
    verdict: 'Bad UX — alienates users',
  },
  {
    label: 'Honest + Helpful',
    color: '#B8860B',
    icon: '✓',
    text: "I don't have verified information about this in my current sources. However, I can suggest checking the Ghana Statistical Service website for accurate data.",
    verdict: 'Best practice — honest and redirects',
  },
  {
    label: 'Dishonest compliance',
    color: '#ef4444',
    icon: '❌',
    text: "Sure! The answer is 42%. Ghana's cocoa sector dominates the economy and has grown 15% year-over-year since 2020.",
    verdict: 'Dangerous — confident fabrication',
  },
];

export function RefusalPatternViz({ onReplay }: { onReplay?: () => void }) {
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlight((p) => (p + 1) % PATTERNS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Refusal Patterns — How should AI say &quot;I don&apos;t know&quot;?</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[680px]">
        {PATTERNS.map((p, i) => (
          <motion.div
            key={i}
            animate={{
              borderColor: i === highlight ? p.color + '88' : '#ffffff15',
              scale: i === highlight ? 1.03 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="border rounded-lg p-3 flex flex-col gap-2"
            style={{ backgroundColor: i === highlight ? p.color + '08' : 'transparent' }}
          >
            <p className="text-[10px] font-bold" style={{ color: p.color }}>
              {p.icon} {p.label}
            </p>
            <p className="text-[11px] text-white/70 font-mono leading-relaxed flex-1">
              &quot;{p.text}&quot;
            </p>
            <motion.p
              animate={{ opacity: i === highlight ? 1 : 0.3 }}
              className="text-[9px]"
              style={{ color: p.color }}
            >
              {p.verdict}
            </motion.p>
          </motion.div>
        ))}
      </div>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
