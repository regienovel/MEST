'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark } from '@/components/studio/wordmark';
import { LanguageToggle } from '@/components/studio/language-toggle';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LandingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(d => setTeams(d.teams || []))
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password, adminPassword: adminPassword || undefined }),
      });
      const data = await res.json();

      if (data.ok) {
        router.push(data.isAdmin ? '/admin' : '/studio');
      } else {
        setError(t('landing.login.error'));
      }
    } catch {
      setError(t('landing.login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-mest-paper">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 md:px-8">
        <Wordmark />
        <LanguageToggle />
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 md:px-8 max-w-6xl mx-auto min-h-[calc(100vh-140px)]">
        {/* Hero */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <h1 className="font-serif text-5xl md:text-6xl text-mest-ink leading-tight">
            {t('landing.title')}
          </h1>
          <p className="text-lg text-mest-grey-500 max-w-lg">
            {t('landing.subtitle')}
          </p>
          <p className="font-serif italic text-xl text-mest-teal">
            {t('landing.tagline')}
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleLogin} className="bg-white rounded-xl border border-mest-grey-300/60 shadow-sm p-6 space-y-4">
            <h2 className="font-serif text-2xl text-mest-ink">
              {t('landing.login.title')}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="team">{t('landing.login.team')}</Label>
              <Select value={teamId} onValueChange={(v) => v && setTeamId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('landing.login.teamPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('landing.login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('landing.login.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {showAdmin && (
              <div className="space-y-2">
                <Label htmlFor="adminPassword">{t('landing.login.adminPassword')}</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-mest-rust">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-mest-blue hover:bg-mest-blue/90 text-white"
              disabled={loading || !teamId || !password}
            >
              {loading ? t('common.loading') : t('landing.login.button')}
            </Button>

            {!showAdmin && (
              <button
                type="button"
                onClick={() => setShowAdmin(true)}
                className="text-xs text-mest-grey-500 hover:text-mest-blue underline"
              >
                {t('landing.login.operator')}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-sm text-mest-grey-300">
        {t('landing.footer')}
      </div>
    </div>
  );
}
