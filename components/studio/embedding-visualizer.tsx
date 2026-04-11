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
    <div className="bg-gradient-to-br from-[#0F2F44] to-[#0a1f2e] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-3 h-3 rounded-full ${stage === 'error' ? 'bg-mest-rust' : stage === 'done' ? 'bg-mest-sage' : 'bg-mest-gold'}`}
            animate={stage === 'embedding' || stage === 'chunking' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
          <h3 className="text-white text-sm font-semibold">{docName}</h3>
          <span className="text-white/40 text-xs">
            {stage === 'chunking' && 'Splitting document into chunks...'}
            {stage === 'embedding' && `Embedding chunk ${activeChunkIndex + 1} of ${chunkPreviews.length}...`}
            {stage === 'done' && `✓ ${chunkPreviews.length} chunks → ${chunkPreviews.length} vectors (${dimensions} dimensions each)`}
            {stage === 'error' && `✗ ${errorMessage}`}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Stage 1: Document → Chunks */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              stage === 'chunking' ? 'bg-mest-gold text-white' : 'bg-mest-gold/20 text-mest-gold'
            }`}>1</span>
            <span className="text-white/70 text-xs font-medium">CHUNKING — Split text into searchable pieces</span>
          </div>

          <div className="ml-8 space-y-2">
            <AnimatePresence>
              {chunkPreviews.map((chunk, i) => (
                <motion.div
                  key={chunk.index}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ delay: stage === 'chunking' ? i * 0.3 : 0, duration: 0.4 }}
                  className={`rounded-lg border overflow-hidden ${
                    stage === 'embedding' && i === activeChunkIndex
                      ? 'border-mest-gold bg-mest-gold/10'
                      : stage === 'embedding' && i < activeChunkIndex
                        ? 'border-mest-sage/40 bg-mest-sage/5'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3 px-3 py-2">
                    <span className={`text-[10px] font-mono shrink-0 mt-0.5 px-1.5 py-0.5 rounded ${
                      stage === 'embedding' && i < activeChunkIndex ? 'bg-mest-sage/20 text-mest-sage' :
                      stage === 'embedding' && i === activeChunkIndex ? 'bg-mest-gold/20 text-mest-gold animate-pulse' :
                      'bg-white/10 text-white/40'
                    }`}>
                      chunk {i + 1}
                    </span>
                    <p className="text-white/60 text-[11px] leading-relaxed flex-1 line-clamp-2">
                      {chunk.preview}{chunk.charCount > 120 ? '...' : ''}
                    </p>
                    <span className="text-white/20 text-[9px] shrink-0">{chunk.charCount} chars</span>
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
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="w-0.5 h-6 bg-mest-gold/40"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3 }}
              />
              <span className="text-mest-gold text-xs font-medium px-3 py-1 rounded-full bg-mest-gold/10 border border-mest-gold/20">
                text-embedding-3-small
              </span>
              <motion.div
                className="w-0.5 h-6 bg-mest-gold/40"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
              <span className="text-[10px] text-white/30">OpenAI Embedding API</span>
            </div>
          </motion.div>
        )}

        {/* Stage 2: Chunks → Vectors */}
        {(stage === 'embedding' || stage === 'done') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                stage === 'embedding' ? 'bg-mest-gold text-white animate-pulse' : 'bg-mest-sage/30 text-mest-sage'
              }`}>2</span>
              <span className="text-white/70 text-xs font-medium">EMBEDDING — Convert each chunk into a {dimensions || 1536}-number vector</span>
            </div>

            <div className="ml-8 space-y-2">
              {chunkPreviews.map((chunk, i) => {
                const isActive = stage === 'embedding' && i === activeChunkIndex;
                const isDone = stage === 'done' || (stage === 'embedding' && i < activeChunkIndex);
                const isWaiting = stage === 'embedding' && i > activeChunkIndex;

                return (
                  <motion.div
                    key={`vec-${chunk.index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.3 }}
                    className={`rounded-lg border px-3 py-2 ${
                      isDone ? 'border-mest-sage/30 bg-mest-sage/5' :
                      isActive ? 'border-mest-gold bg-mest-gold/10' :
                      'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                        isDone ? 'bg-mest-sage/20 text-mest-sage' :
                        isActive ? 'bg-mest-gold/20 text-mest-gold animate-pulse' :
                        'bg-white/5 text-white/20'
                      }`}>
                        vec {i + 1}
                      </span>

                      {/* Vector number preview */}
                      <div className="flex-1 flex items-center gap-1 overflow-hidden">
                        {(isDone && chunk.sampleVector.length > 0) ? (
                          <>
                            <span className="text-[10px] text-white/30 font-mono">[</span>
                            {chunk.sampleVector.map((v, vi) => (
                              <motion.span
                                key={vi}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: vi * 0.05 }}
                                className={`text-[10px] font-mono ${v >= 0 ? 'text-mest-sage/70' : 'text-mest-rust/70'}`}
                              >
                                {v.toFixed(3)}{vi < chunk.sampleVector.length - 1 ? ',' : ''}
                              </motion.span>
                            ))}
                            <span className="text-[10px] text-white/20 font-mono">...{dimensions - 8} more</span>
                            <span className="text-[10px] text-white/30 font-mono">]</span>
                          </>
                        ) : isActive ? (
                          <div className="flex gap-1">
                            {Array.from({ length: 8 }).map((_, vi) => (
                              <motion.div
                                key={vi}
                                className="w-6 h-3 bg-mest-gold/20 rounded"
                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: vi * 0.08 }}
                              />
                            ))}
                            <span className="text-[10px] text-white/20">computing...</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/15">waiting...</span>
                        )}
                      </div>

                      {/* Status indicator */}
                      <span className="shrink-0">
                        {isDone && <span className="text-mest-sage text-xs">✓</span>}
                        {isActive && <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-mest-gold text-xs">●</motion.span>}
                        {isWaiting && <span className="text-white/10 text-xs">○</span>}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            {stage === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="ml-8 mt-4 bg-mest-sage/10 border border-mest-sage/20 rounded-lg px-4 py-3"
              >
                <p className="text-mest-sage text-xs font-medium">
                  ✓ Each chunk is now a point in {dimensions}-dimensional space. Similar text = nearby points.
                </p>
                <p className="text-white/30 text-[10px] mt-1">
                  Go to the Pipeline Visualizer to search this vector space with a question.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
