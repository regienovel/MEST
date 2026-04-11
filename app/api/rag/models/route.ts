import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { getSavedModels, saveModel, deleteModel, getTeamConfig, type SavedModel } from '@/lib/rag-config';
import type { RagDocument } from '@/lib/rag';

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const models = await getSavedModels(team.id);
  return NextResponse.json({ models });
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string; name: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { action, name, description, modelId } = await req.json();

  if (action === 'save') {
    const config = await getTeamConfig(team.id);
    const docs = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];

    const model: SavedModel = {
      id: crypto.randomUUID(),
      teamId: team.id,
      teamName: team.name,
      name,
      description: description || '',
      config,
      documents: docs.map(d => ({ name: d.name, charCount: d.charCount, chunkCount: d.chunkCount })),
      totalChunks: docs.reduce((sum, d) => sum + d.chunkCount, 0),
      totalEmbeddings: docs.filter(d => d.embedded).reduce((sum, d) => sum + d.chunkCount, 0),
      createdAt: new Date().toISOString(),
      submitted: false,
    };

    await saveModel(model);
    return NextResponse.json({ ok: true, model });
  }

  if (action === 'delete') {
    await deleteModel(team.id, modelId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
