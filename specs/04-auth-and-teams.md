# 04 — Auth and Teams

Simple, cookie-based team sessions. This is a workshop, not a bank. Security requirements are minimal.

## Auth Flow

1. User visits `/` (landing page)
2. User selects team from dropdown and enters team password
3. `POST /api/auth/login` validates credentials, creates a session, sets an `httpOnly` cookie
4. User is redirected to `/studio`
5. Middleware on `/studio/*` and `/admin/*` checks for a valid session cookie
6. Admin panel also requires an additional `admin=true` flag on the session, only set if the user provided `ADMIN_PASSWORD` during login

## Login Endpoint

`POST /api/auth/login`

Request:
```json
{
  "teamId": "sankofa",
  "password": "...",
  "adminPassword": "optional"
}
```

Response (success):
```json
{ "ok": true, "team": { "id": "sankofa", "name": "Sankofa", "xp": 0 }, "isAdmin": false }
```

Response (failure):
```json
{ "ok": false, "error": "Invalid team or password" }
```

On success:
- Create a session ID (crypto.randomUUID)
- Store `session:{id}` in storage with 24h expiry
- Set cookie `mest_session={id}`, httpOnly, sameSite=lax, path=/, maxAge=86400
- If admin password matches `process.env.ADMIN_PASSWORD`, also set cookie `mest_admin=1`

## Logout Endpoint

`POST /api/auth/logout`

- Reads session cookie
- Deletes `session:{id}` from storage
- Clears cookies
- Returns `{ ok: true }`

## Middleware

`/middleware.ts` at the project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('mest_session')?.value;
  const { pathname } = request.nextUrl;

  // Protect /studio/* and /admin/*
  if (pathname.startsWith('/studio') || pathname.startsWith('/admin')) {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Extra check for admin: require mest_admin cookie
  if (pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('mest_admin')?.value === '1';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/studio', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/admin/:path*'],
};
```

**Note:** Middleware cannot read the storage adapter (edge runtime limitations). It only checks if the cookie exists. Full session validation happens in API routes and server components.

## Getting Current Team in Server Components

Create `/lib/auth.ts`:

```typescript
import { cookies } from 'next/headers';
import { storage } from './storage';
import type { Session, Team } from './types';

export async function getCurrentTeam(): Promise<Team | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('mest_session')?.value;
  if (!sessionId) return null;

  const session = await storage.get<Session>(`session:${sessionId}`);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await storage.delete(`session:${sessionId}`);
    return null;
  }

  const team = await storage.get<Team>(`team:${session.teamId}`);
  if (!team || team.disabled) return null;

  return team;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('mest_admin')?.value === '1';
}

export async function requireTeam(): Promise<Team> {
  const team = await getCurrentTeam();
  if (!team) throw new Error('Unauthorized');
  return team;
}
```

## Landing Page Copy

The landing page (`app/page.tsx`) has:

### Hero section
- **Wordmark** (top-left)
- **Language toggle** (top-right)
- **Title** (font-serif, text-5xl): "MEST AI Studio" / "MEST AI Studio"
- **Subtitle** (text-lg, text-mest-grey-500):
  - EN: "A platform for building the AI products West Africa actually needs."
  - FR: "Une plateforme pour bâtir les produits IA dont l'Afrique de l'Ouest a vraiment besoin."
- **Tagline italic (font-serif italic, text-xl):**
  - EN: "Built for the MEST April 2026 cohort."
  - FR: "Conçu pour la cohorte MEST avril 2026."

### Login card (right side or centered on mobile)
- Team dropdown (populated from storage on server load)
- Password input
- "Sign in" button
- Small "Operator login" link that expands to reveal an admin password field

### Footer
- Small text: "Built in one night with Claude Code. — Imagine what you'll build."

## Session Security

- Sessions expire after 24 hours
- On logout, session is deleted from storage
- No password hashing — this is a workshop platform, teams share passwords, the threat model is "someone accidentally typing the wrong team name", not real attackers
- Admin password is checked against env var on every login attempt

## Admin Access

To access `/admin`, the operator must:
1. Log in as any team
2. Also provide the admin password during login
3. This sets both `mest_session` and `mest_admin` cookies

Alternatively, the operator can log in as a special `admin` team seeded with the admin password as its team password. This is a workshop convenience — do both. Add an `admin` team to the seed data.
