# 13 — Testing Plan

After Phase 9 (all features built), Phase 10 runs a comprehensive functional test. This spec tells you what to test and how.

## Testing Philosophy

This is a workshop platform, not production SaaS. The goal is: **will it survive 29 people using it for 6 hours tomorrow?**

Test for:
1. **Happy paths work** — every feature completes successfully for a typical input
2. **Obvious failures are handled** — bad inputs don't crash the app
3. **Streams complete** — no hanging streams, all connections close cleanly
4. **Rate limits protect the budget** — runaway costs are prevented
5. **The platform recovers from errors** — one bad API call doesn't break the session

Do NOT test for:
- Edge cases that a technical user wouldn't hit
- Load/stress testing beyond a few concurrent users
- Security beyond the basic password check
- Browser compatibility beyond modern Chrome/Safari/Firefox

## Test Script

Create `/scripts/test-endpoints.js` that runs automated tests against a local dev server. It should:

1. Start by checking the dev server is running at http://localhost:3000
2. Run each test in order
3. Log pass/fail for each
4. Exit with code 0 if all pass, 1 if any fail

```javascript
// /scripts/test-endpoints.js
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
      if (chunks > 100) break; // safety
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

  // Test 9: Vision endpoint with a tiny test image
  await test('Vision endpoint accepts image', async () => {
    // 1x1 red pixel JPEG
    const tinyImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHB8fHx8fHx8fHx//2wBDAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AD//Z';
    const res = await fetch(`${BASE}/api/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        images: [tinyImage],
        prompt: 'What color is this image?',
      }),
    });
    if (!res.ok) throw new Error(`Vision failed: ${res.status}`);
  });

  // Test 10: TTS endpoint
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

  // Test 11: Gallery endpoint
  await test('Gallery endpoint returns items array', async () => {
    const res = await fetch(`${BASE}/api/gallery`, {
      headers: { Cookie: sessionCookie || '' },
    });
    if (!res.ok) throw new Error(`Gallery failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('items is not an array');
  });

  // Test 12: Chain execution
  await test('Chain executor runs a simple chain', async () => {
    const res = await fetch(`${BASE}/api/chain/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        blocks: [
          { id: 'b1', type: 'input-text', config: { value: 'Tell me a 5-word greeting' } },
          { id: 'b2', type: 'process-chat-gpt', config: { prompt: '{{previous}}' } },
          { id: 'b3', type: 'output-text', config: { label: 'Greeting' } },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Chain run failed: ${res.status}`);
    const reader = res.body.getReader();
    let received = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += new TextDecoder().decode(value);
    }
    if (!received.includes('"status":"done"')) {
      throw new Error(`Chain did not complete: ${received.substring(0, 500)}`);
    }
  });

  // Test 13: Config endpoint
  await test('Config endpoint returns current config', async () => {
    const res = await fetch(`${BASE}/api/config`, {
      headers: { Cookie: sessionCookie || '' },
    });
    if (!res.ok) throw new Error(`Config failed: ${res.status}`);
    const data = await res.json();
    if (!data.enabledModules) throw new Error('Missing enabledModules');
  });

  // Test 14: Logout clears session
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
```

## Running the Tests

During Phase 10:

1. Ensure `.env.local` exists with real API keys
2. Start dev server in background: `npm run dev &`
3. Wait 5 seconds for server to be ready
4. Run: `node scripts/test-endpoints.js`
5. Capture output to `/test-results.json`
6. Kill dev server: `kill %1`
7. Write the test summary to `BUILD_STATUS.md`

If any test fails, do not commit. Debug and fix until all tests pass.

## Manual Verification Checklist

After automated tests pass, add this checklist to BUILD_STATUS.md for the operator to verify manually:

- [ ] Visit `/` and see the landing page in English
- [ ] Toggle to French and see translations
- [ ] Log in as Sankofa team
- [ ] Land on `/studio` and see the dashboard
- [ ] Click Chat Lab, send a message, get a response
- [ ] Toggle to Compare Mode, send a message, see both models respond
- [ ] Click Voice Lab, record a short message, hear it transcribed
- [ ] Click Vision Lab, upload any image, analyze it
- [ ] Click Chain Builder, load the "Two Minds" template, run it
- [ ] Save the chain, go to Gallery, see it appear
- [ ] Log in as admin with admin password, visit `/admin`
- [ ] See live usage stats update
- [ ] Broadcast a test message and see it appear on the Studio page
