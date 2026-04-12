'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TokenGroup { word: string; tokens: string[]; color: string }

const TOKENIZED: TokenGroup[] = [
  { word: 'The', tokens: ['The'], color: '#4A90D9' },
  { word: 'trader', tokens: ['trader'], color: '#4A90D9' },
  { word: 'at', tokens: ['at'], color: '#4A90D9' },
  { word: 'the', tokens: ['the'], color: '#4A90D9' },
  { word: 'market', tokens: ['market'], color: '#4A90D9' },
  { word: 'said', tokens: ['said'], color: '#4A90D9' },
  { word: 'her', tokens: ['her'], color: '#4A90D9' },
  { word: 'plantain', tokens: ['plant', 'ain'], color: '#B8860B' },
  { word: 'prices', tokens: ['prices'], color: '#4A90D9' },
  { word: 'have', tokens: ['have'], color: '#4A90D9' },
  { word: 'gone', tokens: ['gone'], color: '#4A90D9' },
  { word: 'up', tokens: ['up'], color: '#4A90D9' },
  { word: 'because', tokens: ['because'], color: '#4A90D9' },
  { word: 'of', tokens: ['of'], color: '#4A90D9' },
  { word: 'the', tokens: ['the'], color: '#4A90D9' },
  { word: 'harmattan', tokens: ['har', 'matt', 'an'], color: '#922B21' },
];

const AFRICAN_EXAMPLES = [
  { word: 'Thiéboudienne', tokens: ['Th', 'ié', 'bou', 'di', 'enne'], color: '#922B21' },
  { word: 'kelewele', tokens: ['kel', 'ew', 'ele'], color: '#922B21' },
  { word: 'jollof', tokens: ['j', 'oll', 'of'], color: '#B8860B' },
  { word: 'the', tokens: ['the'], color: '#0E6B5C' },
  { word: 'policy', tokens: ['policy'], color: '#0E6B5C' },
  { word: 'refund', tokens: ['refund'], color: '#0E6B5C' },
];

const TOTAL_WORDS = 16;
const TOTAL_TOKENS = TOKENIZED.reduce((s, t) => s + t.tokens.length, 0);

export function TokenViz({ onReplay }: { onReplay?: () => void }) {
  const [phase, setPhase] = useState<'words' | 'splitting' | 'tokens' | 'bias'>('words');

  useEffect(() => {
    setPhase('words');
    const timers = [
      setTimeout(() => setPhase('splitting'), 2000),
      setTimeout(() => setPhase('tokens'), 4000),
      setTimeout(() => setPhase('bias'), 8000),
      setTimeout(() => setPhase('words'), 14000),
    ];
    const loop = setInterval(() => {
      setPhase('words');
      timers.push(
        setTimeout(() => setPhase('splitting'), 2000),
        setTimeout(() => setPhase('tokens'), 4000),
        setTimeout(() => setPhase('bias'), 8000),
      );
    }, 14000);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, [onReplay]);

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="text-center mb-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Tokenization</p>
        <p className="text-white/80 text-sm">You read words. The model reads tokens. They&apos;re not the same thing.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Main sentence */}
        <div className="flex items-center justify-center gap-1 flex-wrap max-w-3xl mb-6">
          {TOKENIZED.map((group, gi) => (
            <div key={gi} className="flex items-center">
              {(phase === 'words') ? (
                <motion.span className="px-2 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium" layout>
                  {group.word}
                </motion.span>
              ) : (
                <div className="flex items-center gap-0.5">
                  {group.tokens.map((tok, ti) => (
                    <motion.span
                      key={ti}
                      className="px-1.5 py-1.5 rounded text-xs font-mono font-bold"
                      style={{
                        backgroundColor: `${group.color}20`,
                        color: group.color,
                        borderLeft: ti > 0 ? `2px solid ${group.color}` : 'none',
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: gi * 0.05 + ti * 0.1 }}
                    >
                      {tok}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Counter */}
        <AnimatePresence mode="wait">
          {phase === 'words' && (
            <motion.div key="words" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mb-6">
              <p className="text-white text-lg font-semibold">What you see: <span className="text-[#4A90D9]">{TOTAL_WORDS} words</span></p>
            </motion.div>
          )}
          {(phase === 'splitting' || phase === 'tokens') && (
            <motion.div key="tokens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mb-6">
              <p className="text-white text-lg font-semibold">
                What you see: <span className="text-[#4A90D9]">{TOTAL_WORDS} words</span>
                <span className="text-white/40 mx-3">→</span>
                What the model sees: <span className="text-[#B8860B]">{TOTAL_TOKENS} tokens</span>
              </p>
              <p className="text-white/50 text-xs mt-2">
                <span className="text-[#B8860B]">plantain</span> = 2 tokens &nbsp;·&nbsp;
                <span className="text-[#922B21]">harmattan</span> = 3 tokens &nbsp;·&nbsp;
                Common English words = 1 token each
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bias comparison */}
        {phase === 'bias' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-xl p-5 max-w-lg">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3 text-center">THE HIDDEN BIAS</p>
            <div className="space-y-2">
              {AFRICAN_EXAMPLES.map((ex, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between">
                  <span className="text-white text-sm w-32">{ex.word}</span>
                  <div className="flex gap-0.5 flex-1 justify-center">
                    {ex.tokens.map((tok, ti) => (
                      <span key={ti} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: `${ex.color}20`, color: ex.color }}>{tok}</span>
                    ))}
                  </div>
                  <span className="text-white/40 text-xs w-16 text-right">{ex.tokens.length} token{ex.tokens.length > 1 ? 's' : ''}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-4 text-center italic">
              African words cost more tokens to process and may be understood less well. This is architectural bias — built into the tokenizer itself.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
