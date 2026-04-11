'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChunkPoint {
  id: string;
  text: string;
  documentName: string;
  x: number;
  y: number;
}

interface RetrievedChunk {
  id: string;
  text: string;
  documentName: string;
  similarity: number;
  originalRank?: number;
  newRank?: number;
}

interface VectorSpaceProps {
  chunkPoints: ChunkPoint[];
  retrievedChunks: RetrievedChunk[];
  rerankedChunks: RetrievedChunk[];
  queryEmbedDone: boolean;
  retrieveDone: boolean;
  rerankDone: boolean;
}

const CANVAS_W = 500;
const CANVAS_H = 380;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;

// Seed-based pseudo-random for consistent per-dot animation
function seededRand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function VectorSpace({
  chunkPoints, retrievedChunks, rerankedChunks,
  queryEmbedDone, retrieveDone, rerankDone,
}: VectorSpaceProps) {
  const [hoveredChunk, setHoveredChunk] = useState<{ chunk: ChunkPoint; mx: number; my: number } | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [waveRadius, setWaveRadius] = useState(0);
  const [showLines, setShowLines] = useState(false);
  const [ghostPositions, setGhostPositions] = useState<Array<{ id: string; cx: number; cy: number }>>([]);
  const prevPositionsRef = useRef<Record<string, { cx: number; cy: number }>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  // Enhancement #5: Position chunks by similarity to query
  const positionedChunks = useMemo(() => {
    if (retrievedChunks.length === 0) {
      // Before retrieval: use original x,y positions
      return chunkPoints.map((c, i) => ({
        ...c,
        cx: 30 + c.x * (CANVAS_W - 60),
        cy: 30 + c.y * (CANVAS_H - 60),
        isRetrieved: false,
        rank: -1,
        similarity: 0,
      }));
    }

    // After retrieval: position by similarity to query
    const maxDist = Math.min(CANVAS_W, CANVAS_H) * 0.42;
    return chunkPoints.map((c, i) => {
      const retrieved = retrievedChunks.find(r => r.id === c.id);
      const sim = retrieved?.similarity ?? 0.1;
      const distance = (1 - sim) * maxDist;
      const angle = seededRand(i + 42) * Math.PI * 2;
      const jitterX = (seededRand(i * 7) - 0.5) * 30;
      const jitterY = (seededRand(i * 13) - 0.5) * 30;

      return {
        ...c,
        cx: CENTER_X + Math.cos(angle) * distance + jitterX,
        cy: CENTER_Y + Math.sin(angle) * distance + jitterY,
        isRetrieved: !!retrieved,
        rank: retrieved ? retrievedChunks.indexOf(retrieved) : -1,
        similarity: sim,
      };
    });
  }, [chunkPoints, retrievedChunks]);

  // Enhancement #3: Trigger search wave when retrieve starts
  useEffect(() => {
    if (queryEmbedDone && !retrieveDone) {
      setShowLines(false);
      setWaveActive(true);
      setWaveRadius(0);

      const maxR = Math.max(CANVAS_W, CANVAS_H);
      const startTime = Date.now();
      const duration = 1200;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setWaveRadius(progress * maxR);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setWaveActive(false);
          setShowLines(true);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [queryEmbedDone, retrieveDone]);

  // Show lines once retrieve is done (if wave already finished)
  useEffect(() => {
    if (retrieveDone && !waveActive) {
      setShowLines(true);
    }
  }, [retrieveDone, waveActive]);

  // Enhancement #9: Ghost trail on rerank
  useEffect(() => {
    if (rerankDone && rerankedChunks.length > 0) {
      const ghosts: Array<{ id: string; cx: number; cy: number }> = [];
      for (const rc of rerankedChunks) {
        const prev = prevPositionsRef.current[rc.id];
        if (prev) {
          ghosts.push({ id: `ghost-${rc.id}-${Date.now()}`, cx: prev.cx, cy: prev.cy });
        }
      }
      setGhostPositions(ghosts);
      setTimeout(() => setGhostPositions([]), 500);
    }
  }, [rerankDone, rerankedChunks]);

  // Track positions for ghost trails
  useEffect(() => {
    const positions: Record<string, { cx: number; cy: number }> = {};
    for (const c of positionedChunks) {
      positions[c.id] = { cx: c.cx, cy: c.cy };
    }
    prevPositionsRef.current = positions;
  }, [positionedChunks]);

  // Get rerank info for a chunk
  const getRerankInfo = (chunkId: string) => {
    if (!rerankDone) return null;
    const rc = rerankedChunks.find(r => r.id === chunkId);
    if (!rc) return null;
    const moved = (rc.originalRank ?? 0) - (rc.newRank ?? 0);
    return { newRank: rc.newRank ?? 0, moved };
  };

  // Mouse tracking for hover card
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hoveredChunk) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const svgY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    setHoveredChunk(prev => prev ? { ...prev, mx: svgX, my: svgY } : null);
  };

  return (
    <div className="bg-[#0F2F44] rounded-2xl p-6">
      {/* Enhancement #8: Title + subtitle */}
      <div className="mb-4">
        <h3 className="text-white/80 text-sm font-semibold">Vector Space</h3>
        <p className="text-[#B8860B]/70 text-[10px] mt-0.5">Hover any dot to peek inside</p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full max-w-2xl mx-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredChunk(null)}
      >
        <defs>
          <filter id="queryGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Enhancement #3: Search wave */}
        {waveActive && (
          <motion.circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={waveRadius}
            fill="none"
            stroke="#B8860B"
            strokeWidth={1.5}
            opacity={Math.max(0, 0.4 * (1 - waveRadius / Math.max(CANVAS_W, CANVAS_H)))}
          />
        )}

        {/* Enhancement #9: Ghost dots */}
        <AnimatePresence>
          {ghostPositions.map(ghost => (
            <motion.circle
              key={ghost.id}
              cx={ghost.cx}
              cy={ghost.cy}
              r={5}
              fill="#B8860B"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Chunk dots with enhancements #1, #3 flash, #6 rerank viz */}
        {positionedChunks.map((chunk, i) => {
          const isRetrieved = chunk.isRetrieved;
          const rerankInfo = getRerankInfo(chunk.id);
          const isTopReranked = rerankInfo?.newRank === 0;
          const movedUp = rerankInfo && rerankInfo.moved > 0;
          const movedDown = rerankInfo && rerankInfo.moved < 0;

          // Enhancement #3: flash when wave passes
          const distFromCenter = Math.sqrt((chunk.cx - CENTER_X) ** 2 + (chunk.cy - CENTER_Y) ** 2);
          const isWaveHit = waveActive && waveRadius >= distFromCenter && waveRadius < distFromCenter + 30;

          // Enhancement #1: ambient float params
          const floatDurX = seededRand(i * 3) * 2 + 4;
          const floatDurY = seededRand(i * 5) * 2 + 4;
          const floatAmtX = (seededRand(i * 7) - 0.5) * 6;
          const floatAmtY = (seededRand(i * 11) - 0.5) * 6;

          // Enhancement #6: fill color based on state
          let fillColor = '#ffffff40';
          if (isWaveHit) fillColor = '#ffffff';
          else if (isTopReranked) fillColor = '#B8860B';
          else if (isRetrieved) fillColor = '#B8860B';
          else if (movedUp) fillColor = '#5D8B7F';
          else if (movedDown) fillColor = '#922B21';

          // Enhancement #4: dot size
          let dotR = 3;
          if (isTopReranked) dotR = 8;
          else if (isRetrieved) dotR = 6;
          else if (isWaveHit) dotR = 4;

          const isHovered = hoveredChunk?.chunk.id === chunk.id;

          return (
            <motion.circle
              key={chunk.id}
              cx={chunk.cx}
              cy={chunk.cy}
              r={dotR}
              fill={fillColor}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                x: isHovered ? 0 : [0, floatAmtX, 0],
                y: isHovered ? 0 : [0, floatAmtY, 0],
                scale: isWaveHit ? 1.3 : isTopReranked ? [1, 1.15, 1] : 1,
              }}
              transition={{
                opacity: { delay: i * 0.015, duration: 0.3 },
                x: { duration: floatDurX, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                y: { duration: floatDurY, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                scale: isTopReranked ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 },
              }}
              filter={isTopReranked ? 'url(#queryGlow)' : undefined}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (!rect) return;
                const svgX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
                const svgY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
                setHoveredChunk({ chunk, mx: svgX, my: svgY });
              }}
              onMouseLeave={() => setHoveredChunk(null)}
            />
          );
        })}

        {/* Enhancement #2: Pulsing query dot */}
        {queryEmbedDone && (
          <motion.circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={9}
            fill="#B8860B"
            filter="url(#queryGlow)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: [1, 1.15, 1],
            }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
            }}
          />
        )}

        {/* Enhancement #4: Similarity-weighted lines */}
        {showLines && retrievedChunks.map((rc, idx) => {
          const chunk = positionedChunks.find(c => c.id === rc.id);
          if (!chunk) return null;
          const strokeWidths = [3, 2.5, 2, 1.5, 1];
          return (
            <motion.line
              key={`line-${rc.id}`}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={chunk.cx}
              y2={chunk.cy}
              stroke="#B8860B"
              strokeWidth={strokeWidths[idx] ?? 1}
              strokeOpacity={0.7}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            />
          );
        })}

        {/* Enhancement #7: Hover tether line */}
        {hoveredChunk && (() => {
          const pc = positionedChunks.find(c => c.id === hoveredChunk.chunk.id);
          return (
          <line
            x1={pc?.cx || 0}
            y1={pc?.cy || 0}
            x2={Math.min(hoveredChunk.mx + 16, CANVAS_W - 20)}
            y2={Math.min(hoveredChunk.my + 16, CANVAS_H - 20)}
            stroke="white"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          );
        })()}

        {/* Enhancement #8: Axis labels — edges=less similar, centre=more similar */}
        <text x={12} y={CANVAS_H - 8} fill="white" fillOpacity={0.4} fontSize={9}>← less similar (edge)</text>
        <text x={CENTER_X - 40} y={CENTER_Y + 24} fill="#B8860B" fillOpacity={0.5} fontSize={9}>centre = most similar</text>
      </svg>

      {/* Enhancement #7: Hover preview card */}
      {hoveredChunk && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: -8,
          }}
        >
          <div className="bg-[#0F2F44] text-white text-xs p-2 rounded border border-white/30 shadow-lg max-w-[280px]">
            <p>{hoveredChunk.chunk.text.slice(0, 80)}{hoveredChunk.chunk.text.length > 80 ? '...' : ''}</p>
            <p className="text-white/50 text-[10px] mt-1">{hoveredChunk.chunk.documentName}</p>
          </div>
        </div>
      )}

      {/* Enhancement #8: Caption */}
      <p className="text-white/50 text-[11px] italic text-center mt-3">
        1536 dimensions, projected into 2 by similarity to your query
      </p>
    </div>
  );
}
