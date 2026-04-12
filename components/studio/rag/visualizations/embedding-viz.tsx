'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FLOAT_VALUES = [-0.012, 0.087, -0.234, 0.156, 0.043, -0.091, 0.178, -0.055, 0.312, -0.198, 0.067, 0.241];

interface PhraseData {
  text: string;
  x: number;
  y: number;
  color: string;
  distance: string;
}

const PHRASES: PhraseData[] = [
  { text: 'Senior Frontend Developer at Monzo Bank', x: 35, y: 30, color: '#B8860B', distance: '' },
  { text: 'Software Engineer at Google', x: 40, y: 25, color: '#0E6B5C', distance: 'CLOSE' },
  { text: 'Junior UI Designer at Spotify', x: 55, y: 50, color: '#6B8BB8', distance: 'MEDIUM' },
  { text: 'Plantain seller at Makola Market', x: 80, y: 78, color: '#E07A5F', distance: 'FAR' },
  { text: 'Frontend Developer at Deliveroo', x: 33, y: 33, color: '#81B29A', distance: 'VERY CLOSE' },
];

type Phase = 'phrase' | 'numbers' | 'condense' | 'dots';

export function EmbeddingViz({ onReplay }: { onReplay?: () => void }) {
  const [phase, setPhase] = useState<Phase>('phrase');
  const [currentDot, setCurrentDot] = useState(0);
  const [visibleDots, setVisibleDots] = useState<number[]>([]);
  const [showLabel, setShowLabel] = useState(false);
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setPhase('phrase');
    setCurrentDot(0);
    setVisibleDots([]);
    setShowLabel(false);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Show first phrase
    // Phase 2: Numbers stream out after 1s
    timers.push(setTimeout(() => setPhase('numbers'), 1000));
    // Phase 3: Condense to dot after 2.5s
    timers.push(setTimeout(() => {
      setPhase('condense');
      setVisibleDots([0]);
    }, 2500));
    // Phase 4: Switch to dots view after 3.5s
    timers.push(setTimeout(() => {
      setPhase('dots');
    }, 3500));

    // Show remaining dots one by one
    for (let i = 1; i < PHRASES.length; i++) {
      timers.push(setTimeout(() => {
        setCurrentDot(i);
        setVisibleDots((prev) => [...prev, i]);
      }, 3500 + i * 1500));
    }

    // Show label
    timers.push(setTimeout(() => setShowLabel(true), 3500 + PHRASES.length * 1500 + 500));

    // Loop
    timers.push(setTimeout(() => resetCycle(), 3500 + PHRASES.length * 1500 + 4000));

    return () => timers.forEach(clearTimeout);
  }, [cycle, resetCycle]);

  const distanceColor = (d: string) => {
    if (d === 'VERY CLOSE' || d === 'CLOSE') return '#0E6B5C';
    if (d === 'MEDIUM') return '#B8860B';
    return '#E07A5F';
  };

  return (
    <div className="w-full min-h-[340px] flex flex-col items-center gap-4 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <div className="flex items-center justify-between w-full max-w-2xl">
        <p className="text-sm font-semibold text-white tracking-wide">Text to Embedding to Vector Space</p>
        {onReplay && (
          <button onClick={() => resetCycle()} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Replay
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center gap-4 min-h-[260px] justify-center">
        <AnimatePresence mode="wait">
          {/* Phase: Show phrase */}
          {phase === 'phrase' && (
            <motion.div
              key="phrase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-lg font-mono text-white font-medium">&quot;{PHRASES[0].text}&quot;</p>
              <p className="text-[10px] text-white/40 mt-2">Embedding this text into vector space...</p>
            </motion.div>
          )}

          {/* Phase: Numbers stream */}
          {phase === 'numbers' && (
            <motion.div
              key="numbers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-sm font-mono text-white/60">&quot;{PHRASES[0].text}&quot;</p>
              <motion.div className="flex flex-wrap justify-center gap-1.5 max-w-md">
                {FLOAT_VALUES.map((n, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 15, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ color: '#B8860B', backgroundColor: '#B8860B15' }}
                  >
                    {n.toFixed(3)}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-xs font-mono text-white/30 self-center"
                >
                  ... x1536 dimensions
                </motion.span>
              </motion.div>
            </motion.div>
          )}

          {/* Phase: Condense to dot */}
          {phase === 'condense' && (
            <motion.div
              key="condense"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-xs text-white/50">Numbers condense into a single point in vector space</p>
              <motion.div
                initial={{ width: 200, height: 30, borderRadius: 8 }}
                animate={{ width: 16, height: 16, borderRadius: 100 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                style={{ backgroundColor: '#B8860B', boxShadow: '0 0 20px #B8860B88' }}
              />
            </motion.div>
          )}

          {/* Phase: Dots in space */}
          {phase === 'dots' && (
            <motion.div
              key="dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full space-y-3"
            >
              {/* Vector space */}
              <div
                className="relative w-full h-[180px] rounded-xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: '#091e2e' }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {visibleDots.map((dotIdx) => {
                  const phrase = PHRASES[dotIdx];
                  return (
                    <motion.div
                      key={dotIdx}
                      initial={dotIdx === 0 ? { left: '50%', top: '50%', scale: 0 } : { left: '10%', top: '90%', scale: 0 }}
                      animate={{ left: `${phrase.x}%`, top: `${phrase.y}%`, scale: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute flex flex-col items-center"
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{
                          backgroundColor: phrase.color,
                          boxShadow: `0 0 12px ${phrase.color}66`,
                        }}
                        animate={dotIdx === currentDot ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.6, repeat: dotIdx === currentDot ? 2 : 0 }}
                      />
                      {dotIdx === currentDot && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-5 whitespace-nowrap"
                        >
                          {phrase.distance && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: distanceColor(phrase.distance) + '33', color: distanceColor(phrase.distance) }}
                            >
                              {phrase.distance}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Current phrase label */}
              <div className="flex flex-col items-center gap-1">
                <AnimatePresence mode="wait">
                  {currentDot < PHRASES.length && (
                    <motion.div
                      key={currentDot}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHRASES[currentDot].color }} />
                      <p className="text-xs font-mono text-white">&quot;{PHRASES[currentDot].text}&quot;</p>
                      {PHRASES[currentDot].distance && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ color: distanceColor(PHRASES[currentDot].distance), backgroundColor: distanceColor(PHRASES[currentDot].distance) + '22' }}>
                          {PHRASES[currentDot].distance}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              <AnimatePresence>
                {showLabel && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-white/60 mt-1"
                    style={{ color: '#B8860B' }}
                  >
                    Similar meaning = nearby in space. Different meaning = far apart.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
