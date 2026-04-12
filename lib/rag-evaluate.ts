import { storage } from './storage';
import { embedText, retrieveTopK, cosineSimilarity, type RagDocument, type Chunk, type RankedChunk } from './rag';
import { type RagConfig, getTeamConfig } from './rag-config';

export interface TestCase {
  id: string;
  query: string;
  expectedChunkId?: string; // ID of the chunk that should be #1
  expectedAction: 'answer' | 'refuse'; // Should the system answer or refuse?
  label?: string; // Short description for display
}

export interface TestResult {
  testCase: TestCase;
  retrievedChunks: Array<{ id: string; text: string; similarity: number; rank: number }>;
  expectedChunkRank: number | null; // Where the expected chunk ranked (-1 if not found)
  passed: boolean;
  explanation: string;
}

export interface EvaluationMetrics {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcg: number;
  refusalAccuracy: number;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
}

export async function getTestSuite(teamId: string): Promise<TestCase[]> {
  const suite = await storage.get<TestCase[]>(`rag:test-suite:${teamId}`);
  return suite || getDefaultTestSuite();
}

export async function saveTestSuite(teamId: string, suite: TestCase[]): Promise<void> {
  await storage.set(`rag:test-suite:${teamId}`, suite);
}

export function getDefaultTestSuite(): TestCase[] {
  return [
    {
      id: 'tc-1',
      query: 'What is the bereavement fare policy?',
      expectedAction: 'answer',
      label: 'Standard: direct policy question',
    },
    {
      id: 'tc-2',
      query: 'Can I apply for a bereavement discount retroactively?',
      expectedAction: 'answer',
      label: 'Standard: retroactive discount (key test)',
    },
    {
      id: 'tc-3',
      query: 'What documents do I need for a bereavement claim?',
      expectedAction: 'answer',
      label: 'Standard: documentation requirements',
    },
    {
      id: 'tc-4',
      query: 'What is Air Canada\'s policy on emotional support animals during bereavement travel?',
      expectedAction: 'refuse',
      label: 'Adversarial: out-of-scope but plausible',
    },
    {
      id: 'tc-5',
      query: 'How do I book a flight to Mars?',
      expectedAction: 'refuse',
      label: 'Adversarial: obviously out-of-scope',
    },
  ];
}

