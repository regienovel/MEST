'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WORDS = ['The', 'trader', 'at', 'the', 'market', 'said', 'her', 'plantain', 'prices', 'have', 'gone', 'up', 'because', 'of', 'the', 'harmattan'];
const TOKENS = ['The', 'trad', 'er', 'at', 'the', 'market', 'said', 'her', 'plant', 'ain', 'prices', 'have', 'gone', 'up', 'because', 'of', 'the', 'har', 'matt', 'an', '.'];

export function TokenViz({ onReplay }: { onReplay?: () => void }) {
  const [phase, setPhase] = useState(0); // 0=words, 1=tokens

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-white/50">Tokenization — Words ≠ Tokens</p>
      <AnimatePresence mode="wait">
        {phase === 0 ? (
          <motion.div
            key="words"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-1.5 max-w-[560px]"
          >
            {WORDS.map((w, i) => (
              <span key={i} className="text-sm font-mono text-white border border-white/20 px-1.5 py-0.5 rounded">
                {w}
              </span>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="tokens"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-1 max-w-[560px]"
          >
            {TOKENS.map((t, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: ['har', 'matt', 'an'].includes(t) ? '#B8860B33' : '#0E6B5C33',
                  color: ['har', 'matt', 'an'].includes(t) ? '#B8860B' : '#0E6B5C',
                  border: `1px solid ${['har', 'matt', 'an'].includes(t) ? '#B8860B55' : '#0E6B5C55'}`,
                }}
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.p
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-mono"
        style={{ color: phase === 0 ? '#ffffff88' : '#B8860B' }}
      >
        {phase === 0 ? `${WORDS.length} words` : `${WORDS.length} words → ${TOKENS.length} tokens`}
      </motion.p>
      <p className="text-[10px] text-white/40">
        &quot;harmattan&quot; → &quot;har|matt|an&quot; (3 tokens for 1 word)
      </p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
