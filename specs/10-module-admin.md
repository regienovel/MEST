# 10 — Module: Admin Panel

The operator's cockpit. Protected by admin password. This is where the facilitator monitors and controls the session in real time.

## Route

`/admin`

## Access Control

Requires both:
1. Valid team session (`mest_session` cookie)
2. Admin flag (`mest_admin` cookie)

The admin cookie is set when the user provides `ADMIN_PASSWORD` during login. See `04-auth-and-teams.md`.

## Features

### 1. Live Usage Dashboard
- Per-team grid showing:
  - Team name
  - Current XP
  - Calls made in the last hour
  - Estimated cost in the last hour (in USD)
  - Status indicator (active / idle / disabled)
  - Kill switch button (toggles `disabled` flag)

### 2. Daily Challenge Control
- Text fields (EN + FR) for the daily challenge banner
- "Update" button saves to config
- Preview of how it appears on Studio Home

### 3. Broadcast Message
- Text fields (EN + FR) for a message to show to all teams
- Duration selector (5, 10, 15 minutes)
- "Broadcast" button stores the message with an expiry
- "Clear" button removes any active broadcast
- Shows currently active broadcast if one exists

The broadcast message appears as a toast/banner on all `/studio/*` pages when present. Studio pages poll `/api/config` every 10 seconds to pick up new broadcasts.

### 4. Gallery Moderation
- List of all gallery items with a "Feature" / "Unfeature" toggle
- "Delete" button with confirmation
- Quick view of each item

### 5. Module Kill Switches
- Toggle switches for each module (Chat, Voice, Vision, Chain, Gallery)
- Turning off a module disables it in the Studio Home (greyed out card with "Temporarily disabled" message)
- Turning off mid-session stops new requests to that module's endpoints

### 6. Rate Limit Control
- Input field for `rateLimitPerHour`
- Applies to all teams
- Default: 200

### 7. Team Management
- List of teams with:
  - Edit button (change name, password)
  - Delete button (with confirmation)
  - Add new team button
- Reset XP button per team

### 8. Quick Stats
- Total API calls today
- Total estimated cost today
- Most active team
- Most active module

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [← Studio] MEST Admin Control                [Logout]  │
│                                                           │
│ ⚡ QUICK STATS                                           │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │ Calls  │ │ Cost   │ │ Top    │ │ Top    │           │
│ │ 342    │ │ $4.21  │ │ Team   │ │ Module │           │
│ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                           │
│ 📊 LIVE USAGE                                            │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Team    │ XP  │ Calls/hr │ Cost/hr │ Status       │ │
│ │ Sankofa │ 45  │ 23       │ $0.45   │ 🟢 Active    │ │
│ │ Baobab  │ 30  │ 12       │ $0.22   │ 🟢 Active    │ │
│ │ Kora    │ 60  │ 34       │ $0.67   │ 🟢 Active    │ │
│ │ ...                                                  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                           │
│ 📢 BROADCAST MESSAGE                                     │
│ [EN: ...] [FR: ...] [Duration: 10 min ▼] [Broadcast]   │
│                                                           │
│ 🎯 DAILY CHALLENGE                                       │
│ [EN: ...] [FR: ...]                       [Update]      │
│                                                           │
│ 🔧 MODULES                                               │
│ Chat [●] Voice [●] Vision [●] Chain [●] Gallery [●]    │
│                                                           │
│ 👥 TEAMS                           [+ Add Team]         │
│ [Team list with edit/delete...]                         │
│                                                           │
│ 🖼 GALLERY MODERATION                                    │
│ [Items with feature/delete actions...]                  │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### `GET /api/admin/usage`
Returns per-team usage data for the current hour.

### `POST /api/admin/broadcast`
```json
{ "en": "...", "fr": "...", "durationMinutes": 10 }
```

### `DELETE /api/admin/broadcast`
Clears the current broadcast.

### `POST /api/admin/challenge`
```json
{ "en": "...", "fr": "..." }
```

### `POST /api/admin/modules`
```json
{ "chat": true, "voice": true, "vision": true, "chain": false, "gallery": true }
```

### `POST /api/admin/rate-limit`
```json
{ "rateLimitPerHour": 300 }
```

### `POST /api/admin/teams`
Create team. Body: `{ id, name, password }`

### `PATCH /api/admin/teams/[id]`
Update team. Body: `{ name?, password?, disabled?, xp? }`

### `DELETE /api/admin/teams/[id]`
Delete team.

### `POST /api/admin/gallery/[id]/feature`
Toggle featured flag.

### `DELETE /api/admin/gallery/[id]`
Delete gallery item.

## All Admin Routes

All `/api/admin/*` routes must check `isAdmin()` helper before processing. Return 403 if not admin.

```typescript
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... rest of handler
}
```

## Cost Estimation

Track per-call costs in a simple table in `/lib/pricing.ts`:

```typescript
// Approximate costs per call (as of April 2026)
export const COSTS = {
  'gpt-4o-input': 0.0025 / 1000,       // per input token
  'gpt-4o-output': 0.01 / 1000,         // per output token
  'gpt-4o-image': 0.00765,              // per image
  'claude-sonnet-input': 0.003 / 1000,
  'claude-sonnet-output': 0.015 / 1000,
  'whisper': 0.006 / 60,                // per second
  'tts-1': 0.015 / 1000,                // per character
};
```

After each AI call, estimate the cost based on tokens used and record it in the usage tracker. This doesn't need to be precise — ballpark is fine for the admin dashboard.

## Success Criteria

- [ ] Admin can log in with admin password
- [ ] Non-admin users cannot access /admin (redirected)
- [ ] Live usage table shows all teams with current stats
- [ ] Admin can broadcast a message and it appears on team screens
- [ ] Admin can update daily challenge
- [ ] Admin can toggle modules on/off (and teams see the change)
- [ ] Admin can feature/unfeature gallery items
- [ ] Admin can create/edit/delete teams
- [ ] Admin can change rate limits on the fly
- [ ] All admin UI is bilingual
