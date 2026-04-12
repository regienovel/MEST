'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GOLD = '#B8860B';
const TEAL = '#0E6B5C';
const RED = '#922B21';
const BG = '#0F2F44';

interface TestQuery {
  query: string;
  expectedBehavior: string;
  shouldAnswer: boolean;
}

const TEST_QUERIES: TestQuery[] = [
  { query: 'What is the bereavement policy?', expectedBehavior: 'Should answer', shouldAnswer: true },
  { query: 'Can I get a retroactive discount?', expectedBehavior: 'Should answer with refusal', shouldAnswer: true },
  { query: 'What documents do I need?', expectedBehavior: 'Should answer', shouldAnswer: true },
  { query: 'Policy on emotional support animals?', expectedBehavior: 'Should refuse', shouldAnswer: false },
  { query: 'How do I book a flight to Mars?', expectedBehavior: 'Should refuse', shouldAnswer: false },
];

interface EvalResult {
  chunks: { text: string; relevant: boolean }[];
  relevantRank: number | null; // 1-based, null = not found
  passed: boolean;
}

const EVAL_RESULTS: EvalResult[] = [
  {
    chunks: [
      { text: 'Bereavement fares must be requested at time of booking...', relevant: true },
      { text: 'Air Canada does not offer retroactive discounts...', relevant: false },
      { text: 'Travel agents may submit requests on behalf...', relevant: false },
    ],
    relevantRank: 1,
    passed: true,
  },
  {
    chunks: [
      { text: 'Refund requests follow standard procedures...', relevant: false },
      { text: 'Air Canada does not offer retroactive bereavement discounts...', relevant: true },
      { text: 'Discount percentages vary by route and fare class...', relevant: false },
    ],
    relevantRank: 2,
    passed: true,
  },
  {
    chunks: [
      { text: 'Documentation such as a death certificate may be required...', relevant: true },
      { text: 'Eligible relationships include spouse, parent, child...', relevant: false },
      { text: 'Bereavement fares are available on AC-operated flights...', relevant: false },
    ],
    relevantRank: 1,
    passed: true,
  },
  {
    chunks: [
      { text: 'Bereavement policies differ from compassionate travel...', relevant: false },
      { text: 'Travel agents may submit bereavement requests...', relevant: false },
      { text: 'Refund requests for bereavement circumstances...', relevant: false },
    ],
    relevantRank: null,
    passed: true,
  },
  {
    chunks: [
      { text: 'Air Canada reserves the right to verify documentation...', relevant: false },
      { text: 'Bereavement fares are available on AC-operated flights...', relevant: false },
      { text: 'Discount percentages vary by route and fare class...', relevant: false },
    ],
    relevantRank: null,
    passed: true,
  },
];

interface Metric {
  label: string;
  value: string;
  percent: number;
  color: string;
  explanation: string;
}

const METRICS: Metric[] = [
  { label: 'Precision@5', value: '72%', percent: 72, color: GOLD, explanation: 'Of retrieved chunks, how many were relevant' },
  { label: 'Recall@5', value: '85%', percent: 85, color: TEAL, explanation: 'Of all relevant chunks, how many were retrieved' },
  { label: 'MRR', value: '0.67', percent: 67, color: GOLD, explanation: 'Average reciprocal rank of first relevant result' },
  { label: 'NDCG', value: '0.74', percent: 74, color: GOLD, explanation: 'Quality of ranking order for relevant results' },
  { label: 'Refusal Accuracy', value: '100%', percent: 100, color: TEAL, explanation: 'Correctly refused when no relevant chunk exists' },
];

const TOTAL_CYCLE = 22000;

function MiniGauge({ percent, color, animate }: { percent: number; color: string; animate: boolean }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
      <motion.circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: animate ? offset : circumference }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

