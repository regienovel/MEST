'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION = "What is Air Canada's bereavement fare policy?";

const UNGROUNDED_TEXT =
  'Air Canada offers a 50% discount on bereavement fares, applied retroactively within 90 days of travel. Simply book your flight at regular price, then submit a refund request with a copy of the death certificate through the Air Canada website or by calling customer service.';

const GROUNDED_CONTEXT =
  'Bereavement fares must be requested AT THE TIME OF BOOKING by calling 1-888-247-2262. Retroactive requests are not accepted. Discounted bereavement fares are available only for travel within Canada and between Canada and the United States.';

const GROUNDED_TEXT =
  'According to the bereavement policy [1], fares must be requested at the time of booking by calling 1-888-247-2262. Retroactive discounts are not offered [2]. Bereavement fares apply only to domestic Canada and Canada-US routes.';

const TOTAL_CYCLE = 18000; // full loop ms

export function GroundingViz({ onReplay, isPaused }: { onReplay?: () => void; isPaused?: boolean }) {
  const [phase, setPhase] = useState<'streaming' | 'reveal' | 'hold'>('streaming');
  const [charIndex, setCharIndex] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [groundedCharIndex, setGroundedCharIndex] = useState(0);

  const maxUngrounded = UNGROUNDED_TEXT.length;
  const maxGrounded = GROUNDED_TEXT.length;

  const reset = useCallback(() => {
    setPhase('streaming');
    setCharIndex(0);
    setShowContext(false);
    setGroundedCharIndex(0);
  }, []);

  // Phase management
  useEffect(() => {
    if (isPaused) return;
    if (phase === 'streaming') {
      // Start context reveal after 800ms
      const ctxTimer = setTimeout(() => setShowContext(true), 800);
      return () => clearTimeout(ctxTimer);
    }
    if (phase === 'hold') {
      const holdTimer = setTimeout(reset, 5000);
      return () => clearTimeout(holdTimer);
    }
  }, [phase, reset, isPaused]);

  // Ungrounded streaming
  useEffect(() => {
    if (isPaused) return;
    if (phase !== 'streaming') return;
    if (charIndex >= maxUngrounded) return;
    const timer = setTimeout(() => setCharIndex((p) => p + 1), 28);
    return () => clearTimeout(timer);
  }, [phase, charIndex, maxUngrounded, isPaused]);

  // Grounded streaming (starts after context appears + delay)
  useEffect(() => {
    if (isPaused) return;
    if (phase !== 'streaming') return;
    if (!showContext) return;
    const delay = setTimeout(() => {
      if (groundedCharIndex >= maxGrounded) return;
      setGroundedCharIndex((p) => p + 1);
    }, 35);
    return () => clearTimeout(delay);
  }, [phase, showContext, groundedCharIndex, maxGrounded, isPaused]);

  // Transition to reveal phase
  useEffect(() => {
    if (isPaused) return;
    if (phase !== 'streaming') return;
    if (charIndex >= maxUngrounded && groundedCharIndex >= maxGrounded) {
      const timer = setTimeout(() => setPhase('reveal'), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, charIndex, groundedCharIndex, maxUngrounded, maxGrounded, isPaused]);

  // Transition from reveal to hold
  useEffect(() => {
    if (isPaused) return;
    if (phase !== 'reveal') return;
    const timer = setTimeout(() => setPhase('hold'), 4000);
    return () => clearTimeout(timer);
  }, [phase, isPaused]);

  const Cursor = () => (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ repeat: Infinity, duration: 0.5 }}
      className="text-white/60"
    >
      |
    </motion.span>
  );

  return (
    <div className="w-full flex flex-col items-center gap-4 p-5" style={{ backgroundColor: '#0F2F44' }}>
      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[780px] text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">
          Same question enters both systems
        </p>
        <div className="inline-block bg-white/5 border border-white/10 rounded-lg px-5 py-2.5">
          <p className="text-sm text-[#B8860B] font-mono font-medium">
            &ldquo;{QUESTION}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Two panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[780px]">
        {/* LEFT: Ungrounded */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 rounded-xl p-4 flex flex-col gap-3"
          style={{ borderColor: '#922B21', backgroundColor: 'rgba(146, 43, 33, 0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color: '#922B21' }}>
              Ungrounded
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#922B21]/20 text-[#922B21]">
              No documents
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[10px]">AI</span>
            </div>
            <span className="text-[10px] text-white/40">Generating from training data...</span>
          </div>

          <div className="bg-black/20 rounded-lg p-3 min-h-[120px]">
            <p className="text-[12px] text-white/80 font-mono leading-[1.7]">
              {UNGROUNDED_TEXT.slice(0, charIndex)}
              {phase === 'streaming' && charIndex < maxUngrounded && <Cursor />}
            </p>
          </div>

          <AnimatePresence>
            {(phase === 'reveal' || phase === 'hold') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#922B21]/15 rounded-lg">
                  <span className="text-base">&#9888;</span>
                  <span className="text-[11px] font-bold" style={{ color: '#922B21' }}>
                    NO SOURCE DOCUMENTS
                  </span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed px-1">
                  This is what happened to Jake Moffatt. <span className="text-[#922B21] font-semibold">Every detail was fabricated.</span> The 50% figure, the 90-day window, the retroactive process — none of it exists in Air Canada&apos;s actual policy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT: Grounded */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="border-2 rounded-xl p-4 flex flex-col gap-3"
          style={{ borderColor: '#0E6B5C', backgroundColor: 'rgba(14, 107, 92, 0.06)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color: '#0E6B5C' }}>
              Grounded (RAG)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0E6B5C]/20 text-[#0E6B5C]">
              Documents loaded
            </span>
          </div>

          {/* Context retrieval animation */}
          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-[#0E6B5C]/10 border border-[#0E6B5C]/30 rounded-lg p-2.5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">&#128196;</span>
                  <span className="text-[10px] text-[#0E6B5C] font-semibold uppercase tracking-wide">
                    Retrieved: bereavement-policy.pdf
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-mono leading-relaxed italic">
                  &ldquo;{GROUNDED_CONTEXT}&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-[#0E6B5C]/20 flex items-center justify-center">
              <span className="text-[10px]">AI</span>
            </div>
            <span className="text-[10px] text-white/40">Generating from retrieved documents...</span>
          </div>

          <div className="bg-black/20 rounded-lg p-3 min-h-[120px]">
            <p className="text-[12px] text-white/80 font-mono leading-[1.7]">
              {GROUNDED_TEXT.slice(0, groundedCharIndex)}
              {phase === 'streaming' && showContext && groundedCharIndex < maxGrounded && <Cursor />}
            </p>
          </div>

          <AnimatePresence>
            {(phase === 'reveal' || phase === 'hold') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0E6B5C]/15 rounded-lg">
                  <span className="text-base">&#10003;</span>
                  <span className="text-[11px] font-bold" style={{ color: '#0E6B5C' }}>
                    SOURCED &amp; VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed px-1">
                  Every claim cites a document. The answer is accurate, verifiable, and <span className="text-[#0E6B5C] font-semibold">matches the actual policy.</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom caption */}
      <AnimatePresence>
        {(phase === 'reveal' || phase === 'hold') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-[700px] text-center mt-2"
          >
            <p className="text-[13px] text-white/70 leading-relaxed font-medium">
              Same model. Same question. The <span className="text-[#B8860B] font-bold">ONLY</span> difference
              is whether documents sit between the question and the answer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
