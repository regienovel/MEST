# 09 — Module: Gallery

Cross-team showcase. Where teams see each other's work, get inspired, and fork chains to build faster. Creates competitive energy and cross-pollination without requiring Slack or Miro.

## Route

`/studio/gallery`

## Features

### 1. Grid View
- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Each item is a card showing:
  - Icon for item type (MessageSquare for chat, Mic for voice, Eye for vision, Workflow for chain)
  - Title (font-serif, truncate to 2 lines)
  - Team name badge (colored by team)
  - Relative timestamp (e.g., "5 min ago" / "il y a 5 min")
  - View count (small, muted)
  - Fork count (small, muted — only shown if > 0)
  - "Featured" star if item.featured is true

### 2. Filters
Top bar with filter chips:
- **All** (default)
- **Chat** | **Voice** | **Vision** | **Chains** (by type)
- **All teams** (default) | dropdown of each team
- **Sort:** Newest | Most viewed | Most forked | Featured

### 3. Item Detail View
- Click a card to open a modal (or navigate to `/studio/gallery/[id]`)
- Shows full content:
  - **Chat items:** Full conversation
  - **Voice items:** Audio player + transcription + response audio
  - **Vision items:** Images + prompt + response
  - **Chain items:** Visual block list + last execution result
- Action buttons:
  - **Fork** (for chains — clones to current team's workspace)
  - **Copy content** (for chats — copies to clipboard)
  - **Close**

### 4. Featured Section
- At the top of the gallery, a horizontal scrollable row labeled "Featured" / "En vedette"
- Shows items marked as featured by the admin
- Larger cards (slightly) with a gold star icon

### 5. Empty State
When no items exist yet:
- Large empty state card with serif title "Nothing here yet" / "Rien ici pour le moment"
- Subtitle: "Be the first team to save something!" / "Soyez la première équipe à sauvegarder quelque chose !"

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ [← Studio]  Gallery                                  │
│                                                       │
│ [All] [Chat] [Voice] [Vision] [Chains]             │
│ [All teams ▼]              [Sort: Newest ▼]        │
│                                                       │
│ ⭐ FEATURED                                          │
│ ┌────┐ ┌────┐ ┌────┐                               │
│ │    │ │    │ │    │                               │
│ └────┘ └────┘ └────┘                               │
│                                                       │
│ ─────────────────────────────────────────────────  │
│                                                       │
│ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │ 💬   │ │ 🎤   │ │ 🔗   │                        │
│ │ Chat │ │ Voice│ │ Chain│                        │
│ │Title │ │Title │ │Title │                        │
│ │Team 1│ │Team 2│ │Team 3│                        │
│ │5 min │ │8 min │ │12 min│                        │
│ │👁 12 │ │👁 8  │ │👁 5  │                        │
│ └──────┘ └──────┘ └──────┘                        │
│                                                       │
│ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │ ...  │ │ ...  │ │ ...  │                        │
│ └──────┘ └──────┘ └──────┘                        │
└─────────────────────────────────────────────────────┘
```

## API Endpoints

### `GET /api/gallery`

Query params:
- `type` — filter by item type (optional)
- `teamId` — filter by team (optional)
- `sort` — `newest` | `views` | `forks` | `featured` (default: newest)

Response:
```json
{
  "items": [
    {
      "id": "...",
      "teamId": "sankofa",
      "teamName": "Sankofa",
      "type": "chat",
      "title": "Market pricing analysis",
      "createdAt": "2025-04-09T10:30:00Z",
      "views": 12,
      "forks": 2,
      "featured": false
    }
  ],
  "total": 23
}
```

### `GET /api/gallery/[id]`

Returns full item including `data` payload.

On successful read, increments `views` counter.

### `POST /api/gallery/[id]/fork`

For chain items only. Creates a new chain for the current team based on this one. Increments the original's `forks` counter and awards +5 XP to the original team.

Response: `{ ok: true, newChainId: "..." }`

## Real-time Updates

The Gallery page should auto-refresh every 10 seconds to show new items from other teams. Use a simple `setInterval` with `useEffect` cleanup. Do not use WebSockets — polling is simpler and fine for this scale.

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 10000);
  return () => clearInterval(interval);
}, []);
```

## Success Criteria

- [ ] Gallery displays all saved items in a grid
- [ ] Filters by type and team work
- [ ] Sorting works
- [ ] Clicking an item opens a detail view with full content
- [ ] Chain items can be forked to the current team's workspace
- [ ] Featured items appear in a highlighted row
- [ ] Empty state shows when no items exist
- [ ] Auto-refresh works (new items appear without manual reload)
- [ ] View counter increments on detail view
- [ ] All UI strings are bilingual