export function RetrievalEvaluationViz({ onReplay }: { onReplay?: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  const restart = useCallback(() => {
    setElapsed(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;
        if (next >= TOTAL_CYCLE) {
          return 0; // auto-loop
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Phase timing
  const phase1End = 4000;
  const phase2End = 12000;
  const phase3End = 18000;

  // Phase 1: queries appear one by one (0-4s), 800ms apart
  const visibleQueries = Math.min(5, Math.floor(elapsed / 800) + (elapsed > 0 ? 1 : 0));

  // Phase 2: evaluation runs (4-12s), 1600ms per query
  const evalProgress = elapsed >= phase1End ? Math.min(5, Math.floor((elapsed - phase1End) / 1600) + 1) : 0;
  const currentEvalIdx = elapsed >= phase1End && elapsed < phase2End
    ? Math.min(4, Math.floor((elapsed - phase1End) / 1600))
    : -1;
  const evalWithinQuery = elapsed >= phase1End ? ((elapsed - phase1End) % 1600) : 0;

  // Phase 3: metrics (12-18s)
  const metricsVisible = elapsed >= phase2End
    ? Math.min(5, Math.floor((elapsed - phase2End) / 600) + 1)
    : 0;

  // Phase 4: caption (18-22s)
  const showCaption = elapsed >= phase3End;

  // Phase label
  let phaseLabel = '';
  if (elapsed < phase1End) phaseLabel = 'Building a test suite';
  else if (elapsed < phase2End) phaseLabel = 'Running evaluation';
  else if (elapsed < phase3End) phaseLabel = 'Computing metrics';
  else phaseLabel = 'Insight';

  return (
    <div
      className="w-full min-h-[480px] flex flex-col items-center gap-3 p-6 select-none overflow-hidden"
      style={{ backgroundColor: BG }}
    >
      {/* Title */}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
        Retrieval Evaluation — Does the system actually work?
      </p>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phaseLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-sm font-mono px-4 py-1 rounded-full border border-white/10 text-white/60"
        >
          {phaseLabel}
        </motion.div>
      </AnimatePresence>

      {/* Phase 1 & 2: Test queries */}
      {elapsed < phase2End && (
        <div className="w-full max-w-[600px] space-y-2 mt-2">
          {TEST_QUERIES.map((tq, i) => {
            if (i >= visibleQueries) return null;
            const evaluated = i < evalProgress;
            const isRunning = i === currentEvalIdx && elapsed >= phase1End;
            const result = EVAL_RESULTS[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-lg border border-white/10 overflow-hidden"
                style={{
                  backgroundColor: evaluated
                    ? result.passed
                      ? 'rgba(14,107,92,0.15)'
                      : 'rgba(146,43,33,0.15)'
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate font-mono">
                      Q{i + 1}: &ldquo;{tq.query}&rdquo;
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Expected: {tq.expectedBehavior} {tq.shouldAnswer ? '✓' : '✗'}
                    </p>
                  </div>
                  {evaluated && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lg ml-2"
                      style={{ color: result.passed ? TEAL : RED }}
                    >
                      {result.passed ? '✓' : '✗'}
                    </motion.span>
                  )}
                  {isRunning && !evaluated && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full ml-2"
                    />
                  )}
                </div>

                {/* Mini ranked chunks during evaluation */}
                {isRunning && evalWithinQuery > 400 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-3 pb-2 space-y-1"
                  >
                    {result.chunks.map((chunk, ci) => {
                      const showChunk = evalWithinQuery > 400 + ci * 300;
                      if (!showChunk) return null;
                      return (
                        <motion.div
                          key={ci}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="font-mono w-5 text-center shrink-0"
                            style={{ color: chunk.relevant ? GOLD : 'rgba(255,255,255,0.3)' }}
                          >
                            #{ci + 1}
                          </span>
                          <span
                            className="truncate"
                            style={{
                              color: chunk.relevant ? GOLD : 'rgba(255,255,255,0.4)',
                              fontWeight: chunk.relevant ? 600 : 400,
                            }}
                          >
                            {chunk.text}
                          </span>
                          {chunk.relevant && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: `${GOLD}30`, color: GOLD }}>
                              relevant
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                    {evalWithinQuery > 1200 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-mono text-white/40 pt-1"
                      >
                        {result.relevantRank
                          ? `Relevant chunk ranked #${result.relevantRank}`
                          : 'No relevant chunk found — correct refusal'}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Phase 3: Metrics */}
      {elapsed >= phase2End && elapsed < phase3End && (
        <div className="w-full max-w-[640px] grid grid-cols-5 gap-3 mt-4">
          {METRICS.map((m, i) => {
            if (i >= metricsVisible) return null;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <MiniGauge percent={m.percent} color={m.color} animate={true} />
                <span className="text-lg font-bold font-mono text-white">{m.value}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">{m.label}</span>
                <span className="text-[9px] text-white/30 text-center leading-tight">{m.explanation}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Phase 4: Caption */}
      {showCaption && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-[540px] text-center mt-6"
        >
          <p className="text-sm text-white/70 leading-relaxed italic">
            &ldquo;One good answer doesn&rsquo;t mean the system works. Evaluation runs many queries and measures the pattern.&rdquo;
          </p>
        </motion.div>
      )}

      {/* Replay button */}
      <motion.button
        onClick={() => { restart(); onReplay?.(); }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-auto text-xs font-mono text-white/30 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 rounded-full px-4 py-1.5"
      >
        ↻ Replay
      </motion.button>
    </div>
  );
}
