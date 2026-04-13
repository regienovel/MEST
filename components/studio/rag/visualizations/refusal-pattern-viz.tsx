'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CUSTOMER_QUESTION =
  'Can I get a 50% bereavement discount on my flight to Lagos next month?';

const PATTERNS = [
  {
    label: 'TOO BLUNT',
    color: '#922B21',
    icon: '\u274C',
    text: 'I cannot answer that. End of conversation.',
    explanation:
      "Honest but unhelpful. The customer doesn't know why they were refused or what to do next. They'll just ask again — or leave angry.",
    position: 'left' as const,
  },
  {
    label: 'HONEST & HELPFUL',
    color: '#B8860B',
    icon: '\u2713',
    text: "I'm not able to confirm a 50% discount \u2014 that specific figure isn't mentioned in our bereavement fare policy. Bereavement fares for international routes outside North America are not available. For accurate pricing, please contact Air Canada Reservations at 1-888-247-2262.",
    source: 'Source: Bereavement Policy, Routes and Restrictions section',
    explanation:
      'Refuses the specific claim. Explains why. Provides the real information. Gives a next step.',
    position: 'center' as const,
  },
  {
    label: 'DISHONEST',
    color: '#922B21',
    icon: '\u274C',
    text: 'Yes, you can receive a 50% discount on bereavement travel to any destination! Book your flight and submit a refund claim within 90 days with documentation.',
    explanation:
      'This is what the real Air Canada chatbot said. Every detail fabricated. Cost: $812 in damages, global legal precedent.',
    position: 'right' as const,
  },
];

export function RefusalPatternViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCaption, setShowCaption] = useState(false);

  const reset = useCallback(() => {
    setVisibleCount(0);
    setShowCaption(false);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (visibleCount < PATTERNS.length) {
      const timer = setTimeout(
        () => setVisibleCount((p) => p + 1),
        visibleCount === 0 ? 800 : 1500
      );
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowCaption(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, isPaused]);

  // Auto-loop
  useEffect(() => {
    if (isPaused) return;
    if (!showCaption) return;
    const timer = setTimeout(reset, 8000);
    return () => clearTimeout(timer);
  }, [showCaption, reset, isPaused]);

  return (
    <div className="w-full flex flex-col items-center gap-5 p-5" style={{ backgroundColor: '#0F2F44' }}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
        Refusal Patterns — How should AI say &ldquo;I don&apos;t know&rdquo;?
      </p>

      {/* Customer question */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[750px]"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5D8B7F]/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm">&#128100;</span>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-1">Customer asks:</p>
            <p className="text-[13px] text-white/90 font-medium leading-relaxed">
              &ldquo;{CUSTOMER_QUESTION}&rdquo;
            </p>
          </div>
        </div>
      </motion.div>

      {/* Three response cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[850px]">
        {PATTERNS.map((pattern, i) => (
          <AnimatePresence key={i}>
            {i < visibleCount && (
              <motion.div
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="border-2 rounded-xl p-4 flex flex-col gap-3"
                style={{
                  borderColor: pattern.color,
                  backgroundColor: pattern.label === 'HONEST & HELPFUL'
                    ? 'rgba(184, 134, 11, 0.06)'
                    : 'rgba(146, 43, 33, 0.06)',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                    className="text-lg"
                  >
                    {pattern.icon}
                  </motion.span>
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: pattern.color }}
                  >
                    {pattern.label}
                  </span>
                </div>

                {/* Response text */}
                <div className="bg-black/20 rounded-lg p-3 flex-1">
                  <p className="text-[11px] text-white/75 font-mono leading-[1.7]">
                    &ldquo;{pattern.text}&rdquo;
                  </p>
                  {pattern.source && (
                    <p className="text-[10px] text-[#0E6B5C] mt-2 font-mono">
                      [{pattern.source}]
                    </p>
                  )}
                </div>

                {/* Explanation */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-2"
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: pattern.color === '#B8860B' ? '#5D8B7F' : 'rgba(255,255,255,0.45)' }}>
                    {pattern.explanation}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Bottom caption */}
      <AnimatePresence>
        {showCaption && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[650px] text-center mt-2"
          >
            <p className="text-[13px] text-white/60 leading-relaxed font-medium">
              Refusing well is a craft.{' '}
              <span className="text-[#922B21]">Refusing rudely</span> fails the user.{' '}
              <span className="text-[#922B21]">Refusing dishonestly</span> fails everyone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
