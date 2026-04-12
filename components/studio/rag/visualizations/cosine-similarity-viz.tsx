'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PairData {
  a: string;
  b: string;
  score: number;
  angle: number;
  label: string;
  labelColor: string;
}

const PAIRS: PairData[] = [
  {
    a: 'Air Canada bereavement policy',
    b: 'airline grief fare discount',
    score: 87,
    angle: 15,
    label: 'Same topic, different words',
    labelColor: '#0E6B5C',
  },
  {
    a: 'Air Canada bereavement policy',
    b: 'best jollof rice recipe',
    score: 8,
    angle: 82,
    label: 'Completely unrelated',
    labelColor: '#E07A5F',
  },
  {
    a: 'Air Canada bereavement policy',
    b: 'funeral travel assistance from airline',
    score: 79,
    angle: 22,
    label: 'Meaning match, zero shared keywords',
    labelColor: '#B8860B',
  },
];

export function CosineSimilarityViz({ onReplay }: { onReplay?: () => void }) {
  const [pairIdx, setPairIdx] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setPairIdx(0);
    setAnimatedScore(0);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let offset = 0;

    for (let p = 0; p < PAIRS.length; p++) {
      timers.push(setTimeout(() => {
        setPairIdx(p);
        setAnimatedScore(0);
      }, offset));

      // Animate score counting up
      const targetScore = PAIRS[p].score;
      const steps = 20;
      for (let s = 1; s <= steps; s++) {
        timers.push(setTimeout(() => {
          setAnimatedScore(Math.round((targetScore * s) / steps));
        }, offset + 400 + s * 40));
      }

      offset += 4000;
    }

    timers.push(setTimeout(() => resetCycle(), offset + 500));

    return () => timers.forEach(clearTimeout);
  }, [cycle, resetCycle]);

  const pair = PAIRS[pairIdx];
  const radA = 0;
  const radB = (pair.angle * Math.PI) / 180;
  const arrowLen = 110;
  const cx = 140;
  const cy = 140;

  // Wedge arc path
  const wedgePath = useMemo(() => {
    const r = 50;
    const x1 = cx + r * Math.cos(-radA);
    const y1 = cy - r * Math.sin(radA);
    const x2 = cx + r * Math.cos(-radB);
    const y2 = cy + r * Math.sin(radB);
    // For arcs less than 180 degrees
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }, [pair.angle, cx, cy, radA, radB]);

  // Arrow endpoints
  const ax = cx + arrowLen * Math.cos(-radA);
  const ay = cy - arrowLen * Math.sin(radA);
  const bx = cx + arrowLen * Math.cos(-radB);
  const by = cy + arrowLen * Math.sin(radB);

  // Arrowhead angle helper
  const arrowHead = (ex: number, ey: number, angle: number) => {
    const headLen = 10;
    const a1 = angle + Math.PI + 0.4;
    const a2 = angle + Math.PI - 0.4;
    return `M ${ex + headLen * Math.cos(a1)} ${ey - headLen * Math.sin(a1)} L ${ex} ${ey} L ${ex + headLen * Math.cos(a2)} ${ey - headLen * Math.sin(a2)}`;
  };

  return (
    <div className="w-full min-h-[380px] flex flex-col items-center gap-4 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <div className="flex items-center justify-between w-full max-w-2xl">
        <p className="text-sm font-semibold text-white tracking-wide">Cosine Similarity — The Angle Between Meanings</p>
        {onReplay && (
          <button onClick={() => resetCycle()} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Replay
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl">
        {/* SVG Diagram */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 280 180" className="w-[280px] h-[180px]">
            {/* Origin point */}
            <circle cx={cx} cy={cy} r={4} fill="white" opacity={0.6} />

            {/* Gold wedge */}
            <motion.path
              d={wedgePath}
              fill="#B8860B"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 0.5 }}
            />

            {/* Vector A - always horizontal */}
            <motion.line
              x1={cx}
              y1={cy}
              x2={ax}
              y2={ay}
              stroke="#B8860B"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <motion.path
              d={arrowHead(ax, ay, -radA)}
              stroke="#B8860B"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />

            {/* Vector B - animated angle */}
            <motion.line
              x1={cx}
              y1={cy}
              animate={{ x2: bx, y2: by }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              stroke="#0E6B5C"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <motion.path
              animate={{ d: arrowHead(bx, by, -radB) }}
              transition={{ duration: 0.8 }}
              stroke="#0E6B5C"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />

            {/* Angle label */}
            <motion.text
              x={cx + 35}
              animate={{ y: cy + (pair.angle > 40 ? 20 : 8) }}
              fill="#B8860B"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {pair.angle}°
            </motion.text>

            {/* Label A */}
            <text
              x={ax + 4}
              y={ay - 6}
              fill="#B8860B"
              fontSize={8}
              fontFamily="monospace"
            >
              A
            </text>

            {/* Label B */}
            <motion.text
              animate={{ x: bx + 4, y: by - 6 }}
              transition={{ duration: 0.8 }}
              fill="#0E6B5C"
              fontSize={8}
              fontFamily="monospace"
            >
              B
            </motion.text>
          </svg>
        </div>

        {/* Score and labels */}
        <div className="flex flex-col items-center md:items-start gap-3 flex-1 min-w-0">
          {/* Score */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pairIdx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center md:text-left"
            >
              <div className="flex items-baseline gap-1">
                <span
                  className="text-5xl font-mono font-bold tabular-nums"
                  style={{ color: pair.score > 50 ? '#0E6B5C' : pair.score > 20 ? '#B8860B' : '#E07A5F' }}
                >
                  {animatedScore}
                </span>
                <span className="text-xl text-white/40 font-mono">%</span>
              </div>
              <p className="text-xs font-semibold mt-1" style={{ color: pair.labelColor }}>
                {pair.label}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Phrase pair */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`pair-${pairIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-1.5 w-full"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: '#B8860B22', color: '#B8860B' }}>A</span>
                <p className="text-xs text-white font-mono leading-relaxed">&quot;{pair.a}&quot;</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: '#0E6B5C22', color: '#0E6B5C' }}>B</span>
                <p className="text-xs text-white font-mono leading-relaxed">&quot;{pair.b}&quot;</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2 mt-1">
        {PAIRS.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === pairIdx ? '#B8860B' : '#ffffff22',
              transform: i === pairIdx ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <p className="text-[10px] text-white/40">
        Cosine similarity measures the angle between two vectors — small angle means similar meaning
      </p>
    </div>
  );
}
