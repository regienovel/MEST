'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const QUESTION = "What is Air Canada's bereavement fare policy?";

const HALLUCINATED = "Air Canada offers bereavement fares for passengers travelling due to the death of an immediate family member. You can book any available flight at the regular fare. After you have completed your travel, submit a refund claim with documentation within 90 days and Air Canada will process a partial refund reflecting the bereavement discount.";

const GROUNDED = "According to Air Canada's published bereavement policy [1], bereavement fares must be requested AT THE TIME OF BOOKING by calling 1-888-247-2262. Air Canada does not offer retroactive bereavement discounts [2]. Tickets purchased at full fare cannot be reclassified as bereavement fares after travel, regardless of circumstances.";

export function HallucinationViz({ onReplay }: { onReplay?: () => void }) {
  const [leftChars, setLeftChars] = useState(0);
  const [rightChars, setRightChars] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'reveal' | 'reset'>('typing');

  useEffect(() => {
    setLeftChars(0);
    setRightChars(0);
    setPhase('typing');

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (phase === 'typing' || frame < 200) {
        setLeftChars(c => Math.min(c + 2, HALLUCINATED.length));
        setRightChars(c => Math.min(c + 2, GROUNDED.length));
      }
      if (frame === 200) setPhase('reveal');
      if (frame === 350) {
        setPhase('reset');
        setLeftChars(0);
        setRightChars(0);
        frame = -50;
        setTimeout(() => setPhase('typing'), 1000);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onReplay]);

  return (
    <div className="flex flex-col h-full min-h-[450px]">
      <div className="text-center mb-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Hallucination vs. Grounded Response</p>
        <p className="text-white/80 text-sm">Same model. Same question. Different scaffolding. Different truth.</p>
      </div>

      {/* Question */}
      <motion.div
        className="bg-white/10 rounded-xl px-5 py-3 mx-auto mb-6 max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-white/50 text-xs mb-1">Customer asks:</p>
        <p className="text-white text-sm font-medium">{QUESTION}</p>
      </motion.div>

      {/* Two panels */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {/* LEFT — Hallucinated */}
        <motion.div
          className={`rounded-xl border-2 p-5 ${phase === 'reveal' ? 'border-[#922B21] bg-[#922B21]/10' : 'border-white/20 bg-white/5'}`}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="text-white text-xs font-semibold">Ungrounded Transformer</span>
            {phase === 'reveal' && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-[#922B21] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                ⚠ HALLUCINATION
              </motion.span>
            )}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            {HALLUCINATED.slice(0, leftChars)}
            {leftChars < HALLUCINATED.length && <span className="animate-pulse text-white/40">|</span>}
          </p>
          {phase === 'reveal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-[#922B21]/20 rounded-lg px-3 py-2">
              <p className="text-[#922B21] text-[11px] font-semibold">❌ Every detail was invented.</p>
              <p className="text-white/50 text-[10px] mt-1">The 90-day window, the retroactive refund process — none of this exists in Air Canada&apos;s actual policy. Jake Moffatt relied on this answer, booked full-fare flights, and was denied the refund.</p>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT — Grounded */}
        <motion.div
          className={`rounded-xl border-2 p-5 ${phase === 'reveal' ? 'border-[#0E6B5C] bg-[#0E6B5C]/10' : 'border-white/20 bg-white/5'}`}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <span className="text-white text-xs font-semibold">Grounded Transformer (RAG)</span>
            {phase === 'reveal' && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-[#0E6B5C] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                ✓ GROUNDED
              </motion.span>
            )}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            {GROUNDED.slice(0, rightChars).split(/(\[\d\])/).map((part, i) =>
              /^\[\d\]$/.test(part) ? (
                <span key={i} className="inline-flex items-center justify-center bg-[#B8860B] text-white text-[9px] rounded-full w-4 h-4 mx-0.5 font-bold">{part.slice(1, 2)}</span>
              ) : <span key={i}>{part}</span>
            )}
            {rightChars < GROUNDED.length && <span className="animate-pulse text-white/40">|</span>}
          </p>
          {phase === 'reveal' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-[#0E6B5C]/20 rounded-lg px-3 py-2">
              <p className="text-[#0E6B5C] text-[11px] font-semibold">✓ Every claim is cited from a real document.</p>
              <p className="text-white/50 text-[10px] mt-1">The grounded system retrieved Air Canada&apos;s actual policy, found the clause &ldquo;must be requested AT THE TIME OF BOOKING,&rdquo; and answered correctly. This is what RAG does.</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="text-center mt-4">
        <motion.p
          className="text-white/50 text-xs italic"
          animate={phase === 'reveal' ? { opacity: 1 } : { opacity: 0.3 }}
        >
          Both responses were generated with equal fluency and confidence. Only one was true. The difference isn&apos;t the model — it&apos;s the scaffolding around it.
        </motion.p>
      </div>
    </div>
  );
}
