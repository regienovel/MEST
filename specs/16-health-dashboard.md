# Spec 16 — Health Dashboard Module

## Purpose
A per-team operational health view showing latency, errors, and a public scorecard of the five trust properties. Demonstrates the "safe operation under adversarial prompts" and "traceable runs" engineering outcomes for Day 2.

## Route
`app/studio/health/page.tsx`

## UI Layout

### Top row: Four big stat cards
1. **Total requests today** (number, with sparkline of last 24h)
2. **Average latency** (ms, color-coded: green <1500, yellow 1500-3000, red >3000)
3. **Error rate** (%, color-coded: green <1%, yellow 1-5%, red >5%)
4. **Active modules** (Chat, Voice, Vision, Chain, RAG — list with green/red dots)

### Middle row: Trust Scorecard
A 5-column grid showing the five trust properties as cards. Each card has:
- Icon (use simple SVG)
- Property name (Honest Uncertainty / Source Citation / Context Fit / Recoverability / Adversarial Robustness)
- Status: green tick (✓), red X (✗), or grey dash (—) for "not yet tested"
- Last test timestamp
- A small "Test now" button that runs a quick automated check

This is the public scorecard that gets updated during the live demo session in the afternoon. When the trainer hands a Demo Driver an adversarial prompt and the system survives, the trainer (or admin) can mark the property green.

### Bottom row: Last 20 Calls Table
A scrollable table showing:
- Timestamp
- Module (Chat / Voice / Vision / Chain / RAG)
- Input summary (first 50 chars)
- Status (success / error)
- Latency (ms)
- Tokens used
- Cost ($)
- Expand button → shows full traceable run (input, all tool calls, intermediate outputs, final output, model versions used)

## API Routes

### `GET /api/health/metrics`
Returns aggregate metrics for the current team: total_requests_today, avg_latency, error_rate, active_modules, trust_scorecard, last_20_calls.

### `POST /api/health/scorecard`
Body: `{ property, status }`. Updates the trust scorecard. Admin-only or trainer override.

### `POST /api/health/test/:property`
Runs an automated test for a specific trust property and returns pass/fail.

## Library Code: `lib/health-metrics.ts`

```typescript
// Wrap any API route handler to automatically log metrics
export function withHealthMetrics<T>(
  handler: (req: Request) => Promise<T>,
  meta: { module: string }
): (req: Request) => Promise<T>

// Direct logging
export async function logCall(team: string, call: CallRecord): Promise<void>

// Aggregation
export async function getTeamMetrics(team: string): Promise<TeamMetrics>
```

## Storage Schema (Redis)
- `health:calls:<team>` — list of last 100 call records (LPUSH + LTRIM)
- `health:scorecard:<team>` — hash with 5 trust properties and their status
- `health:daily:<team>:<date>` — counters for daily request totals

## Success Criteria
1. Every existing API route logs to health metrics WITHOUT requiring rewrites (use middleware-style wrapper)
2. The trust scorecard is visible and updateable
3. Last 20 calls show full traceable run details on expand
4. Latency and error rate update in near-real-time (poll every 5s)
