# Spec 17 — Versioning & Rollback

## Purpose
Every save (chain config, RAG config, prompts) creates an immutable versioned snapshot. One-click rollback to any prior version. Demonstrates the "rollback plan" engineering outcome for Day 2.

## Where It Appears
Versioning is added to existing modules:
- **Chain Builder**: every "Save" creates a new version of the chain
- **RAG Lab**: every chunking strategy change, every document set change creates a new version
- **System Prompts in Chat Lab**: presets can be versioned

## UI

### Version History Panel (slide-in from right)
Triggered by a "History" button next to the existing "Save" button. Shows:
- List of versions, newest first
- Each entry: version number, timestamp ("2 minutes ago"), team member who saved it (if known), brief diff summary ("Added 2 chunks", "Changed model to Claude")
- "Restore" button on each entry
- "Compare to current" button on each entry

### Restore Confirmation Modal
"You're about to restore version 3 (saved 12 minutes ago). Your current changes will be saved as version 7 first. Continue?"
- This is critical: rollback NEVER destroys the current state. It saves the current state as a new version, THEN restores the older one. This way nothing is ever lost.

## API Routes

### `GET /api/versions/:resourceType/:resourceId`
Returns the version history for a resource (e.g., chain or RAG config).

### `POST /api/versions/:resourceType/:resourceId/snapshot`
Creates a new version snapshot of the current state.

### `POST /api/versions/:resourceType/:resourceId/restore`
Body: `{ versionNumber }`. Saves current as new version, then restores the requested version.

## Library Code: `lib/versions.ts`

```typescript
export async function createSnapshot(
  team: string,
  resourceType: 'chain' | 'rag' | 'prompt',
  resourceId: string,
  state: any,
  diffSummary?: string
): Promise<Version>

export async function getVersions(
  team: string,
  resourceType: string,
  resourceId: string
): Promise<Version[]>

export async function restoreVersion(
  team: string,
  resourceType: string,
  resourceId: string,
  versionNumber: number
): Promise<{ restored: any; newVersionFromCurrent: Version }>

export function computeDiff(oldState: any, newState: any): string
```

## Storage Schema
- `versions:<team>:<resourceType>:<resourceId>` — list of version objects
- Each version: `{ versionNumber, timestamp, savedBy, state, diffSummary }`

## Success Criteria
1. Every save in Chain Builder and RAG Lab creates a version
2. History panel shows all versions with timestamps
3. Restore works without destroying current state (saves it first)
4. Diff summary is human-readable (not just "modified")
