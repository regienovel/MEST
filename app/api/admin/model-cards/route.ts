import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import { getAllSubmittedCards, completenessScore, trustPropertiesCount } from '@/lib/model-card';

export async function GET(_req: NextRequest) {
  await ensureSeeded();
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const all = await getAllSubmittedCards();
  const cards = all.map(({ teamId, card }) => ({
    teamId,
    teamName: card.team,
    modelName: card.modelName,
    linkedModelId: card.linkedModelId,
    linkedModelName: card.linkedModelName,
    submittedAt: card.submittedAt,
    completeness: completenessScore(card),
    trustCount: trustPropertiesCount(card),
    card,
  }));

  return NextResponse.json({ cards });
}
