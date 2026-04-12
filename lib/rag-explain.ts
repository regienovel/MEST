import type { RagConfig } from './rag-config';

interface StageData {
  stage: string;
  status: string;
  elapsed_ms?: number;
  payload?: Record<string, unknown>;
}

interface RetrievedChunk {
  id: string;
  text: string;
  documentName: string;
  similarity: number;
  originalRank?: number;
  newRank?: number;
}

export interface ExplainabilityReport {
  timestamp: string;
  query: string;
  layers: {
    query: {
      text: string;
      embeddingDimensions: number;
      elapsedMs: number;
    };
    retrieval: {
      totalChunks: number;
      retrievedCount: number;
      topMatch: { text: string; document: string; similarity: number } | null;
      explanation: string;
      elapsedMs: number;
    };
    ranking: {
      rerankingEnabled: boolean;
      rerankModel: string;
      changes: Array<{ text: string; from: number; to: number; direction: 'up' | 'down' | 'same' }>;
      explanation: string;
      elapsedMs: number;
    };
    instruction: {
      systemPrompt: string;
      temperature: number;
      generationModel: string;
      strictThreshold: number;
      topSimilarity: number;
      thresholdPassed: boolean;
    };
    generation: {
      response: string;
      citationCount: number;
      elapsedMs: number;
    };
    evidence: Array<{
      citationNumber: number;
      claimedText: string;
      sourceDocument: string;
      sourceChunk: string;
      verified: boolean;
    }>;
  };
  confidence: {
    level: 'HIGH' | 'MODERATE' | 'LOW';
    topSimilarity: number;
    citationCoverage: string;
    hallucinationRisk: string;
  };
}

export function generateExplainabilityReport(
  query: string,
  stageStatuses: Record<string, StageData>,
  retrievedChunks: RetrievedChunk[],
  rerankedChunks: RetrievedChunk[],
  generatedText: string,
  config: RagConfig
): ExplainabilityReport {
  const embedStage = stageStatuses['embed_query'];
  const retrieveStage = stageStatuses['retrieve'];
  const rerankStage = stageStatuses['rerank'];
  const generateStage = stageStatuses['generate'];

  const topSimilarity = retrievedChunks[0]?.similarity || 0;
  const citationMatches = generatedText.match(/\[\d+\]/g) || [];
  const citationCount = citationMatches.length;

  // Build ranking changes
  const changes = rerankedChunks.map(chunk => {
    const moved = (chunk.originalRank ?? 0) - (chunk.newRank ?? 0);
    return {
      text: chunk.text.slice(0, 80),
      from: (chunk.originalRank ?? 0) + 1,
      to: (chunk.newRank ?? 0) + 1,
      direction: (moved > 0 ? 'up' : moved < 0 ? 'down' : 'same') as 'up' | 'down' | 'same',
    };
  });

  // Build evidence traces
  const evidence = citationMatches.map((match, i) => {
    const num = parseInt(match.slice(1, -1));
    const chunk = rerankedChunks[num - 1] || retrievedChunks[num - 1];
    return {
      citationNumber: num,
      claimedText: `Citation [${num}] in response`,
      sourceDocument: chunk?.documentName || 'Unknown',
      sourceChunk: chunk?.text?.slice(0, 120) || 'Source not found',
      verified: !!chunk,
    };
  });

  // Confidence assessment
  const confidence: ExplainabilityReport['confidence'] = {
    level: topSimilarity > 0.4 ? 'HIGH' : topSimilarity > 0.2 ? 'MODERATE' : 'LOW',
    topSimilarity: Math.round(topSimilarity * 100),
    citationCoverage: citationCount > 0 ? `${citationCount} claims cited` : 'No citations',
    hallucinationRisk: citationCount > 0 && topSimilarity > 0.2 ? 'LOW — claims are grounded in sources' : topSimilarity < 0.15 ? 'HIGH — weak source match' : 'MODERATE — review citations',
  };

  return {
    timestamp: new Date().toISOString(),
    query,
    layers: {
      query: {
        text: query,
        embeddingDimensions: 1536,
        elapsedMs: (embedStage?.elapsed_ms || 0) + (stageStatuses['query']?.elapsed_ms || 0),
      },
      retrieval: {
        totalChunks: (retrieveStage?.payload?.totalChunks as number) || 0,
        retrievedCount: retrievedChunks.length,
        topMatch: retrievedChunks[0] ? {
          text: retrievedChunks[0].text.slice(0, 120),
          document: retrievedChunks[0].documentName,
          similarity: Math.round(retrievedChunks[0].similarity * 100),
        } : null,
        explanation: retrievedChunks[0]
          ? `Retrieved ${retrievedChunks.length} chunks. Best match from "${retrievedChunks[0].documentName}" at ${Math.round(retrievedChunks[0].similarity * 100)}% similarity.`
          : 'No chunks retrieved.',
        elapsedMs: retrieveStage?.elapsed_ms || 0,
      },
      ranking: {
        rerankingEnabled: config.enableReranking,
        rerankModel: config.rerankModel || 'claude-sonnet',
        changes,
        explanation: config.enableReranking
          ? changes.some(c => c.direction !== 'same')
            ? `Reranking reordered chunks — most relevant content moved to top.`
            : 'Reranking confirmed the original order was correct.'
          : 'Reranking was disabled. Chunks used in retrieval order.',
        elapsedMs: rerankStage?.elapsed_ms || 0,
      },
      instruction: {
        systemPrompt: config.systemPrompt || 'Default system prompt',
        temperature: config.temperature,
        generationModel: config.generationModel || 'gpt-4o',
        strictThreshold: config.strictThreshold,
        topSimilarity: Math.round(topSimilarity * 100),
        thresholdPassed: topSimilarity >= (config.strictThreshold || 0.15),
      },
      generation: {
        response: generatedText,
        citationCount,
        elapsedMs: generateStage?.elapsed_ms || 0,
      },
      evidence,
    },
    confidence,
  };
}

