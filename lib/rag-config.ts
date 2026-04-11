import { storage } from './storage';

export interface RagConfig {
  chunkStrategy: 'paragraph' | 'fixed' | 'semantic';
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  enableReranking: boolean;
  rerankModel: 'claude-sonnet' | 'gpt-4o';
  strictThreshold: number;
  generationModel: 'gpt-4o' | 'claude-sonnet';
  systemPrompt: string;
  refusalMessage: string;
  temperature: number;
  citationStyle: 'inline' | 'footnote' | 'none';
}

export interface SavedModel {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  description: string;
  config: RagConfig;
  documents: Array<{ name: string; charCount: number; chunkCount: number }>;
  totalChunks: number;
  totalEmbeddings: number;
  createdAt: string;
  submitted: boolean;
  submittedAt?: string;
}

export const DEFAULT_CONFIG: RagConfig = {
  chunkStrategy: 'paragraph',
  chunkSize: 500,
  chunkOverlap: 50,
  topK: 5,
  enableReranking: true,
  rerankModel: 'claude-sonnet',
  strictThreshold: 0.15,
  generationModel: 'gpt-4o',
  systemPrompt: `You are an Air Canada customer service assistant. You answer questions about bereavement fares, refunds, and policies using ONLY the provided source documents. If the answer is not in the documents, say the refusal message. You always cite the document you are quoting from using the citation markers provided. Be helpful, concise, and honest about what you don't know.`,
  refusalMessage: "I don't know — this answer is not in the source documents. Please contact Air Canada customer service for assistance.",
  temperature: 0.2,
  citationStyle: 'inline',
};

export async function getTeamConfig(teamId: string): Promise<RagConfig> {
  const config = await storage.get<RagConfig>(`rag:config:${teamId}`);
  return config ? { ...DEFAULT_CONFIG, ...config } : { ...DEFAULT_CONFIG };
}

export async function saveTeamConfig(teamId: string, config: RagConfig): Promise<void> {
  await storage.set(`rag:config:${teamId}`, config);
}

export async function getSavedModels(teamId: string): Promise<SavedModel[]> {
  return (await storage.get<SavedModel[]>(`rag:models:${teamId}`)) || [];
}

export async function saveModel(model: SavedModel): Promise<void> {
  const models = await getSavedModels(model.teamId);
  models.push(model);
  await storage.set(`rag:models:${model.teamId}`, models);
}

export async function deleteModel(teamId: string, modelId: string): Promise<void> {
  const models = await getSavedModels(teamId);
  await storage.set(`rag:models:${teamId}`, models.filter(m => m.id !== modelId));
}

export async function submitModel(teamId: string, modelId: string, documents: unknown[]): Promise<void> {
  const models = await getSavedModels(teamId);
  const model = models.find(m => m.id === modelId);
  if (!model) throw new Error('Model not found');

  model.submitted = true;
  model.submittedAt = new Date().toISOString();
  await storage.set(`rag:models:${teamId}`, models);

  // Copy to global submissions with document content
  const submission = { ...model, documentData: documents };
  const submissions = (await storage.get<unknown[]>(`rag:submissions:all`)) || [];
  // Replace if same team+model already submitted
  const filtered = submissions.filter((s: unknown) => {
    const sub = s as { id: string; teamId: string };
    return !(sub.id === modelId && sub.teamId === teamId);
  });
  filtered.push(submission);
  await storage.set('rag:submissions:all', filtered);
}

export async function getAllSubmissions(): Promise<SavedModel[]> {
  return (await storage.get<SavedModel[]>('rag:submissions:all')) || [];
}
