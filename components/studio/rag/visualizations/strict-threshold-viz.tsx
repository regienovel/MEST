'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THRESHOLD_STOPS = [0.15, 0.35, 0.50, 0.75, 0.90];
const SWEET_SPOT = { min: 0.15, max: 0.40 };

interface TestCase {
  question: string;
  topSimilarity: number;
  answerWhenAllowed: string;
  refusalAnswer: string;
}

const LEFT_CASE: TestCase = {
  question: "What was James's last role?",
  topSimilarity: 0.38,
  answerWhenAllowed: 'Senior Frontend Developer at Monzo, where he led the design system migration. [1]',
  refusalAnswer: "I don't have enough confidence in the available sources to answer that question.",
};

const RIGHT_CASE: TestCase = {
  question: 'What is the capital of Wakanda?',
  topSimilarity: 0.05,
  answerWhenAllowed: 'The capital of Wakanda is Birnin Zana, also known as the Golden City.',
  refusalAnswer: "I don't have information about that in my documents.",
};

function getResponse(testCase: TestCase, threshold: number): { text: string; pass: boolean } {
  if (testCase.topSimilarity >= threshold) {
    return { text: testCase.answerWhenAllowed, pass: true };
  }
  return { text: testCase.refusalAnswer, pass: false };
}

export function StrictThresholdViz({ onReplay }: { onReplay?: () => void }) {
  const [stopIndex, setStopIndex] = useState(0);
  const threshold = THRESHOLD_STOPS[stopIndex];

  const leftResult = getResponse(LEFT_CASE, threshold);
  const rightResult = getResponse(RIGHT_CASE, threshold);

  // Left SHOULD answer (similarity 38% is real data), Right SHOULD refuse (5% is garbage)
  const leftCorrect = leftResult.pass; // good when it answers
  const rightCorrect = !rightResult.pass; // good when it refuses

  const isInSweetSpot = threshold >= SWEET_SPOT.min && threshold <= SWEET_SPOT.max;

  const reset = useCallback(() => setStopIndex(0), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStopIndex((p) => {
        if (p >= THRESHOLD_STOPS.length - 1) {
          // Hold at end, then loop
          setTimeout(reset, 2500);
          return p;
        }
        return p + 1;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [reset]);

  const thresholdPercent = threshold * 100;

  return (
    <div className="w-full flex flex-col items-center gap-5 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
        Confidence Threshold — Finding the sweet spot
      </p>

      {/* Slider */}
      <div className="w-full max-w-[600px]">
        <div className="relative h-3 bg-white/5 rounded-full overflow-visible">
          {/* Sweet spot zone */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${SWEET_SPOT.min * 100}%`,
              width: `${(SWEET_SPOT.max - SWEET_SPOT.min) * 100}%`,
              backgroundColor: 'rgba(14, 107, 92, 0.25)',
              border: '1px solid rgba(14, 107, 92, 0.4)',
            }}
          />
          {/* Filled track */}
          <motion.div
            className="absolute h-full rounded-full"
            style={{ backgroundColor: isInSweetSpot ? '#0E6B5C' : threshold < SWEET_SPOT.min ? '#922B21' : '#B8860B' }}
            animate={{ width: `${thresholdPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: isInSweetSpot ? '#0E6B5C' : threshold < SWEET_SPOT.min ? '#922B21' : '#B8860B' }}
            animate={{ left: `calc(${thresholdPercent}% - 12px)` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <span className="text-[8px] text-white font-bold">{threshold.toFixed(2)}</span>
          </motion.div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-white/30">
          <span>0.0 — Accept everything</span>
          <motion.span
            animate={{ color: isInSweetSpot ? '#0E6B5C' : 'rgba(255,255,255,0.3)' }}
            className="font-semibold"
          >
            Sweet Spot
          </motion.span>
          <span>1.0 — Reject everything</span>
        </div>
      </div>

      {/* Current threshold display */}
      <motion.div
        key={stopIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <span className="text-2xl font-mono font-bold" style={{ color: isInSweetSpot ? '#0E6B5C' : threshold < SWEET_SPOT.min ? '#922B21' : '#B8860B' }}>
          {threshold.toFixed(2)}
        </span>
        {isInSweetSpot && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-3 text-[11px] text-[#0E6B5C] font-semibold"
          >
            SWEET SPOT
          </motion.span>
        )}
      </motion.div>

      {/* Two test cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[700px]">
        {/* Left: Legitimate question */}
        <div className="flex flex-col gap-2">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-[10px] text-white/40 mb-1">Test Question (answer IS in documents)</p>
            <p className="text-[12px] text-[#B8860B] font-mono">&ldquo;{LEFT_CASE.question}&rdquo;</p>
            <p className="text-[10px] text-white/30 mt-1">Top similarity: <span className="text-white/60 font-mono">{(LEFT_CASE.topSimilarity * 100).toFixed(0)}%</span></p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${stopIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="border-2 rounded-lg p-3 min-h-[100px]"
              style={{
                borderColor: leftCorrect ? '#0E6B5C' : '#922B21',
                backgroundColor: leftCorrect ? 'rgba(14,107,92,0.06)' : 'rgba(146,43,33,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{leftCorrect ? '\u2705' : '\u274C'}</span>
                <span className="text-[10px] font-bold" style={{ color: leftCorrect ? '#0E6B5C' : '#922B21' }}>
                  {leftCorrect ? 'ANSWERS CORRECTLY' : `REFUSES (${(LEFT_CASE.topSimilarity * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}% threshold)`}
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-mono leading-relaxed">
                {leftResult.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Nonsense question */}
        <div className="flex flex-col gap-2">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-[10px] text-white/40 mb-1">Test Question (answer NOT in documents)</p>
            <p className="text-[12px] text-[#B8860B] font-mono">&ldquo;{RIGHT_CASE.question}&rdquo;</p>
            <p className="text-[10px] text-white/30 mt-1">Top similarity: <span className="text-white/60 font-mono">{(RIGHT_CASE.topSimilarity * 100).toFixed(0)}%</span></p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${stopIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="border-2 rounded-lg p-3 min-h-[100px]"
              style={{
                borderColor: rightCorrect ? '#0E6B5C' : '#922B21',
                backgroundColor: rightCorrect ? 'rgba(14,107,92,0.06)' : 'rgba(146,43,33,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{rightCorrect ? '\u2705' : '\u274C'}</span>
                <span className="text-[10px] font-bold" style={{ color: rightCorrect ? '#0E6B5C' : '#922B21' }}>
                  {rightCorrect
                    ? `CORRECTLY REFUSES (${(RIGHT_CASE.topSimilarity * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}% threshold)`
                    : 'ANSWERS NONSENSE'}
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-mono leading-relaxed">
                {rightResult.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="w-full max-w-[650px] text-center mt-1"
      >
        <p className="text-[12px] text-white/50 leading-relaxed">
          <span className="text-[#922B21]">Too low</span>: answers everything, including nonsense.{' '}
          <span className="text-[#B8860B]">Too high</span>: refuses everything, including legitimate questions.{' '}
          The <span className="text-[#0E6B5C] font-semibold">sweet spot</span> catches hallucinations without blocking real answers.
        </p>
      </motion.div>

      {onReplay && (
        <button
          onClick={() => { reset(); onReplay(); }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors mt-1"
        >
          Replay
        </button>
      )}
    </div>
  );
}
