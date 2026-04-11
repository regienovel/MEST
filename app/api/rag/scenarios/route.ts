import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scenarios = require('@/seed/scenarios-detailed.json');
    const data = Array.isArray(scenarios) ? scenarios : scenarios.default || [];
    return NextResponse.json({ scenarios: data });
  } catch {
    return NextResponse.json({ scenarios: [] });
  }
}
