'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CLUSTERS = [
  { label: 'Finance', color: '#B8860B', dots: [{ x: 20, y: 25 }, { x: 28, y: 30 }, { x: 22, y: 35 }, { x: 30, y: 22 }] },
  { label: 'Health', color: '#0E6B5C', dots: [{ x: 65, y: 60 }, { x: 72, y: 65 }, { x: 68, y: 70 }, { x: 75, y: 58 }] },
  { label: 'Agri', color: '#6B8BB8', dots: [{ x: 50, y: 15 }, { x: 55, y: 20 }, { x: 48, y: 22 }, { x: 57, y: 12 }] },
];

const QUERIES = [
  { text: 'How do I get a loan?', target: 0 },
  { text: 'Symptoms of malaria', target: 1 },
  { text: 'Best cocoa harvest season', target: 2 },
];

export function VectorSpaceViz({ onReplay }: { onReplay?: () => void }) {
  const [queryIdx, setQueryIdx] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setArrived(false);
      setQueryIdx((p) => (p + 1) % QUERIES.length);
      setTimeout(() => setArrived(true), 1200);
    }, 3500);
    setArrived(true);
    return () => clearInterval(interval);
  }, []);

  const query = QUERIES[queryIdx];
  const targetCluster = CLUSTERS[query.target];
  const targetPos = targetCluster.dots[0];

  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-3 p-4">
      <p className="text-xs text-white/50">Vector Space — Query finds its cluster</p>
      <div className="relative w-[280px] h-[160px] border border-white/10 rounded-lg">
        {CLUSTERS.map((cluster, ci) => (
          <g key={ci}>
            {cluster.dots.map((dot, di) => (
              <div
                key={`${ci}-${di}`}
                className="absolute w-2.5 h-2.5 rounded-full opacity-50"
                style={{ left: `${dot.x}%`, top: `${dot.y}%`, backgroundColor: cluster.color }}
              />
            ))}
            <span
              className="absolute text-[9px] opacity-40"
              style={{ left: `${cluster.dots[0].x}%`, top: `${cluster.dots[0].y + 12}%`, color: cluster.color }}
            >
              {cluster.label}
            </span>
          </g>
        ))}
        <motion.div
          className="absolute w-4 h-4 rounded-full border-2 z-10"
          style={{ borderColor: targetCluster.color }}
          initial={{ left: '50%', top: '85%' }}
          animate={{
            left: arrived ? `${targetPos.x}%` : '50%',
            top: arrived ? `${targetPos.y}%` : '85%',
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full m-auto mt-0.5" style={{ backgroundColor: targetCluster.color }} />
        </motion.div>
      </div>
      <motion.p key={queryIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/70 font-mono">
        Q: &quot;{query.text}&quot; → <span style={{ color: targetCluster.color }}>{targetCluster.label}</span>
      </motion.p>
      {onReplay && (
        <button onClick={onReplay} className="text-xs text-white/40 hover:text-white/70">Replay</button>
      )}
    </div>
  );
}
