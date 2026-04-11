import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import { getAllSubmissions } from '@/lib/rag-config';

export async function GET(req: NextRequest) {
  await ensureSeeded();
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const submissions = await getAllSubmissions();
  return NextResponse.json({ submissions });
}
