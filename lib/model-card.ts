import { storage } from './storage';

export interface ModelCard {
  // Section 1: Identity
  modelName: string;
  team: string;
  scenario: string;
  intendedUsers: string;
  intendedUseCase: string;
  // Section 2: What it does
  primaryFunction: string;
  exampleQueries: string;
  outOfScope: string;
  // Section 3: What it cannot do
  knownLimitations: string;
  failureModes: string;
  notSuitableFor: string;
  // Section 4: Trust properties
  trustHonestUncertainty: string;
  trustSourceCitation: string;
  trustContextFit: string;
  trustRecoverability: string;
  trustAdversarialRobustness: string;
  // Section 5: Accountability
  reviewer: string;
  reviewDate: string;
  versionHistory: string;
  // Section 6: Ethical considerations
  biasRisks: string;
  privacyConcerns: string;
  harmMitigation: string;
  // Linkage
  linkedModelId: string | null;
  linkedModelName?: string;
  // Status
  status: 'draft' | 'submitted';
  updatedAt: string;
  submittedAt?: string;
}

export const EMPTY_CARD: Omit<ModelCard, 'team' | 'updatedAt' | 'status'> = {
  modelName: '',
  scenario: '',
  intendedUsers: '',
  intendedUseCase: '',
  primaryFunction: '',
  exampleQueries: '',
  outOfScope: '',
  knownLimitations: '',
  failureModes: '',
  notSuitableFor: '',
  trustHonestUncertainty: '',
  trustSourceCitation: '',
  trustContextFit: '',
  trustRecoverability: '',
  trustAdversarialRobustness: '',
  reviewer: '',
  reviewDate: '',
  versionHistory: '',
  biasRisks: '',
  privacyConcerns: '',
  harmMitigation: '',
  linkedModelId: null,
};

export const REQUIRED_FIELDS: Array<keyof ModelCard> = [
  'modelName',
  'scenario',
  'intendedUsers',
  'intendedUseCase',
  'primaryFunction',
  'exampleQueries',
  'outOfScope',
  'knownLimitations',
  'failureModes',
  'notSuitableFor',
  'trustHonestUncertainty',
  'trustSourceCitation',
  'trustContextFit',
  'trustRecoverability',
  'trustAdversarialRobustness',
  'reviewer',
  'reviewDate',
  'biasRisks',
  'privacyConcerns',
  'harmMitigation',
];

export const TRUST_FIELDS: Array<keyof ModelCard> = [
  'trustHonestUncertainty',
  'trustSourceCitation',
  'trustContextFit',
  'trustRecoverability',
  'trustAdversarialRobustness',
];

export function completenessScore(card: ModelCard | null): number {
  if (!card) return 0;
  const filled = REQUIRED_FIELDS.filter(k => {
    const v = card[k];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function trustPropertiesCount(card: ModelCard | null): number {
  if (!card) return 0;
  return TRUST_FIELDS.filter(k => {
    const v = card[k];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
}

export async function getDraft(teamId: string): Promise<ModelCard | null> {
  return await storage.get<ModelCard>(`rag:modelcard:draft:${teamId}`);
}

export async function saveDraft(teamId: string, teamName: string, card: Partial<ModelCard>): Promise<ModelCard> {
  const existing = (await getDraft(teamId)) || ({} as ModelCard);
  const merged: ModelCard = {
    ...EMPTY_CARD,
    ...existing,
    ...card,
    team: teamName,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
  await storage.set(`rag:modelcard:draft:${teamId}`, merged);
  return merged;
}

export async function getSubmitted(teamId: string): Promise<ModelCard | null> {
  return await storage.get<ModelCard>(`rag:modelcard:submitted:${teamId}`);
}

export async function submitCard(teamId: string, teamName: string, card: Partial<ModelCard>): Promise<ModelCard> {
  const draft = (await getDraft(teamId)) || ({} as ModelCard);
  const now = new Date().toISOString();
  const submitted: ModelCard = {
    ...EMPTY_CARD,
    ...draft,
    ...card,
    team: teamName,
    status: 'submitted',
    updatedAt: now,
    submittedAt: now,
  };
  await storage.set(`rag:modelcard:submitted:${teamId}`, submitted);
  await storage.set(`rag:modelcard:draft:${teamId}`, submitted);
  return submitted;
}

export async function getAllSubmittedCards(): Promise<Array<{ teamId: string; card: ModelCard }>> {
  const keys = await storage.list('rag:modelcard:submitted:');
  const out: Array<{ teamId: string; card: ModelCard }> = [];
  for (const key of keys) {
    const card = await storage.get<ModelCard>(key);
    if (card) {
      const teamId = key.replace('rag:modelcard:submitted:', '');
      out.push({ teamId, card });
    }
  }
  return out;
}
