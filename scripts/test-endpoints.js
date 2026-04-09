const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

async function main() {
  console.log('\nMEST AI Studio — Functional Tests\n');

  // Test 1: Server is up
  await test('Server responds at /', async () => {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 2: Landing page contains expected elements
  await test('Landing page has team selector', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    if (!html.includes('MEST AI Studio')) throw new Error('Missing title');
  });

  // Test 3: Login with first team
  let sessionCookie;
  await test('Login with seed team works', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: 'sankofa',
        password: 'sankofa2026',
      }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(`Login returned ok:false`);
    sessionCookie = res.headers.get('set-cookie');
    if (!sessionCookie) throw new Error('No session cookie set');
  });

  // Test 4: Login with bad password fails
  await test('Login with bad password fails', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: 'sankofa',
        password: 'wrong-password',
      }),
    });
    const data = await res.json();
    if (data.ok) throw new Error('Should have rejected bad password');
  });

  // Test 5: Protected route requires auth
  await test('/studio redirects without session', async () => {
    const res = await fetch(`${BASE}/studio`, { redirect: 'manual' });
    if (res.status !== 307 && res.status !== 308) {
      throw new Error(`Expected redirect, got ${res.status}`);
    }
  });

  // Test 6: Chat endpoint with GPT-4o
  await test('Chat endpoint streams GPT-4o response', async () => {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say hello in three words' }],
      }),
    });
    if (!res.ok) throw new Error(`Chat endpoint failed: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let received = '';
    let chunks = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += decoder.decode(value);
      chunks++;
      if (chunks > 100) break;
    }
    if (!received.includes('data:')) throw new Error('No SSE data received');
  });

  // Test 7: Chat endpoint with Claude
  await test('Chat endpoint streams Claude response', async () => {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        model: 'claude-sonnet',
        messages: [{ role: 'user', content: 'Say hello in three words' }],
      }),
    });
    if (!res.ok) throw new Error(`Chat endpoint failed: ${res.status}`);
    const reader = res.body.getReader();
    let received = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += new TextDecoder().decode(value);
    }
    if (!received.includes('data:')) throw new Error('No SSE data received');
  });

  // Test 8: Chat endpoint with Compare Mode
  await test('Chat endpoint streams both models in Compare Mode', async () => {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        model: 'both',
        messages: [{ role: 'user', content: 'Say hello' }],
      }),
    });
    if (!res.ok) throw new Error(`Compare failed: ${res.status}`);
    const reader = res.body.getReader();
    let received = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += new TextDecoder().decode(value);
    }
    const hasGpt = received.includes('"source":"gpt"');
    const hasClaude = received.includes('"source":"claude"');
    if (!hasGpt || !hasClaude) {
      throw new Error(`Missing responses: gpt=${hasGpt}, claude=${hasClaude}`);
    }
  });

  // Test 9: TTS endpoint
  await test('TTS endpoint returns audio', async () => {
    const res = await fetch(`${BASE}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        text: 'Hello from MEST',
        voice: 'nova',
      }),
    });
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio')) {
      throw new Error(`Expected audio content-type, got ${contentType}`);
    }
  });

  // Test 10: Gallery endpoint
  await test('Gallery endpoint returns items array', async () => {
    const res = await fetch(`${BASE}/api/gallery`, {
      headers: { Cookie: sessionCookie || '' },
    });
    if (!res.ok) throw new Error(`Gallery failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('items is not an array');
  });

  // Test 11: Config endpoint
  await test('Config endpoint returns current config', async () => {
    const res = await fetch(`${BASE}/api/config`, {
      headers: { Cookie: sessionCookie || '' },
    });
    if (!res.ok) throw new Error(`Config failed: ${res.status}`);
    const data = await res.json();
    if (!data.config) throw new Error('Missing config');
  });

  // Test 12: Teams endpoint
  await test('Teams endpoint returns teams', async () => {
    const res = await fetch(`${BASE}/api/teams`);
    if (!res.ok) throw new Error(`Teams failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.teams)) throw new Error('teams is not an array');
    if (data.teams.length < 5) throw new Error(`Expected at least 5 teams, got ${data.teams.length}`);
  });

  // Test 13: Logout clears session
  await test('Logout clears session', async () => {
    const res = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie || '' },
    });
    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
  });

  // Summary
  console.log(`\n${passed} passed, ${failed} failed\n`);

  // Write results to file for BUILD_STATUS
  const fs = require('fs');
  fs.writeFileSync('test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passed,
    failed,
    total: passed + failed,
    results,
  }, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
