# Frontend Style Guide — Mission Control Ecosystem

This guide defines the standards for building **embedded sub-application frontends** that integrate into Mission Control. Projects like **CSR Signer**, **PKI Admin**, and **OPC (OpenIDC Proxy / Distributor)** must follow these conventions so all tools look and feel like a single coherent platform.

## Core Principle: Shell vs Content

Mission Control is the **shell**. Embedded projects provide only the **content area** — no global layout, no duplicate sidebar, no separate theme system.

```
Mission Control Shell
├── Sidebar (navigation, including links to sub-apps)
├── Header (global context)
├── Status Bar
└── <main> content area  ← YOUR APP LIVES HERE
```

Sub-apps are registered as routes inside Mission Control's Next.js app, or served as iframes/micro-frontends that inherit the shell. Either way, they **never** render their own sidebar or header.

---

## Technology Stack

All sub-apps must use the same stack. No exceptions — consistency prevents dependency hell and keeps the bundle manageable.

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** | 16.x |
| UI Library | **React** | 19.x |
| Language | **TypeScript** | 5.7 |
| Styling | **Tailwind CSS** | v4 (CSS-first, no tailwind.config.js) |
| Component Library | **shadcn/ui** — New York style | latest |
| Primitive Components | **Radix UI** | (bundled with shadcn) |
| Icons | **Lucide React** | 0.564+ |
| Package Manager | **pnpm** | — |

### What NOT to use

- ❌ Material UI, Ant Design, Chakra, Mantine — conflicts with the design system
- ❌ Tailwind v3 — the token system relies on v4's `@theme inline` and `@import`
- ❌ CSS Modules — all styling goes through Tailwind utility classes
- ❌ Styled Components / Emotion — same reason
- ❌ npm or yarn — use pnpm only

---

## Design System

### Colour Palette — TokyoNight Cyberpunk

The palette is defined as CSS custom properties. Sub-apps **import the tokens file** directly rather than redefining values.

**Copy `globals.css` from Mission Control's `frontend/app/globals.css`** and import it in your app's global stylesheet.

#### Surface Layers (backgrounds)

| Token | Hex | Usage |
|---|---|---|
| `--surface-0` / `--background` | `#1a1b26` | Page background |
| `--surface-1` / `--card` | `#24283b` | Card / panel background |
| `--surface-2` / `--secondary` | `#292e42` | Hover state, nested surfaces |
| `--surface-3` / `--border` | `#414868` | Borders, dividers, separators |

#### Neon Accents

| Token | Hex | Tailwind Class | Semantic Meaning |
|---|---|---|---|
| `--neon-cyan` | `#7dcfff` | `text-neon-cyan` / `border-neon-cyan` | Primary highlight, active state |
| `--neon-blue` / `--primary` | `#7aa2f7` | `text-primary` | Interactive elements, links |
| `--neon-green` | `#9ece6a` | `text-neon-green` | Success, healthy, operational |
| `--neon-red` / `--destructive` | `#f7768e` | `text-neon-red` / `text-destructive` | Error, critical, failed |
| `--neon-yellow` | `#e0af68` | `text-neon-yellow` | Warning, unknown, pending |
| `--neon-magenta` | `#bb9af7` | `text-neon-magenta` | Secondary accent, PKI/crypto |
| `--neon-orange` | `#ff9e64` | `text-neon-orange` | Tertiary accent |

#### Status Colour Convention

This convention is **mandatory** across all projects:

```tsx
const STATUS_COLOR = {
  healthy:     'text-neon-green',   // operational, valid, active
  unhealthy:   'text-neon-red',     // error, expired, revoked
  unknown:     'text-neon-yellow',  // pending, checking, unknown
  info:        'text-primary',      // neutral information
  highlight:   'text-neon-cyan',    // selected, focused
  crypto:      'text-neon-magenta', // PKI / certificate specific
} as const
```

#### Text

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--foreground` | `#c0caf5` | `text-foreground` | Primary text |
| `--muted-foreground` | `#565f89` | `text-muted-foreground` | Labels, hints, secondary text |
