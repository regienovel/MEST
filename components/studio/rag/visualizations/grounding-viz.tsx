'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const QUESTION = 'What percentage of Ghana\'s GDP comes from cocoa?';
const UNGROUNDED = 'Cocoa accounts for approximately 45% of Ghana\'s GDP, making it the dominant economic sector by a wide margin.';
const GROUNDED = 'According to the World Bank (2023), cocoa accounts for about 2% of Ghana\'s GDP, though it represents roughly 20-25% of export earnings. [Source: World Bank Ghana Economic Update, 2023]';

export function GroundingViz({ onReplay }: { onReplay?: () => void }) {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const maxLen = Math.max(UNGROUNDED.length, GROUNDED.length);
    const interval = setInterval(() => {
      setChars((p) => (p >= maxLen ? 0 : p + 1));
    }, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[280px] flex flex-col items-center justify-center gap-3 p-4">
      <p className="text-xs text-white/50">Grounding — Context prevents hallucination</p>
      <p className="text-xs text-[#B8860B] font-mono">Q: &quot;{QUESTION}&quot;</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-[620px]">
        <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
          <p className="text-[10px] text-red-400 mb-2 font-bold">Without grounding</p>
          <p className="text-xs text-white/80 font-mono leading-relaxed min-h-[80px]">
            {UNGROUNDED.slice(0, chars)}
            {chars < UNGROUNDED.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▊</motion.span>
            )}
          </p>
          {chars >= UNGROUNDED.length && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-400 mt-2">
              ❌ 45% is wildly wrong (actual: ~2%)
            </motion.p>
          )}
        </div>
        <div className="border border-[#0E6B5C]/30 rounded-lg p-3 bg-[#0E6B5C]/5">
          <p className="text-[10px] text-[#0E6B5C] mb-2 font-bold">With RAG grounding</p>
          <p className="text-xs text-white/80 font-mono leading-relaxed min-h-[80px]">
            {GROUNDED.slice(0, chars)}
            {chars < GROUNDED.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▊</motion.span>
            )}
          </p>
          {chars >= GROUNDED.length && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[#0E6B5C] mt-2">
              ✓ Accurate with source citation
            </motion.p>
          )}
        </div>
      </div>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
