'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const POLICY_TEXT = `Air Canada's bereavement policy states that passengers who need to travel due to the imminent death or death of a close family member may be eligible for reduced bereavement fares. These fares can be booked by contacting Air Canada's reservation center. However, discounts cannot be applied retroactively to tickets already purchased at full fare. Documentation such as a death certificate may be required.`;

const PARAGRAPH_CHUNKS = [
  { label: 'Eligibility criteria', text: "Air Canada's bereavement policy states that passengers who need to travel..." },
  { label: 'Family member definition', text: '...death of a close family member may be eligible for reduced...' },
  { label: 'Booking process', text: '...fares can be booked by contacting Air Canada\'s reservation center...' },
  { label: 'Retroactive clause', text: '...discounts cannot be applied retroactively to tickets already purchased...', critical: true },
  { label: 'Documentation', text: '...Documentation such as a death certificate may be required.' },
];

const FIXED_CHUNKS = [
  { text: "Air Canada's bereavement policy states that passengers who need to travel due to the imminent death or death of a close family member may be eligible for reduced bereave", hasOverlap: false },
  { text: '...may be eligible for reduced bereavement fares. These fares can be booked by contacting Air Canada\'s reservation center. However, discounts cannot be applied retroactiv', hasOverlap: true, critical: true },
  { text: '...discounts cannot be applied retroactively to tickets already purchased at full fare. Documentation such as a death certific', hasOverlap: true, critical: true },
  { text: '...a death certificate may be required.', hasOverlap: true },
];

const SEMANTIC_CHUNKS = [
  { label: 'Eligibility & fares', text: "Air Canada's bereavement policy states that passengers... eligible for reduced bereavement fares." },
  { label: 'Booking & restrictions', text: "These fares can be booked by contacting... discounts cannot be applied retroactively...", critical: true },
  { label: 'Required documents', text: 'Documentation such as a death certificate may be required.' },
];

type Phase = 'source' | 'paragraph' | 'fixed' | 'semantic' | 'highlight';

export function ChunkingViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [phase, setPhase] = useState<Phase>('source');
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setPhase('source');
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('paragraph'), 2000));
    timers.push(setTimeout(() => setPhase('fixed'), 4500));
    timers.push(setTimeout(() => setPhase('semantic'), 7000));
    timers.push(setTimeout(() => setPhase('highlight'), 9500));
    timers.push(setTimeout(() => resetCycle(), 14000));
    return () => timers.forEach(clearTimeout);
  }, [cycle, resetCycle, isPaused]);

  return (
    <div className="w-full min-h-[340px] flex flex-col items-center gap-4 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <div className="flex items-center justify-between w-full max-w-2xl">
        <p className="text-sm font-semibold text-white tracking-wide">Document Chunking Strategies</p>
      </div>

      {/* Source document */}
      <motion.div
        className="w-full max-w-2xl rounded-lg p-3 border border-white/10"
        style={{ backgroundColor: '#0a2233' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Source: Air Canada Bereavement Policy</p>
        <p className="text-xs text-white/70 leading-relaxed font-mono">{POLICY_TEXT}</p>
      </motion.div>

      {/* Chunking rows */}
      <div className="w-full max-w-2xl space-y-3">
        <AnimatePresence>
          {/* Paragraph chunks */}
          {(phase === 'paragraph' || phase === 'fixed' || phase === 'semantic' || phase === 'highlight') && (
            <motion.div
              key="paragraph"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">By Paragraph</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: '#B8860B33', color: '#B8860B' }}>
                  5 chunks
                </span>
              </div>
              <div className="flex gap-1.5">
                {PARAGRAPH_CHUNKS.map((chunk, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.35 }}
                    style={{
                      originX: 0,
                      flex: [2.5, 2, 2.5, 3, 1.5][i],
                      backgroundColor: phase === 'highlight' && chunk.critical ? '#B8860B44' : '#B8860B18',
                      borderColor: phase === 'highlight' && chunk.critical ? '#B8860B' : '#B8860B44',
                    }}
                    className="rounded border p-1.5 overflow-hidden transition-colors duration-700"
                  >
                    <p className="text-[9px] text-white/50 truncate">{chunk.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Fixed-size chunks */}
          {(phase === 'fixed' || phase === 'semantic' || phase === 'highlight') && (
            <motion.div
              key="fixed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Fixed Size (500/50 overlap)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: '#0E6B5C33', color: '#0E6B5C' }}>
                  4 chunks
                </span>
              </div>
              <div className="flex gap-0">
                {FIXED_CHUNKS.map((chunk, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.35 }}
                    style={{ originX: 0, flex: 1 }}
                    className="relative overflow-hidden"
                  >
                    <div
                      className="rounded p-1.5 border transition-colors duration-700 h-full"
                      style={{
                        backgroundColor: phase === 'highlight' && chunk.critical ? '#0E6B5C44' : '#0E6B5C18',
                        borderColor: phase === 'highlight' && chunk.critical ? '#0E6B5C' : '#0E6B5C44',
                      }}
                    >
                      <p className="text-[9px] text-white/50 truncate">{chunk.text}</p>
                    </div>
                    {chunk.hasOverlap && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2"
                        style={{ background: 'linear-gradient(90deg, #0E6B5C55, transparent)' }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Semantic chunks */}
          {(phase === 'semantic' || phase === 'highlight') && (
            <motion.div
              key="semantic"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Semantic</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: '#6B8BB833', color: '#6B8BB8' }}>
                  3 chunks
                </span>
              </div>
              <div className="flex gap-1.5">
                {SEMANTIC_CHUNKS.map((chunk, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.35 }}
                    style={{
                      originX: 0,
                      flex: [3, 4, 2][i],
                      backgroundColor: phase === 'highlight' && chunk.critical ? '#6B8BB844' : '#6B8BB818',
                      borderColor: phase === 'highlight' && chunk.critical ? '#6B8BB8' : '#6B8BB844',
                    }}
                    className="rounded border p-1.5 overflow-hidden transition-colors duration-700"
                  >
                    <p className="text-[9px] text-white/90 font-semibold mb-0.5">{chunk.label}</p>
                    <p className="text-[9px] text-white/50 truncate">{chunk.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Highlight callout */}
      <AnimatePresence>
        {phase === 'highlight' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl rounded-lg p-3 border text-center"
            style={{ backgroundColor: '#B8860B15', borderColor: '#B8860B55' }}
          >
            <p className="text-xs text-white font-medium">
              The critical clause{' '}
              <span className="font-mono" style={{ color: '#B8860B' }}>
                &quot;discounts cannot be applied retroactively&quot;
              </span>
            </p>
            <p className="text-[11px] text-white/60 mt-1">
              Falls in <span style={{ color: '#B8860B' }}>chunk 4</span> (paragraph),{' '}
              <span style={{ color: '#0E6B5C' }}>chunks 2-3</span> (fixed, split across overlap), and{' '}
              <span style={{ color: '#6B8BB8' }}>chunk 2</span> (semantic). Chunking strategy changes what the AI can find.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
