'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';
import { Wordmark } from '@/components/studio/wordmark';
import { LanguageToggle } from '@/components/studio/language-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { NativeSelect } from '@/components/ui/native-select';
import { LogOut, ArrowLeft, Star, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TeamUsage {
  id: string; name: string; xp: number; disabled: boolean;
  callsThisHour: number; costThisHour: number;
}

interface Stats {
  totalCallsToday: number; totalCostToday: string; topTeam: string; topModule: string;
}

interface GalleryItem {
  id: string; title: string; type: string; teamId: string; teamName: string;
  featured: boolean; createdAt: string; data: Record<string, unknown>;
}

export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamUsage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [ragSubmissions, setRagSubmissions] = useState<Array<{ id: string; teamId: string; teamName: string; name: string; description: string; config: Record<string, unknown>; submittedAt: string; documents: Array<{ name: string }> }>>([]);
  const [queryingModel, setQueryingModel] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState('');

  // Broadcast
  const [broadcastEn, setBroadcastEn] = useState('');
  const [broadcastFr, setBroadcastFr] = useState('');
  const [broadcastDuration, setBroadcastDuration] = useState('10');

  // Challenge
  const [challengeEn, setChallengeEn] = useState('');
  const [challengeFr, setChallengeFr] = useState('');

  // Modules
  const [modules, setModules] = useState({ chat: true, voice: true, vision: true, chain: true, gallery: true });

  // Rate limit
  const [rateLimit, setRateLimit] = useState(200);

  // New team
  const [newTeamId, setNewTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPw, setNewTeamPw] = useState('');

  const fetchData = useCallback(() => {
    fetch('/api/admin/usage').then(r => r.json()).then(d => {
      setTeams(d.teams || []);
      setStats(d.stats || null);
    }).catch(() => {});

    fetch('/api/gallery?sort=newest').then(r => r.json()).then(d => {
      setGalleryItems(d.items || []);
    }).catch(() => {});

    fetch('/api/admin/rag-models').then(r => r.json()).then(d => {
      setRagSubmissions(d.submissions || []);
    }).catch(() => {});

    fetch('/api/config').then(r => r.json()).then(d => {
      const config = d.config;
      if (config) {
        setChallengeEn(config.dailyChallenge?.en || '');
        setChallengeFr(config.dailyChallenge?.fr || '');
        setModules(config.enabledModules || modules);
        setRateLimit(config.rateLimitPerHour || 200);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  async function sendBroadcast() {
    await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: broadcastEn, fr: broadcastFr, durationMinutes: parseInt(broadcastDuration) }),
    });
    setBroadcastEn('');
    setBroadcastFr('');
  }

  async function clearBroadcast() {
    await fetch('/api/admin/broadcast', { method: 'DELETE' });
  }

  async function updateChallenge() {
    await fetch('/api/admin/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: challengeEn, fr: challengeFr }),
    });
  }

  async function updateModules(key: string, value: boolean) {
    const updated = { ...modules, [key]: value };
    setModules(updated);
    await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  }

  async function updateRateLimit() {
    await fetch('/api/admin/rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateLimitPerHour: rateLimit }),
    });
  }

  async function toggleTeam(id: string, disabled: boolean) {
    await fetch(`/api/admin/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !disabled }),
    });
    fetchData();
  }

  async function resetXp(id: string) {
    await fetch(`/api/admin/teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xp: 0 }),
    });
    fetchData();
  }

  async function addTeam() {
    if (!newTeamId || !newTeamName || !newTeamPw) return;
    await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newTeamId, name: newTeamName, password: newTeamPw }),
    });
    setNewTeamId('');
    setNewTeamName('');
    setNewTeamPw('');
    fetchData();
  }

  async function deleteTeam(id: string) {
    if (!confirm(t('admin.teams.confirmDelete'))) return;
    await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function runAdminQuery(submission: { config: Record<string, unknown>; documentData?: unknown[] }) {
    if (!queryInput.trim()) return;
    setQueryResult('Running...');
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryInput,
          strict: true,
          config: submission.config,
          teamDocsOverride: (submission as unknown as { documentData?: unknown[] }).documentData,
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) { setQueryResult('Error'); return; }
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) result += data.token;
            if (data.stage === 'generate' && data.status === 'done' && data.payload?.response) {
              result = data.payload.response as string;
            }
          } catch {}
        }
      }
      setQueryResult(result || 'No response');
    } catch {
      setQueryResult('Query failed');
    }
  }

  async function purgeRag(teamId: string) {
    if (!confirm(`Purge ALL RAG data for this team? Documents, chunks, and embeddings will be deleted.`)) return;
    await fetch('/api/admin/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    fetchData();
  }

  async function adminSetScore(teamId: string, property: string, status: string) {
    await fetch('/api/admin/scorecard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, property, status }),
    });
  }

  const [seedingScenarios, setSeedingScenarios] = useState(false);
  async function seedAllScenarios() {
    if (!confirm('Seed scenario starter models for all 11 teams? This will embed documents and may take 2-3 minutes.')) return;
    setSeedingScenarios(true);
    try {
      const res = await fetch('/api/admin/seed-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Scenarios seeded! ${JSON.stringify(data.results?.map((r: { team: string; seeded: boolean }) => `${r.team}: ${r.seeded ? 'seeded' : 'already exists'}`))}`);
      } else {
        alert(`Seeding failed: ${data.error}`);
      }
    } catch { alert('Seeding request failed'); }
    setSeedingScenarios(false);
    fetchData();
  }

  async function toggleFeatured(id: string) {
    await fetch(`/api/admin/gallery/${id}`, { method: 'POST' });
    fetchData();
  }

  async function deleteGalleryItem(id: string) {
    await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div className="min-h-screen bg-mest-paper">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 md:px-8 border-b border-mest-grey-300/60 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/studio" className="text-mest-grey-500 hover:text-mest-ink"><ArrowLeft size={20} /></Link>
          <Wordmark />
          <span className="text-sm font-semibold text-mest-rust ml-2">{t('admin.title')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut size={16} /></Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-8">
        {/* Quick Stats */}
        {stats && (
          <div>
            <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.quickStats')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t('admin.stats.calls')} value={String(stats.totalCallsToday)} />
              <StatCard label={t('admin.stats.cost')} value={`$${stats.totalCostToday}`} />
              <StatCard label={t('admin.stats.topTeam')} value={stats.topTeam} />
              <StatCard label={t('admin.stats.topModule')} value={stats.topModule} />
            </div>
          </div>
        )}

        {/* Live Usage */}
        <div>
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.liveUsage')}</h2>
          <div className="bg-white rounded-xl border border-mest-grey-300/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-mest-grey-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">{t('landing.login.team')}</th>
                  <th className="text-right px-4 py-2 font-medium">XP</th>
                  <th className="text-right px-4 py-2 font-medium">Calls/hr</th>
                  <th className="text-right px-4 py-2 font-medium">Cost/hr</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                  <th className="text-center px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className="border-t border-mest-grey-300/30">
                    <td className="px-4 py-2 font-medium">{team.name}</td>
                    <td className="px-4 py-2 text-right">{team.xp}</td>
                    <td className="px-4 py-2 text-right">{team.callsThisHour}</td>
                    <td className="px-4 py-2 text-right">${team.costThisHour.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${team.disabled ? 'bg-mest-rust-light text-mest-rust' : 'bg-mest-sage-light text-mest-sage'}`}>
                        {team.disabled ? '🔴 Disabled' : '🟢 Active'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleTeam(team.id, team.disabled)}>
                          {team.disabled ? 'Enable' : 'Disable'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resetXp(team.id)}>
                          {t('admin.teams.resetXp')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => purgeRag(team.id)} className="text-purple-600">
                          Purge RAG
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTeam(team.id)} className="text-mest-rust">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Scorecard — Admin controls */}
        <div className="bg-white rounded-xl border-2 border-mest-gold/40 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-2">Trust Scorecard</h2>
          <p className="text-sm text-mest-grey-500 mb-4">Set trust property scores for each team. Teams see these on their Health Dashboard (read-only).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-mest-grey-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Team</th>
                  <th className="text-center px-2 py-2 font-medium">Honest Uncertainty</th>
                  <th className="text-center px-2 py-2 font-medium">Source Citation</th>
                  <th className="text-center px-2 py-2 font-medium">Context Fit</th>
                  <th className="text-center px-2 py-2 font-medium">Recoverability</th>
                  <th className="text-center px-2 py-2 font-medium">Adversarial</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={`score-${team.id}`} className="border-t border-mest-grey-300/30">
                    <td className="px-3 py-2 font-medium">{team.name}</td>
                    {['honest_uncertainty', 'source_citation', 'context_fit', 'recoverability', 'adversarial_robustness'].map(prop => (
                      <td key={prop} className="px-2 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => adminSetScore(team.id, prop, 'pass')}
                            className="px-1.5 py-0.5 rounded bg-mest-sage/20 text-mest-sage hover:bg-mest-sage/40"
                          >✓</button>
                          <button
                            onClick={() => adminSetScore(team.id, prop, 'fail')}
                            className="px-1.5 py-0.5 rounded bg-mest-rust/20 text-mest-rust hover:bg-mest-rust/40"
                          >✗</button>
                          <button
                            onClick={() => adminSetScore(team.id, prop, 'untested')}
                            className="px-1.5 py-0.5 rounded bg-mest-grey-100 text-mest-grey-500 hover:bg-mest-grey-300/50"
                          >—</button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seed Scenarios */}
        <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl text-mest-ink">Scenario Seeding</h2>
              <p className="text-sm text-mest-grey-500 mt-1">Pre-load each team&apos;s RAG Lab with their assigned AI failure scenario, documents, and starter model.</p>
            </div>
            <Button
              onClick={seedAllScenarios}
              disabled={seedingScenarios}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {seedingScenarios ? <><Loader2 size={14} className="animate-spin" /> Seeding...</> : '🌱 Seed All Scenarios'}
            </Button>
          </div>
        </div>

        {/* Team Work */}
        {galleryItems.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-mest-ink mb-4">Team Work</h2>
            {(() => {
              // Group items by team
              const byTeam: Record<string, GalleryItem[]> = {};
              for (const item of galleryItems) {
                const key = item.teamName || 'Unknown';
                if (!byTeam[key]) byTeam[key] = [];
                byTeam[key].push(item);
              }
              return Object.entries(byTeam).map(([teamName, items]) => (
                <div key={teamName} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-mest-blue-light text-mest-blue text-sm font-semibold">
                      {teamName}
                    </span>
                    <span className="text-xs text-mest-grey-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    <div className="flex gap-1">
                      {items.some(i => i.type === 'chat') && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Chat</span>}
                      {items.some(i => i.type === 'voice') && <span className="text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">Voice</span>}
                      {items.some(i => i.type === 'vision') && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Vision</span>}
                      {items.some(i => i.type === 'chain') && <span className="text-xs bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">Chain</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map(item => (
                      <TeamWorkCard key={item.id} item={item} onFeature={() => toggleFeatured(item.id)} onDelete={() => deleteGalleryItem(item.id)} />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Submitted RAG Models */}
        {ragSubmissions.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
            <h2 className="font-serif text-xl text-mest-ink mb-4">Submitted RAG Models</h2>
            <div className="space-y-3">
              {ragSubmissions.map((sub, idx) => (
                <div key={`${sub.teamId}-${sub.id}-${idx}`} className="border border-mest-grey-300/60 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="px-2 py-0.5 bg-mest-blue-light text-mest-blue rounded-full text-xs font-semibold mr-2">{sub.teamName}</span>
                      <span className="font-medium text-mest-ink">{sub.name}</span>
                      {sub.description && <span className="text-xs text-mest-grey-500 ml-2">— {sub.description}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-mest-grey-300">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}</span>
                      <Button size="sm" variant="outline" onClick={() => { setQueryingModel(queryingModel === sub.id ? null : sub.id); setQueryResult(''); }} className="text-xs">
                        {queryingModel === sub.id ? 'Close' : 'Query'}
                      </Button>
                    </div>
                  </div>
                  {/* Config summary */}
                  {(() => {
                    const c = sub.config || {};
                    return (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">Model: {String(c.generationModel || 'gpt-4o')}</span>
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">Top-K: {String(c.topK || 5)}</span>
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">Threshold: {String(c.strictThreshold || 0.15)}</span>
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">Rerank: {String(c.enableReranking) === 'true' ? 'ON' : 'OFF'}</span>
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">Temp: {String(c.temperature || 0.2)}</span>
                        <span className="bg-mest-grey-100 px-2 py-0.5 rounded">{sub.documents?.length || 0} docs</span>
                      </div>
                    );
                  })()}
                  {/* System prompt preview */}
                  {!!sub.config?.systemPrompt && (
                    <div className="mt-2 bg-mest-grey-50 rounded p-2 text-xs text-mest-grey-700 max-h-20 overflow-y-auto font-mono">
                      {String(sub.config.systemPrompt).slice(0, 200)}{String(sub.config.systemPrompt).length > 200 ? '...' : ''}
                    </div>
                  )}
                  {/* Query interface */}
                  {queryingModel === sub.id && (
                    <div className="mt-3 border-t border-mest-grey-300/30 pt-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={queryInput}
                          onChange={e => setQueryInput(e.target.value)}
                          placeholder="Type a question to test this model..."
                          className="flex-1"
                          onKeyDown={e => e.key === 'Enter' && queryInput.trim() && runAdminQuery(sub)}
                        />
                        <Button
                          size="sm"
                          onClick={() => runAdminQuery(sub)}
                          disabled={!queryInput.trim()}
                          className="bg-mest-gold hover:bg-mest-gold/90 text-white"
                        >
                          Run
                        </Button>
                      </div>
                      {queryResult && (
                        <div className="bg-mest-grey-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                          {queryResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.broadcast.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('admin.broadcast.en')}</label>
              <Textarea value={broadcastEn} onChange={e => setBroadcastEn(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.broadcast.fr')}</label>
              <Textarea value={broadcastFr} onChange={e => setBroadcastFr(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <NativeSelect value={broadcastDuration} onChange={setBroadcastDuration} className="w-32">
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </NativeSelect>
            <Button onClick={sendBroadcast} className="bg-mest-blue hover:bg-mest-blue/90 text-white">
              {t('admin.broadcast.send')}
            </Button>
            <Button onClick={clearBroadcast} variant="outline">
              {t('admin.broadcast.clear')}
            </Button>
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.challenge.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={challengeEn} onChange={e => setChallengeEn(e.target.value)} placeholder="English" />
            <Input value={challengeFr} onChange={e => setChallengeFr(e.target.value)} placeholder="Français" />
          </div>
          <Button onClick={updateChallenge} className="mt-4 bg-mest-blue hover:bg-mest-blue/90 text-white">
            {t('admin.challenge.update')}
          </Button>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.modules.title')}</h2>
          <div className="flex flex-wrap gap-6">
            {Object.entries(modules).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Switch checked={enabled} onCheckedChange={(v) => updateModules(key, !!v)} />
                <span className="text-sm font-medium capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rate Limit */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.rateLimit')}</h2>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={rateLimit}
              onChange={e => setRateLimit(parseInt(e.target.value) || 200)}
              className="w-32"
            />
            <Button onClick={updateRateLimit} className="bg-mest-blue hover:bg-mest-blue/90 text-white">
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Add Team */}
        <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
          <h2 className="font-serif text-xl text-mest-ink mb-4">{t('admin.teams.add')}</h2>
          <div className="flex flex-wrap gap-3">
            <Input value={newTeamId} onChange={e => setNewTeamId(e.target.value)} placeholder="ID (slug)" className="w-36" />
            <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Name" className="w-36" />
            <Input value={newTeamPw} onChange={e => setNewTeamPw(e.target.value)} placeholder="Password" className="w-36" />
            <Button onClick={addTeam} className="bg-mest-blue hover:bg-mest-blue/90 text-white">
              {t('admin.teams.add')}
            </Button>
          </div>
        </div>

        {/* Gallery Moderation */}
        {galleryItems.length > 0 && (
          <div className="bg-white rounded-xl border border-mest-grey-300/60 p-6">
            <h2 className="font-serif text-xl text-mest-ink mb-4">Gallery Moderation</h2>
            <div className="space-y-2">
              {galleryItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-mest-grey-300/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-mest-grey-500">{item.type}</span>
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-mest-grey-300">{item.teamName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.featured ? 'default' : 'outline'}
                      onClick={() => toggleFeatured(item.id)}
                      className="gap-1"
                    >
                      <Star size={12} className={item.featured ? 'fill-current' : ''} />
                      {item.featured ? t('gallery.featured') : 'Feature'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGalleryItem(item.id)} className="text-mest-rust">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-mest-grey-300/60 p-4">
      <p className="text-xs text-mest-grey-500">{label}</p>
      <p className="text-2xl font-semibold text-mest-ink mt-1">{value}</p>
    </div>
  );
}

const TYPE_EMOJI: Record<string, string> = {
  chat: '💬', voice: '🎤', vision: '👁️', chain: '🔗',
};

const BLOCK_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  'input-text': { label: 'Text Input', emoji: '📝', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  'input-image': { label: 'Image Upload', emoji: '📸', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  'input-audio': { label: 'Audio Input', emoji: '🎤', color: 'bg-violet-50 border-violet-200 text-violet-800' },
  'process-chat-gpt': { label: 'Ask GPT-4o', emoji: '🤖', color: 'bg-green-50 border-green-200 text-green-800' },
  'process-chat-claude': { label: 'Ask Claude', emoji: '🧠', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  'process-transcribe': { label: 'Transcribe', emoji: '🎧', color: 'bg-sky-50 border-sky-200 text-sky-800' },
  'process-tts': { label: 'Generate Speech', emoji: '🔊', color: 'bg-pink-50 border-pink-200 text-pink-800' },
  'process-vision-gpt': { label: 'Vision (GPT)', emoji: '👁️', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  'process-vision-claude': { label: 'Vision (Claude)', emoji: '👁️', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  'process-translate': { label: 'Translate', emoji: '🌍', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
  'process-extract-json': { label: 'Extract JSON', emoji: '{ }', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  'process-summarize': { label: 'Summarize', emoji: '✂️', color: 'bg-teal-50 border-teal-200 text-teal-800' },
  'output-text': { label: 'Display Text', emoji: '📄', color: 'bg-slate-50 border-slate-200 text-slate-800' },
  'output-audio': { label: 'Play Audio', emoji: '🎵', color: 'bg-rose-50 border-rose-200 text-rose-800' },
  'output-image': { label: 'Display Image', emoji: '🖼️', color: 'bg-lime-50 border-lime-200 text-lime-800' },
};

function TeamWorkCard({ item, onFeature, onDelete }: { item: GalleryItem; onFeature: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const emoji = TYPE_EMOJI[item.type] || '📦';
  const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="bg-white rounded-xl border border-mest-grey-300/60 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-mest-grey-50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-mest-ink truncate">{item.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-mest-grey-500 capitalize">{item.type}</span>
            <span className="text-xs text-mest-grey-300">{timeStr}</span>
            {item.featured && <Star size={10} className="text-mest-gold fill-mest-gold" />}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onFeature(); }} className="p-1 hover:bg-mest-gold-light rounded" title="Toggle featured">
            <Star size={14} className={item.featured ? 'text-mest-gold fill-mest-gold' : 'text-mest-grey-300'} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-mest-rust-light rounded" title="Delete">
            <Trash2 size={14} className="text-mest-grey-300 hover:text-mest-rust" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-mest-grey-300/30 px-4 py-3">
          <AdminItemDetail item={item} />
        </div>
      )}
    </div>
  );
}

function AdminItemDetail({ item }: { item: GalleryItem }) {
  if (item.type === 'chain' && item.data?.blocks) {
    const blocks = item.data.blocks as Array<{ id: string; type: string; config: Record<string, unknown> }>;
    const outputs = (item.data.blockOutputs || {}) as Record<string, { status?: string; output?: unknown }>;
    return (
      <div className="space-y-1.5">
        {blocks.map((block, i) => {
          const info = BLOCK_LABELS[block.type] || { label: block.type, emoji: '⚙️', color: 'bg-gray-50 border-gray-200 text-gray-800' };
          const prompt = (block.config?.prompt || block.config?.value || '') as string;
          const result = outputs[block.id];
          const output = result?.output;
          return (
            <div key={i} className={`border rounded-lg px-3 py-2 text-xs ${info.color}`}>
              <div className="flex items-start gap-2">
                <span>{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">Step {i + 1}: {info.label}</span>
                  {!!block.config?.targetLanguage && <span className="ml-2 opacity-70">→ {String(block.config.targetLanguage)}</span>}
                  {!!block.config?.voice && <span className="ml-2 opacity-70">voice: {String(block.config.voice)}</span>}
                  {result?.status && <span className="ml-2">{result.status === 'done' ? '✅' : '❌'}</span>}
                  {prompt && <p className="mt-1 opacity-70 truncate">{prompt.length > 100 ? prompt.slice(0, 100) + '...' : prompt}</p>}
                  {output !== undefined && output !== null && output !== '' && typeof output === 'string' && !output.startsWith('data:') && (
                    <div className="mt-1.5 bg-white/70 rounded p-2 whitespace-pre-wrap max-h-24 overflow-y-auto">{output.length > 300 ? output.slice(0, 300) + '...' : output}</div>
                  )}
                  {typeof output === 'string' && output.startsWith('data:audio/') && (
                    <audio controls src={output} className="mt-1.5 w-full h-7" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (item.type === 'chat') {
    const messages = ((item.data?.messages || item.data?.gptMessages || []) as Array<{ role: string; content: string }>);
    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`rounded-lg px-3 py-2 text-xs ${msg.role === 'user' ? 'bg-mest-blue text-white ml-6' : 'bg-mest-grey-50 mr-6'}`}>
            <span className="font-semibold opacity-70">{msg.role === 'user' ? 'User' : '🤖 AI'}</span>
            <p className="mt-0.5 whitespace-pre-wrap">{msg.content?.length > 200 ? msg.content.slice(0, 200) + '...' : msg.content}</p>
          </div>
        ))}
      </div>
    );
  }

  if (item.type === 'voice') {
    return (
      <div className="space-y-2 text-xs">
        {!!item.data?.transcription && (
          <div className="bg-mest-teal-light rounded-lg p-2">
            <span className="font-semibold text-mest-teal">🎤 Transcription</span>
            {!!item.data?.detectedLang && <span className="ml-2 text-mest-teal opacity-70">({String(item.data.detectedLang)})</span>}
            <p className="mt-1">{String(item.data.transcription)}</p>
          </div>
        )}
        {!!item.data?.aiResponse && (
          <div className="bg-mest-grey-50 rounded-lg p-2">
            <span className="font-semibold">🤖 AI Response</span>
            <p className="mt-1 whitespace-pre-wrap">{typeof item.data.aiResponse === 'string' ? (item.data.aiResponse.length > 200 ? item.data.aiResponse.slice(0, 200) + '...' : item.data.aiResponse) : 'Compare mode'}</p>
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'vision') {
    return (
      <div className="space-y-2 text-xs">
        {!!item.data?.prompt && (
          <div className="bg-mest-gold-light rounded-lg p-2">
            <span className="font-semibold text-mest-gold">Prompt</span>
            <p className="mt-1">{String(item.data.prompt)}</p>
          </div>
        )}
        {!!item.data?.response && (
          <div className="bg-mest-grey-50 rounded-lg p-2">
            <span className="font-semibold">Response</span>
            <p className="mt-1 whitespace-pre-wrap">{typeof item.data.response === 'string' ? (item.data.response.length > 200 ? item.data.response.slice(0, 200) + '...' : item.data.response) : 'Compare mode'}</p>
          </div>
        )}
      </div>
    );
  }

  return <pre className="text-xs text-mest-grey-500">{JSON.stringify(item.data, null, 2)}</pre>;
}
