import { storage } from './storage';
import { embedBatch, chunkByFixedSize, type Chunk, type RagDocument } from './rag';
import { type RagConfig, type SavedModel, DEFAULT_CONFIG } from './rag-config';

interface ScenarioDoc {
  filename: string;
  type: string;
  description: string;
  content: string;
}

interface ScenarioDetailed {
  id: string;
  team: string;
  title: string;
  year: number;
  location: string;
  industry: string;
  headline: string;
  executive_summary: string;
  the_failure: {
    what_went_wrong: string;
    who_was_harmed: string;
    the_root_cause: string;
  };
  the_lesson: {
    trust_property_violated: string;
    rebuild_techniques: string[];
    why_it_matters_for_african_builders: string;
  };
  discussion_questions: string[];
  rag_documents: ScenarioDoc[];
}

// Map team names to team IDs
const TEAM_NAME_TO_ID: Record<string, string> = {
  'Ghana Jollof': 'ghana-jollof',
  'Waakye': 'waakye',
  'Thiéboudienne': 'thieboudienne',
  'Fufu & Light Soup': 'fufu',
  'Egusi Soup': 'egusi',
  'Kelewele': 'kelewele',
  'Attiéké': 'attieke',
  'Suya': 'suya',
  'Banku & Tilapia': 'banku',
  'Mafé': 'mafe',
  'Chinchinga': 'chinchinga',
};

export async function seedScenarioForTeam(
  teamId: string,
  teamName: string,
  scenario: ScenarioDetailed,
  forceReseed: boolean = false
): Promise<boolean> {
  // Check if already seeded (idempotent)
  const existingModels = (await storage.get<SavedModel[]>(`rag:models:${teamId}`)) || [];
  const hasStarter = existingModels.some(m => m.name.includes('Starter Model'));

  if (hasStarter && !forceReseed) {
    return false; // Already seeded
  }

  // If reseeding, remove old starter
  if (forceReseed && hasStarter) {
    const filtered = existingModels.filter(m => !m.name.includes('Starter Model'));
    await storage.set(`rag:models:${teamId}`, filtered);
  }

  // Create documents from scenario
  const ragDocs: RagDocument[] = [];

  for (const doc of scenario.rag_documents) {
    const docId = crypto.randomUUID();
    const chunkTexts = chunkByFixedSize(doc.content, 500, 50);
    const chunks: Chunk[] = chunkTexts.map((text, i) => ({
      id: `${docId}-chunk-${i}`,
      text,
      documentName: doc.filename,
      documentId: docId,
      index: i,
    }));

    ragDocs.push({
      id: docId,
      name: doc.filename,
      text: doc.content,
      charCount: doc.content.length,
      chunkCount: chunks.length,
      chunks,
      embedded: false,
    });
  }

  // Store documents
  await storage.set(`rag:docs:${teamId}`, ragDocs);

  // Embed all chunks
  try {
    for (let i = 0; i < ragDocs.length; i++) {
      const doc = ragDocs[i];
      const chunkTexts = doc.chunks.map(c => c.text);
      if (chunkTexts.length > 0) {
        const embeddings = await embedBatch(chunkTexts);
        doc.embeddings = embeddings;
        doc.embedded = true;
      }
    }
    await storage.set(`rag:docs:${teamId}`, ragDocs);
  } catch (err) {
    console.error(`[scenario-seed] Embedding failed for team ${teamId}:`, err);
    // Documents still stored, just not embedded yet
  }

  // Create scenario-specific system prompt
  const systemPrompt = `You are an AI assistant helping to analyse the "${scenario.title}" case (${scenario.year}, ${scenario.location}). Answer questions about this case using ONLY the provided source documents. If the answer is not in the documents, say the refusal message. Always cite which document you are referencing using inline brackets [1], [2], [3]. Be factual and precise.`;

  const refusalMessage = `I don't know — this answer is not in the source documents about the ${scenario.title} case. The available documents may not cover this aspect.`;

  // Create config
  const config: RagConfig = {
    ...DEFAULT_CONFIG,
    chunkStrategy: 'fixed',
    chunkSize: 500,
    chunkOverlap: 50,
    topK: 5,
    enableReranking: true,
    rerankModel: 'claude-sonnet',
    strictThreshold: 0.35,
    generationModel: 'gpt-4o',
    systemPrompt,
    refusalMessage,
    temperature: 0.2,
    citationStyle: 'inline',
  };

  // Save config
  await storage.set(`rag:config:${teamId}`, config);

  // Save as starter model
  const starterModel: SavedModel = {
    id: crypto.randomUUID(),
    teamId,
    teamName,
    name: `${scenario.title} — Starter Model`,
    description: `Pre-loaded scenario for Day 2: ${scenario.headline}. ${scenario.rag_documents.length} source documents included.`,
    config,
    documents: ragDocs.map(d => ({ name: d.name, charCount: d.charCount, chunkCount: d.chunkCount })),
    totalChunks: ragDocs.reduce((sum, d) => sum + d.chunkCount, 0),
    totalEmbeddings: ragDocs.filter(d => d.embedded).reduce((sum, d) => sum + d.chunkCount, 0),
    createdAt: new Date().toISOString(),
    submitted: false,
  };

  const models = (await storage.get<SavedModel[]>(`rag:models:${teamId}`)) || [];
  models.unshift(starterModel);
  await storage.set(`rag:models:${teamId}`, models);

  // Store scenario brief for the team
  await storage.set(`rag:scenario:${teamId}`, scenario);

  console.log(`[scenario-seed] Seeded scenario "${scenario.title}" for team ${teamId} (${teamName}): ${ragDocs.length} docs, ${ragDocs.reduce((s, d) => s + d.chunkCount, 0)} chunks`);

  return true;
}

export async function getTeamScenario(teamId: string): Promise<ScenarioDetailed | null> {
  return await storage.get<ScenarioDetailed>(`rag:scenario:${teamId}`);
}

export function getTeamIdFromName(teamName: string): string {
  return TEAM_NAME_TO_ID[teamName] || teamName.toLowerCase().replace(/\s+/g, '-');
}
