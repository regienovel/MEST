import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('mest_session')?.value;

  if (sessionId) {
    await storage.delete(`session:${sessionId}`);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete('mest_session');
  res.cookies.delete('mest_team');
  res.cookies.delete('mest_admin');
  return res;
}
