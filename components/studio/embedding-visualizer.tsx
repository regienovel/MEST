'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ChunkPreview {
  index: number;
  preview: string;
  charCount: number;
  sampleVector: number[];
}

interface EmbeddingVisualizerProps {
  docName: string;
  stage: 'chunking' | 'embedding' | 'done' | 'error';
  chunkPreviews: ChunkPreview[];
  dimensions: number;
  activeChunkIndex: number;
  errorMessage?: string;
}

export function EmbeddingVisualizer({
  docName, stage, chunkPreviews, dimensions, activeChunkIndex, errorMessage
}: EmbeddingVisualizerProps) {
  return (
    <div className="bg-gradient-to-br from-[#0F2F44] to-[#0a1f2e] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-3.5 h-3.5 rounded-full ${stage === 'error' ? 'bg-mest-rust' : stage === 'done' ? 'bg-mest-sage' : 'bg-mest-gold'}`}
            animate={stage === 'embedding' || stage === 'chunking' ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          <h3 className="text-white text-base font-semibold">{docName}</h3>
          <span className="text-white/80 text-sm">
            {stage === 'chunking' && '— Splitting document into chunks...'}
            {stage === 'embedding' && `— Embedding chunk ${activeChunkIndex + 1} of ${chunkPreviews.length}...`}
            {stage === 'done' && `— ✓ ${chunkPreviews.length} chunks embedded (${dimensions} dimensions)`}
            {stage === 'error' && `— ✗ ${errorMessage}`}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Stage 1: Document → Chunks */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <motion.span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold bg-mest-sage text-white"
              transition={{ repeat: Infinity, duration: 1 }}
            >1</motion.span>
            <span className="text-white text-sm font-semibold">CHUNKING</span>
            <span className="text-white/60 text-sm">— Split text into searchable pieces</span>
          </div>

          <div className="ml-9 space-y-2">
            <AnimatePresence>
              {chunkPreviews.map((chunk, i) => (
                <motion.div
                  key={chunk.index}
                  initial={{ opacity: 0, x: -30, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ delay: stage === 'chunking' ? i * 0.25 : 0, duration: 0.5, ease: 'easeOut' }}
                  className={`rounded-lg border overflow-hidden transition-colors duration-300 ${
                    stage === 'embedding' && i === activeChunkIndex
                      ? 'border-mest-gold bg-mest-gold/15'
                      : (stage === 'embedding' && i < activeChunkIndex) || stage === 'done'
                        ? 'border-mest-sage/50 bg-mest-sage/10'
                        : 'border-white/15 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    <motion.span
                      className={`text-xs font-mono shrink-0 mt-0.5 px-2 py-1 rounded-md font-bold ${
                        (stage === 'embedding' && i < activeChunkIndex) || stage === 'done'
                          ? 'bg-mest-sage/30 text-mest-sage'
                          : stage === 'embedding' && i === activeChunkIndex
                            ? 'bg-mest-gold/30 text-mest-gold'
                            : 'bg-white/10 text-white/60'
                      }`}
                      animate={stage === 'embedding' && i === activeChunkIndex ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    >
                      chunk {i + 1}
                    </motion.span>
                    <p className="text-white/90 text-sm leading-relaxed flex-1 line-clamp-2">
                      {chunk.preview}{chunk.charCount > 120 ? '...' : ''}
                    </p>
                    <span className="text-white/40 text-xs shrink-0 mt-0.5">{chunk.charCount} chars</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Arrow between stages */}
        {(stage === 'embedding' || stage === 'done') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-6"
          >
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className="w-0.5 h-8 bg-gradient-to-b from-mest-gold/60 to-mest-gold/20"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4 }}
              />
              <motion.span
                className="text-white text-xs font-semibold px-4 py-1.5 rounded-full bg-mest-gold/20 border border-mest-gold/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                text-embedding-3-small
              </motion.span>
              <span className="text-white/50 text-[11px]">OpenAI Embedding API</span>
              <motion.div
                className="w-0.5 h-8 bg-gradient-to-b from-mest-gold/20 to-mest-gold/60"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Stage 2: Chunks → Vectors */}
        {(stage === 'embedding' || stage === 'done') && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <motion.span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  stage === 'embedding' ? 'bg-mest-gold text-white' : 'bg-mest-sage text-white'
                }`}
                animate={stage === 'embedding' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >2</motion.span>
              <span className="text-white text-sm font-semibold">EMBEDDING</span>
              <span className="text-white/60 text-sm">— Each chunk becomes a {dimensions || 1536}-number vector</span>
            </div>

            <div className="ml-9 space-y-2">
              {chunkPreviews.map((chunk, i) => {
                const isActive = stage === 'embedding' && i === activeChunkIndex;
                const isDone = stage === 'done' || (stage === 'embedding' && i < activeChunkIndex);
                const isWaiting = stage === 'embedding' && i > activeChunkIndex;

                return (
                  <motion.div
                    key={`vec-${chunk.index}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.4 }}
                    className={`rounded-lg border px-4 py-3 transition-colors duration-300 ${
                      isDone ? 'border-mest-sage/40 bg-mest-sage/10' :
                      isActive ? 'border-mest-gold bg-mest-gold/15' :
                      'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        className={`text-xs font-mono shrink-0 px-2 py-1 rounded-md font-bold ${
                          isDone ? 'bg-mest-sage/30 text-mest-sage' :
                          isActive ? 'bg-mest-gold/30 text-mest-gold' :
                          'bg-white/5 text-white/30'
                        }`}
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                      >
                        vec {i + 1}
                      </motion.span>

                      {/* Vector number preview */}
                      <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                        {isDone && chunk.sampleVector.length > 0 ? (
                          <>
                            <span className="text-white/50 font-mono text-xs">[</span>
                            {chunk.sampleVector.map((v, vi) => (
                              <motion.span
                                key={vi}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: vi * 0.06 }}
                                className={`text-xs font-mono font-semibold ${v >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                              >
                                {v.toFixed(3)}{vi < chunk.sampleVector.length - 1 ? ', ' : ''}
                              </motion.span>
                            ))}
                            <span className="text-white/30 text-xs font-mono ml-1">...{(dimensions || 1536) - 8} more</span>
                            <span className="text-white/50 font-mono text-xs">]</span>
                          </>
                        ) : isActive ? (
                          <div className="flex gap-1.5 items-center">
                            {Array.from({ length: 8 }).map((_, vi) => (
                              <motion.div
                                key={vi}
                                className="w-8 h-4 bg-mest-gold/20 rounded"
                                animate={{ opacity: [0.2, 0.7, 0.2] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: vi * 0.06 }}
                              />
                            ))}
                            <span className="text-white/40 text-xs ml-1">computing...</span>
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs italic">waiting...</span>
                        )}
                      </div>

                      {/* Status */}
                      <span className="shrink-0 text-sm">
                        {isDone && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-mest-sage">✓</motion.span>}
                        {isActive && <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="text-mest-gold">●</motion.span>}
                        {isWaiting && <span className="text-white/15">○</span>}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Completion summary */}
            {stage === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="ml-9 mt-5 bg-mest-sage/15 border border-mest-sage/30 rounded-xl px-5 py-4"
              >
                <p className="text-white text-sm font-semibold">
                  ✓ Each chunk is now a point in {dimensions}-dimensional space
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Similar text = nearby points. Different text = far apart.
                </p>
                <p className="text-mest-gold text-xs mt-3 font-medium">
                  → Go to the Pipeline Visualizer tab to search this vector space with a question
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
