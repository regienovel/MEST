'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WRONG = 'The capital of Wakanda is Birnin Zana, a technologically advanced city hidden in East Africa.';
const RIGHT = "I don't have information about Wakanda — it is a fictional country from Marvel Comics and does not have a real capital.";

export function HallucinationViz({ onReplay }: { onReplay?: () => void }) {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const maxLen = Math.max(WRONG.length, RIGHT.length);
    const interval = setInterval(() => {
      setChars((p) => {
        if (p >= maxLen) return 0;
        return p + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-4">
      <p className="text-xs text-white/50">Hallucination — Confident ≠ Correct</p>
      <p className="text-xs text-[#B8860B] font-mono">Q: &quot;What is the capital of Wakanda?&quot;</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-[600px]">
        <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
          <p className="text-[10px] text-red-400 mb-2 font-bold">❌ Hallucinating (confident)</p>
          <p className="text-xs text-white/80 font-mono leading-relaxed min-h-[60px]">
            {WRONG.slice(0, chars)}
            {chars < WRONG.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▊</motion.span>
            )}
          </p>
        </div>
        <div className="border border-[#0E6B5C]/30 rounded-lg p-3 bg-[#0E6B5C]/5">
          <p className="text-[10px] text-[#0E6B5C] mb-2 font-bold">✓ Honest response</p>
          <p className="text-xs text-white/80 font-mono leading-relaxed min-h-[60px]">
            {RIGHT.slice(0, chars)}
            {chars < RIGHT.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▊</motion.span>
            )}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-white/40 max-w-[400px] text-center">
        LLMs generate plausible text, not verified facts. Confidence ≠ accuracy.
      </p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