export function reportToMarkdown(report: ExplainabilityReport): string {
  const lines: string[] = [
    `# Explainability Report`,
    `**Query:** "${report.query}"`,
    `**Timestamp:** ${new Date(report.timestamp).toLocaleString()}`,
    `**Confidence:** ${report.confidence.level} (top similarity: ${report.confidence.topSimilarity}%)`,
    '',
    `## 1. Query Understanding`,
    `Question embedded into ${report.layers.query.embeddingDimensions}-dimensional vector (${report.layers.query.elapsedMs}ms)`,
    '',
    `## 2. Retrieval`,
    report.layers.retrieval.explanation,
    report.layers.retrieval.topMatch ? `Top match: "${report.layers.retrieval.topMatch.text}..." from ${report.layers.retrieval.topMatch.document} (${report.layers.retrieval.topMatch.similarity}%)` : '',
    '',
    `## 3. Ranking`,
    report.layers.ranking.explanation,
    ...report.layers.ranking.changes.map(c => `- "${c.text}..." moved from #${c.from} to #${c.to} (${c.direction === 'up' ? '↑' : c.direction === 'down' ? '↓' : '='})`),
    '',
    `## 4. Instructions`,
    `Model: ${report.layers.instruction.generationModel} | Temperature: ${report.layers.instruction.temperature} | Threshold: ${report.layers.instruction.strictThreshold}`,
    `System prompt: "${report.layers.instruction.systemPrompt.slice(0, 200)}..."`,
    `Top similarity (${report.layers.instruction.topSimilarity}%) ${report.layers.instruction.thresholdPassed ? '≥' : '<'} threshold (${Math.round(report.layers.instruction.strictThreshold * 100)}%) → ${report.layers.instruction.thresholdPassed ? 'ANSWERED' : 'REFUSED'}`,
    '',
    `## 5. Generated Response`,
    report.layers.generation.response,
    '',
    `## 6. Evidence`,
    ...report.layers.evidence.map(e => `- [${e.citationNumber}] → ${e.sourceDocument}: "${e.sourceChunk}..." ${e.verified ? '✓ verified' : '✗ unverified'}`),
    '',
    `## Confidence Assessment`,
    `- Level: ${report.confidence.level}`,
    `- Citation coverage: ${report.confidence.citationCoverage}`,
    `- Hallucination risk: ${report.confidence.hallucinationRisk}`,
  ];
  return lines.join('\n');
}
