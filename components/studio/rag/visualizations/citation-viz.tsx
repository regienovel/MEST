'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SOURCES = [
  { id: 1, text: 'Ghana cocoa production reached 800,000 tonnes in 2023.' },
  { id: 2, text: 'Smallholder farmers produce 70% of global cocoa supply.' },
  { id: 3, text: 'Fair trade certification increased farmer income by 12%.' },
];

const RESPONSE = [
  { text: 'Ghana produced 800,000 tonnes of cocoa in 2023', cite: 1 },
  { text: ', primarily through smallholder farmers who account for 70% of supply', cite: 2 },
  { text: '. Fair trade programs have boosted their income by 12%', cite: 3 },
  { text: '.', cite: null },
];

export function CitationViz({ onReplay }: { onReplay?: () => void }) {
  const [hoveredCite, setHoveredCite] = useState<number | null>(null);
  const [autoCite, setAutoCite] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoCite((p) => (p + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeCite = hoveredCite ?? (autoCite < 3 ? autoCite + 1 : null);

  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Citations — Tracing claims to sources</p>
      <div className="max-w-[500px] text-sm text-white/80 leading-relaxed">
        {RESPONSE.map((seg, i) => (
          <span key={i}>
            <span className={activeCite === seg.cite ? 'text-[#B8860B]' : ''}>{seg.text}</span>
            {seg.cite && (
              <motion.span
                onMouseEnter={() => setHoveredCite(seg.cite)}
                onMouseLeave={() => setHoveredCite(null)}
                animate={{
                  color: activeCite === seg.cite ? '#B8860B' : '#0E6B5C',
                  scale: activeCite === seg.cite ? 1.2 : 1,
                }}
                className="inline-block cursor-pointer text-xs font-bold mx-0.5"
              >
                [{seg.cite}]
              </motion.span>
            )}
          </span>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {activeCite && (
          <motion.div
            key={activeCite}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-[#B8860B]/30 bg-[#B8860B]/10 rounded-lg px-4 py-2 max-w-[460px]"
          >
            <p className="text-[10px] text-[#B8860B] mb-1">Source [{activeCite}]</p>
            <p className="text-xs text-white/70">{SOURCES[activeCite - 1].text}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