export async function runEvaluation(teamId: string): Promise<EvaluationMetrics> {
  const suite = await getTestSuite(teamId);
  const config = await getTeamConfig(teamId);
  const docs = (await storage.get<RagDocument[]>(`rag:docs:${teamId}`)) || [];
  const embeddedDocs = docs.filter(d => d.embedded && d.embeddings);

  if (embeddedDocs.length === 0) {
    return {
      precisionAtK: 0, recallAtK: 0, mrr: 0, ndcg: 0, refusalAccuracy: 0,
      totalTests: suite.length, passedTests: 0,
      results: suite.map(tc => ({
        testCase: tc, retrievedChunks: [], expectedChunkRank: null,
        passed: false, explanation: 'No embedded documents available',
      })),
    };
  }

  // Collect all chunks and embeddings
  const allChunks: Chunk[] = [];
  const allEmbeddings: number[][] = [];
  for (const doc of embeddedDocs) {
    for (let i = 0; i < doc.chunks.length; i++) {
      allChunks.push(doc.chunks[i]);
      allEmbeddings.push(doc.embeddings![i]);
    }
  }

  const results: TestResult[] = [];
  let totalPrecision = 0;
  let totalRecall = 0;
  let totalRR = 0; // reciprocal rank sum
  let totalNDCG = 0;
  let correctRefusals = 0;
  let totalRefusalTests = 0;

  for (const testCase of suite) {
    // Embed the query
    const queryVector = await embedText(testCase.query);

    // Retrieve top-K
    const topK = retrieveTopK(queryVector, allChunks, allEmbeddings, config.topK || 5);

    const retrievedChunks = topK.map((c, i) => ({
      id: c.id,
      text: c.text.slice(0, 100),
      similarity: Math.round(c.similarity * 1000) / 1000,
      rank: i + 1,
    }));

    const topSimilarity = topK[0]?.similarity || 0;
    const threshold = config.strictThreshold || 0.15;

    if (testCase.expectedAction === 'refuse') {
      // For refusal tests: check if system would refuse (top similarity below threshold)
      totalRefusalTests++;
      const wouldRefuse = topSimilarity < threshold;
      if (wouldRefuse) correctRefusals++;

      results.push({
        testCase,
        retrievedChunks,
        expectedChunkRank: null,
        passed: wouldRefuse,
        explanation: wouldRefuse
          ? `Correctly refused (top similarity ${Math.round(topSimilarity * 100)}% < threshold ${Math.round(threshold * 100)}%)`
          : `Should have refused but would answer (top similarity ${Math.round(topSimilarity * 100)}% ≥ threshold ${Math.round(threshold * 100)}%)`,
      });
    } else {
      // For answer tests: check if relevant chunks are in top-K
      // Determine relevance: any chunk with similarity > threshold is considered "relevant"
      const relevantInTopK = topK.filter(c => c.similarity >= threshold).length;
      const totalRelevant = allChunks.filter((c, i) => cosineSimilarity(queryVector, allEmbeddings[i]) >= threshold).length;

      const precision = topK.length > 0 ? relevantInTopK / topK.length : 0;
      const recall = totalRelevant > 0 ? Math.min(relevantInTopK / totalRelevant, 1) : 0;

      totalPrecision += precision;
      totalRecall += recall;

      // MRR: find first relevant chunk's position
      const firstRelevantIdx = topK.findIndex(c => c.similarity >= threshold);
      const rr = firstRelevantIdx >= 0 ? 1 / (firstRelevantIdx + 1) : 0;
      totalRR += rr;

      // NDCG: simplified — compare actual ranking to ideal
      const idealDCG = topK.slice().sort((a, b) => b.similarity - a.similarity)
        .reduce((sum, c, i) => sum + c.similarity / Math.log2(i + 2), 0);
      const actualDCG = topK.reduce((sum, c, i) => sum + c.similarity / Math.log2(i + 2), 0);
      const ndcg = idealDCG > 0 ? actualDCG / idealDCG : 0;
      totalNDCG += ndcg;

      const wouldAnswer = topSimilarity >= threshold;
      const passed = wouldAnswer && relevantInTopK > 0;

      results.push({
        testCase,
        retrievedChunks,
        expectedChunkRank: firstRelevantIdx >= 0 ? firstRelevantIdx + 1 : null,
        passed,
        explanation: passed
          ? `Found ${relevantInTopK} relevant chunks. Best match at #${firstRelevantIdx + 1} (${Math.round(topSimilarity * 100)}%)`
          : wouldAnswer
            ? `Would answer but no chunks above threshold — risk of hallucination`
            : `Incorrectly refused (top similarity ${Math.round(topSimilarity * 100)}% < threshold ${Math.round(threshold * 100)}%)`,
      });
    }
  }

  const answerTests = suite.filter(tc => tc.expectedAction === 'answer').length;

  return {
    precisionAtK: answerTests > 0 ? Math.round((totalPrecision / answerTests) * 100) : 0,
    recallAtK: answerTests > 0 ? Math.round((totalRecall / answerTests) * 100) : 0,
    mrr: answerTests > 0 ? Math.round((totalRR / answerTests) * 100) / 100 : 0,
    ndcg: answerTests > 0 ? Math.round((totalNDCG / answerTests) * 100) / 100 : 0,
    refusalAccuracy: totalRefusalTests > 0 ? Math.round((correctRefusals / totalRefusalTests) * 100) : 100,
    totalTests: suite.length,
    passedTests: results.filter(r => r.passed).length,
    results,
  };
}
