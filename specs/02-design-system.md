# 02 — Design System

The platform must feel like a real, polished product — not a hackathon demo. First impressions set what learners believe they can build.

## Aesthetic Direction

**Editorial-tech meets African-contemporary.** Confident, warm, grown-up. Think: an AI studio that takes its users seriously. Avoid: purple gradients, cliché "neural network" visuals, anything that looks like a Silicon Valley SaaS wireframe.

**Inspiration:** Vercel's marketing site meets a well-designed African fintech (think Chipper Cash, Flutterwave at their best). Clean structure, confident typography, restrained color with high-impact accent moments.

## Color Tokens

Add these to `tailwind.config.ts` as CSS variables, referenced through Tailwind's theme extension:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      mest: {
        ink: '#1A1A1A',          // Primary text
        paper: '#FAF9F6',        // Warm off-white background
        blue: '#1B4F72',         // Primary brand (deep, confident)
        'blue-light': '#EAF2F8', // Subtle blue backgrounds
        teal: '#0E6B5C',         // Secondary brand (grounded, African)
        'teal-light': '#E8F5F2',
        gold: '#B8860B',         // Accent (use sparingly, for highlights)
        'gold-light': '#FDF6E3',
        rust: '#922B21',         // Error/warning (warm red, not harsh)
        'rust-light': '#FDEDEC',
        sage: '#5D8B7F',         // Success (muted green)
        'sage-light': '#E8F0ED',
        grey: {
          900: '#1A1A1A',
          700: '#424949',
          500: '#7B7D7D',
          300: '#BDC3C7',
          100: '#F4F6F7',
          50: '#FAFBFC',
        },
      },
    },
  },
},
```

Also set CSS variables in `app/globals.css` so components can use them:

```css
@layer base {
  :root {
    --mest-ink: 26 26 26;
    --mest-paper: 250 249 246;
    --mest-blue: 27 79 114;
    --mest-teal: 14 107 92;
    --mest-gold: 184 134 11;
    --mest-rust: 146 43 33;
    --mest-sage: 93 139 127;
  }

  html {
    background-color: rgb(var(--mest-paper));
    color: rgb(var(--mest-ink));
  }
}
```

## Typography

Use **Inter** for UI (loaded via next/font) and **Instrument Serif** for display moments (hero headlines, module card titles).

```typescript
// app/layout.tsx
import { Inter, Instrument_Serif } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

// In <html> tag:
<html className={`${inter.variable} ${instrumentSerif.variable}`}>
```

Add to Tailwind config:
```typescript
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-serif)', 'Georgia', 'serif'],
},
```

**Usage rules:**
- Body text, buttons, labels: `font-sans` (Inter)
- Page hero titles, module card titles, empty state headlines: `font-serif` (Instrument Serif)
- Never mix more than two weights in one component

## Spacing & Layout

- Base unit: 4px (Tailwind default)
- Generous whitespace. Prefer `p-6` over `p-4` for cards. `gap-6` over `gap-4` for grids.
- Max content width: `max-w-6xl` (1152px) for main content, `max-w-7xl` (1280px) for dashboard layouts
- Mobile padding: `px-4` / Desktop: `px-8`
- Vertical rhythm: `space-y-6` between major sections

## Component Patterns

### Buttons
- Primary: `bg-mest-blue text-white hover:bg-mest-blue/90`
- Secondary: `border border-mest-grey-300 bg-white hover:bg-mest-grey-100`
- Accent (use sparingly for "hero" CTAs like "Run Chain"): `bg-mest-gold text-white hover:bg-mest-gold/90`
- Destructive: `bg-mest-rust text-white hover:bg-mest-rust/90`

### Cards
- Default: `bg-white rounded-xl border border-mest-grey-300/60 shadow-sm`
- Interactive cards (clickable): add `hover:shadow-md hover:border-mest-blue/40 transition-all cursor-pointer`
- Empty state cards: `bg-mest-paper border-dashed border-2 border-mest-grey-300`

### Inputs
- Default: `border border-mest-grey-300 rounded-lg focus:border-mest-blue focus:ring-2 focus:ring-mest-blue/20`
- Use shadcn/ui's Input component as base, restyle with the above classes

### Module Cards (Studio Home)
Each module card is a clickable tile with:
- A large icon (lucide-react, 32px)
- Title in `font-serif text-2xl`
- One-line description in `text-sm text-mest-grey-500`
- Hover lift effect (`hover:-translate-y-1 transition-transform`)
- Different accent colors per module:
  - Chat Lab: `border-l-4 border-mest-blue`
  - Voice Lab: `border-l-4 border-mest-teal`
  - Vision Lab: `border-l-4 border-mest-gold`
  - Chain Builder: `border-l-4 border-mest-rust`
  - Gallery: `border-l-4 border-mest-sage`

### Navigation (Top Bar)
Persistent across all `/studio/*` routes:
- Left: MEST wordmark + current module name
- Center: none (keep it simple)
- Right: Team name badge → XP counter → Language toggle (EN/FR) → Logout

### Loading States
Never use spinners alone. Always pair with a message:
- EN: "Thinking..." / "Analyzing image..." / "Transcribing..." / "Generating speech..."
- FR: "Réflexion en cours..." / "Analyse de l'image..." / "Transcription..." / "Génération de la voix..."

Use a subtle pulse animation on a dot (`animate-pulse`).

## Iconography (lucide-react)

Standard icons across the app:
- Chat Lab: `MessageSquare`
- Voice Lab: `Mic`
- Vision Lab: `Eye`
- Chain Builder: `Workflow`
- Gallery: `LayoutGrid`
- Admin: `Shield`
- Language toggle: `Languages`
- Logout: `LogOut`
- Save: `Save`
- Run: `Play`
- Fork: `GitFork`
- Team/XP: `Trophy`

Use `size={20}` for inline icons, `size={32}` for module cards, `size={16}` for button icons.

## Animations

Keep them subtle and purposeful:
- **Page transitions:** None (instant is fine)
- **Card hover:** `hover:-translate-y-1 transition-transform duration-200`
- **Button press:** Default shadcn button press animation
- **Loading pulse:** `animate-pulse` on loading indicators
- **Streaming text:** Characters appear as they arrive (no fake typewriter effect — let real streaming do the work)
- **New gallery item:** Fade in with `animate-in fade-in duration-500` when new items arrive

**Never** use: bounces, elastic effects, long durations (>400ms), parallax, or anything that looks like a portfolio site.

## Accessibility

- All interactive elements: min 44x44px touch target
- All icons with actions: aria-label
- All images: alt text (empty `alt=""` for decorative)
- Color contrast: WCAG AA minimum
- Keyboard navigation: Tab order must be logical
- Focus rings: visible and styled (use Tailwind's default `focus-visible:ring-2`)

## Logo / Wordmark

No time to design a logo. Use typography:

```tsx
<div className="flex items-center gap-2">
  <div className="w-8 h-8 rounded-lg bg-mest-blue flex items-center justify-center">
    <span className="text-white font-serif text-xl">M</span>
  </div>
  <div className="font-serif text-xl text-mest-ink">
    MEST<span className="text-mest-gold">.</span>Studio
  </div>
</div>
```

Use this component as `<Wordmark />` from `components/studio/wordmark.tsx`.
