'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Dot {
  x: number;
  y: number;
  id: number;
}

interface Cluster {
  label: string;
  color: string;
  labelX: number;
  labelY: number;
  dots: Dot[];
}

const CLUSTERS: Cluster[] = [
  {
    label: 'Bereavement policies',
    color: '#B8860B',
    labelX: 12,
    labelY: 10,
    dots: [
      { x: 15, y: 18, id: 0 }, { x: 22, y: 22, id: 1 }, { x: 18, y: 28, id: 2 },
      { x: 25, y: 15, id: 3 }, { x: 12, y: 25, id: 4 }, { x: 20, y: 32, id: 5 },
      { x: 28, y: 20, id: 6 }, { x: 16, y: 14, id: 7 }, { x: 24, y: 30, id: 8 },
      { x: 10, y: 20, id: 9 },
    ],
  },
  {
    label: 'Booking procedures',
    color: '#0E6B5C',
    labelX: 42,
    labelY: 42,
    dots: [
      { x: 48, y: 48, id: 10 }, { x: 52, y: 52, id: 11 }, { x: 55, y: 46, id: 12 },
      { x: 45, y: 55, id: 13 }, { x: 50, y: 42, id: 14 }, { x: 53, y: 58, id: 15 },
      { x: 47, y: 44, id: 16 }, { x: 56, y: 50, id: 17 }, { x: 44, y: 50, id: 18 },
      { x: 51, y: 56, id: 19 },
    ],
  },
  {
    label: 'Refund FAQs',
    color: '#6B8BB8',
    labelX: 72,
    labelY: 72,
    dots: [
      { x: 75, y: 75, id: 20 }, { x: 80, y: 78, id: 21 }, { x: 78, y: 82, id: 22 },
      { x: 82, y: 72, id: 23 }, { x: 72, y: 80, id: 24 }, { x: 85, y: 76, id: 25 },
      { x: 76, y: 70, id: 26 }, { x: 83, y: 84, id: 27 }, { x: 70, y: 76, id: 28 },
      { x: 79, y: 68, id: 29 },
    ],
  },
];

interface Query {
  text: string;
  targetCluster: number;
  nearestDots: number[];
}

const QUERIES: Query[] = [
  { text: 'What are the bereavement fare rules?', targetCluster: 0, nearestDots: [0, 1, 2] },
  { text: 'How do I get a refund?', targetCluster: 2, nearestDots: [20, 21, 22] },
  { text: 'Can I book online?', targetCluster: 1, nearestDots: [10, 11, 12] },
];

const allDots = CLUSTERS.flatMap((c) => c.dots);
function getDot(id: number) {
  return allDots.find((d) => d.id === id)!;
}

export function VectorSpaceViz({ onReplay }: { onReplay?: () => void }) {
  const [queryIdx, setQueryIdx] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'connect' | 'hold'>('enter');
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setCycle((c) => c + 1);
    setQueryIdx(0);
    setPhase('enter');
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let offset = 0;

    for (let q = 0; q < QUERIES.length; q++) {
      // Enter phase
      timers.push(setTimeout(() => {
        setQueryIdx(q);
        setPhase('enter');
      }, offset));
      // Connect phase after 1.2s
      timers.push(setTimeout(() => {
        setPhase('connect');
      }, offset + 1200));
      // Hold for viewing
      timers.push(setTimeout(() => {
        setPhase('hold');
      }, offset + 2000));
      offset += 4500;
    }

    // Loop
    timers.push(setTimeout(() => resetCycle(), offset + 500));

    return () => timers.forEach(clearTimeout);
  }, [cycle, resetCycle]);

  const query = QUERIES[queryIdx];
  const targetCluster = CLUSTERS[query.targetCluster];
  const targetCenter = {
    x: targetCluster.dots.reduce((s, d) => s + d.x, 0) / targetCluster.dots.length,
    y: targetCluster.dots.reduce((s, d) => s + d.y, 0) / targetCluster.dots.length,
  };

  return (
    <div className="w-full min-h-[380px] flex flex-col items-center gap-4 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <div className="flex items-center justify-between w-full max-w-2xl">
        <p className="text-sm font-semibold text-white tracking-wide">Vector Space — Nearest Neighbor Search</p>
        {onReplay && (
          <button onClick={() => resetCycle()} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Replay
          </button>
        )}
      </div>

      {/* Vector space canvas */}
      <div
        className="relative w-full max-w-2xl h-[260px] rounded-xl border border-white/10 overflow-hidden"
        style={{ backgroundColor: '#091e2e' }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Cluster labels */}
        {CLUSTERS.map((cluster, ci) => (
          <motion.div
            key={`label-${ci}`}
            className="absolute text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              left: `${cluster.labelX}%`,
              top: `${cluster.labelY}%`,
              color: cluster.color,
              backgroundColor: cluster.color + '18',
              border: `1px solid ${cluster.color}33`,
            }}
          >
            {cluster.label}
          </motion.div>
        ))}

        {/* Cluster dots */}
        {CLUSTERS.map((cluster) =>
          cluster.dots.map((dot) => {
            const isNearest = phase !== 'enter' && query.nearestDots.includes(dot.id);
            return (
              <motion.div
                key={`dot-${dot.id}`}
                className="absolute rounded-full"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: isNearest ? 10 : 7,
                  height: isNearest ? 10 : 7,
                  backgroundColor: cluster.color,
                  opacity: isNearest ? 1 : 0.35,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: isNearest ? `0 0 10px ${cluster.color}` : 'none',
                }}
                animate={{
                  scale: isNearest ? [1, 1.4, 1] : 1,
                }}
                transition={{ duration: 0.6, repeat: isNearest ? 1 : 0 }}
              />
            );
          })
        )}

        {/* Connection lines (SVG overlay) */}
        {(phase === 'connect' || phase === 'hold') && (
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {query.nearestDots.map((dotId, li) => {
              const dot = getDot(dotId);
              return (
                <motion.line
                  key={`line-${dotId}`}
                  x1={`${targetCenter.x}%`}
                  y1={`${targetCenter.y}%`}
                  x2={`${dot.x}%`}
                  y2={`${dot.y}%`}
                  stroke="#B8860B"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ delay: li * 0.15, duration: 0.4 }}
                />
              );
            })}
          </svg>
        )}

        {/* Query dot */}
        <motion.div
          className="absolute z-10 flex items-center justify-center"
          style={{ transform: 'translate(-50%, -50%)' }}
          initial={{ left: '50%', top: '95%' }}
          animate={{
            left: `${targetCenter.x}%`,
            top: `${targetCenter.y}%`,
          }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
        >
          <motion.div
            className="w-5 h-5 rounded-full border-2"
            style={{
              borderColor: '#B8860B',
              backgroundColor: '#B8860B',
              boxShadow: '0 0 20px #B8860B88, 0 0 40px #B8860B44',
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Query label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${queryIdx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-3 px-4 py-2 rounded-lg border"
          style={{ backgroundColor: '#0a2233', borderColor: '#ffffff15' }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#B8860B', boxShadow: '0 0 8px #B8860B66' }}
          />
          <p className="text-xs font-mono text-white">
            &quot;{query.text}&quot;
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: targetCluster.color, backgroundColor: targetCluster.color + '22' }}>
            → {targetCluster.label}
          </span>
        </motion.div>
      </AnimatePresence>

      <p className="text-[10px] text-white/40">
        Query is embedded, then the 3 nearest document chunks are retrieved
      </p>
    </div>
  );
}
