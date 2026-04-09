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
import { LogOut, ArrowLeft, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface TeamUsage {
  id: string; name: string; xp: number; disabled: boolean;
  callsThisHour: number; costThisHour: number;
}

interface Stats {
  totalCallsToday: number; totalCostToday: string; topTeam: string; topModule: string;
}

interface GalleryItem {
  id: string; title: string; type: string; teamName: string; featured: boolean;
}

export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamUsage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

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
