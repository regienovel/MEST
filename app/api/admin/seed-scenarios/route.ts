import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/seed';
import { isAdmin } from '@/lib/auth';
import { seedScenarioForTeam, getTeamIdFromName } from '@/lib/scenario-seed';

export const maxDuration = 300; // Seeding all teams takes time (embedding)

export async function POST(req: NextRequest) {
  await ensureSeeded();
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { teamId, force } = await req.json();

  try {
    // Load scenarios
    let scenarios: Array<{ id: string; team: string; [key: string]: unknown }>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@/seed/scenarios-detailed.json');
      scenarios = mod.default || mod;
      if (!Array.isArray(scenarios)) {
        // Try .scenarios property
        scenarios = (scenarios as unknown as { scenarios: typeof scenarios }).scenarios || [];
      }
    } catch {
      return NextResponse.json({ error: 'scenarios-detailed.json not found. Create it first.' }, { status: 404 });
    }

    if (teamId) {
      // Seed single team
      const scenario = scenarios.find(s => getTeamIdFromName(s.team) === teamId);
      if (!scenario) return NextResponse.json({ error: `No scenario found for team ${teamId}` }, { status: 404 });

      // Find team name from scenarios
      const seeded = await seedScenarioForTeam(teamId, scenario.team, scenario as never, !!force);
      return NextResponse.json({ ok: true, seeded, team: teamId });
    }

    // Seed all teams
    const results: Array<{ team: string; seeded: boolean }> = [];
    for (const scenario of scenarios) {
      const tid = getTeamIdFromName(scenario.team);
      try {
        const seeded = await seedScenarioForTeam(tid, scenario.team, scenario as never, !!force);
        results.push({ team: scenario.team, seeded });
      } catch (err) {
        console.error(`[seed-scenarios] Failed for ${scenario.team}:`, err);
        results.push({ team: scenario.team, seeded: false });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Seeding failed' }, { status: 500 });
  }
}
