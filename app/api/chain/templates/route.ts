import { NextResponse } from 'next/server';
import templatesSeed from '@/seed/templates.json';

export async function GET() {
  // Read directly from seed file — works on Vercel without storage
  return NextResponse.json({ templates: templatesSeed.templates });
}
