'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SENTENCE = ['The', 'trader', 'at', 'the', 'market', 'said', 'her', 'plantain', 'prices', 'have', 'gone', 'up', 'because', 'of', 'the', 'harmattan'];

interface FocusStep {
  word: number;
  targets: Array<{ idx: number; strength: number; label: string }>;
  explanation: string;
}

const STEPS: FocusStep[] = [
  {
    word: 6,
    targets: [
      { idx: 1, strength: 0.95, label: 'refers to' },
      { idx: 7, strength: 0.4, label: '' },
      { idx: 8, strength: 0.5, label: '' },
    ],
    explanation: 'Who does "her" refer to? The model traces back and finds "trader" — not "market." This is coreference resolution, and attention does it automatically.',
  },
  {
    word: 15,
    targets: [
      { idx: 8, strength: 0.85, label: 'affects' },
      { idx: 10, strength: 0.75, label: 'causes' },
      { idx: 11, strength: 0.75, label: '' },
      { idx: 7, strength: 0.6, label: 'impacts' },
    ],
    explanation: '"Harmattan" connects to "prices" and "gone up" — the model learned that weather events cause economic effects on crops like plantain.',
  },
  {
    word: 7,
    targets: [
      { idx: 1, strength: 0.7, label: 'sold by' },
      { idx: 4, strength: 0.65, label: 'found at' },
      { idx: 8, strength: 0.9, label: 'has' },
      { idx: 15, strength: 0.7, label: 'affected by' },
    ],
    explanation: '"Plantain" builds a complete picture: sold by the trader, found at the market, has prices, affected by the harmattan.',
  },
];

export function AttentionViz({ onReplay }: { onReplay?: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx(s => (s + 1) % STEPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [onReplay]);

  const step = STEPS[stepIdx];

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="text-center mb-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Attention Mechanism</p>
        <p className="text-white/80 text-sm">For each word, the model asks: &ldquo;Which other words help me understand this one?&rdquo;</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-3xl mb-8">
          {SENTENCE.map((word, i) => {
            const isFocus = i === step.word;
            const target = step.targets.find(t => t.idx === i);
            const isTarget = !!target;

            return (
              <motion.div
                key={`${word}-${i}`}
                className={`relative px-3 py-2.5 rounded-xl text-sm font-semibold border-2 ${
                  isFocus ? 'bg-[#B8860B] text-white border-[#B8860B]'
                    : isTarget ? 'bg-[#0E6B5C]/20 text-white border-[#0E6B5C]/60'
                    : 'bg-white/[0.03] text-white/25 border-white/[0.05]'
                }`}
                animate={{
                  scale: isFocus ? 1.15 : isTarget ? 1.08 : 1,
                  boxShadow: isFocus ? '0 0 30px rgba(184,134,11,0.5)' : isTarget ? '0 0 15px rgba(14,107,92,0.3)' : 'none',
                }}
              >
                {word}
                {isTarget && target && (
                  <motion.span
                    className="absolute -top-2.5 -right-1 bg-[#0E6B5C] text-white text-[8px] font-bold rounded-full px-1.5 py-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    {Math.round(target.strength * 100)}%
                  </motion.span>
                )}
                {isFocus && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-[#B8860B]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div className="flex items-center gap-3 flex-wrap justify-center mb-6" key={stepIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {step.targets.sort((a, b) => b.strength - a.strength).map((target, ti) => (
            <motion.div key={target.idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ti * 0.15 }} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <span className="text-[#B8860B] font-semibold text-xs">{SENTENCE[step.word]}</span>
              <motion.div className="h-0.5 bg-gradient-to-r from-[#B8860B] to-[#0E6B5C] rounded" style={{ width: `${target.strength * 80}px` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: ti * 0.15 }} />
              <span className="text-[#0E6B5C]">→</span>
              <span className="text-[#0E6B5C] font-semibold text-xs">{SENTENCE[target.idx]}</span>
              {target.label && <span className="text-white/30 text-[9px]">({target.label})</span>}
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={stepIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white/5 rounded-xl px-6 py-4 max-w-lg">
            <p className="text-white/70 text-xs leading-relaxed text-center">{step.explanation}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-white/25 text-[10px] italic mt-3">
        GPT-4o has 128 layers, each with 128 attention heads — that&apos;s 16,384 attention computations happening simultaneously for every token.
      </p>
    </div>
  );
}
