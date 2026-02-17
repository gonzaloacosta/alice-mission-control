# Alice Mission Control — Design Specification
## Cyberpunk Dashboard UI

---

## 1. Color Tokens

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-root` | `#0a0a0f` | Page background |
| `--bg-surface` | `#12121a` | Cards, panels |
| `--bg-surface-hover` | `#1a1a26` | Hovered cards |
| `--bg-elevated` | `#1e1e2e` | Modals, dropdowns |
| `--bg-terminal` | `#0d0d14` | Terminal/code blocks |
| `--bg-sidebar` | `#0e0e16` | Sidebar navigation |
| `--bg-input` | `#14141e` | Input fields |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-default` | `#1e1e30` | Card borders, dividers |
| `--border-subtle` | `#161624` | Subtle separators |
| `--border-focus` | `#00f0ff` | Focused inputs, active states |
| `--border-glow` | `#00f0ff33` | Glow borders (with alpha) |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#e0e0ec` | Primary text |
| `--text-secondary` | `#8888a4` | Labels, descriptions |
| `--text-muted` | `#55556a` | Timestamps, metadata |
| `--text-inverse` | `#0a0a0f` | Text on bright backgrounds |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-cyan` | `#00f0ff` | Primary accent, links, focus rings |
| `--accent-magenta` | `#ff00aa` | Alerts, badges, secondary accent |
| `--accent-purple` | `#b44aff` | Highlights, tags |
| `--accent-green` | `#00ff88` | Success, online, active |
| `--accent-yellow` | `#ffcc00` | Warnings |
| `--accent-red` | `#ff3366` | Errors, destructive actions |
| `--accent-orange` | `#ff8800` | In-progress states |

### Glow Effects (box-shadow colors)
| Token | Hex | Usage |
|-------|-----|-------|
| `--glow-cyan` | `#00f0ff40` | Cyan glow |
| `--glow-magenta` | `#ff00aa30` | Magenta glow |
| `--glow-purple` | `#b44aff30` | Purple glow |

---

## 2. Typography

### Font Families
```css
--font-ui: 'Inter', 'Segoe UI', sans-serif;
--font-heading: 'Orbitron', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

**Google Fonts import:**
```
Inter:wght@400;500;600;700
Orbitron:wght@500;700;900
JetBrains+Mono:wght@400;500;700
```

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | `0.6875rem` (11px) | Badges, tiny labels |
| `--text-sm` | `0.8125rem` (13px) | Labels, metadata, sidebar items |
| `--text-base` | `0.9375rem` (15px) | Body text |
| `--text-lg` | `1.125rem` (18px) | Card titles |
| `--text-xl` | `1.5rem` (24px) | Section headings |
| `--text-2xl` | `2rem` (32px) | Page titles |
| `--text-mono` | `0.8125rem` (13px) | Terminal, code |

### Font Weights
```css
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-black: 900;  /* Orbitron headings only */
```

### Line Heights
```css
--leading-tight: 1.2;    /* Headings */
--leading-normal: 1.5;   /* Body */
--leading-relaxed: 1.7;  /* Terminal output */
```

### Letter Spacing
```css
--tracking-tight: -0.01em;   /* Large headings */
--tracking-normal: 0;         /* Body */
--tracking-wide: 0.05em;      /* Labels, badges (uppercase) */
--tracking-wider: 0.1em;      /* Orbitron headings */
```

---

## 3. Spacing Scale

```css
--space-1: 0.25rem;   /* 4px  */
--space-2: 0.5rem;    /* 8px  */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 4. Border Radius

```css
--radius-sm: 4px;     /* Badges, small elements */
--radius-md: 8px;     /* Cards, inputs, buttons */
--radius-lg: 12px;    /* Modals, large panels */
--radius-xl: 16px;    /* Feature cards */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 5. Shadows

```css
/* Subtle depth */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);

/* Card elevation */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);

/* Modal/dropdown */
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);

/* Cyan glow — primary interactive glow */
--shadow-glow-cyan: 0 0 12px #00f0ff40, 0 0 4px #00f0ff20;

/* Magenta glow — alerts, badges */
--shadow-glow-magenta: 0 0 12px #ff00aa30, 0 0 4px #ff00aa18;

/* Inset glow for focused inputs */
--shadow-inset-focus: inset 0 0 8px #00f0ff15;

/* Card hover glow */
--shadow-card-hover: 0 0 20px #00f0ff20, 0 4px 16px rgba(0, 0, 0, 0.5);
```

---

## 6. Transitions

```css
--transition-fast: 120ms ease-out;
--transition-default: 200ms ease-out;
--transition-slow: 350ms ease-in-out;
```

---

## 7. Component Specifications

### 7.1 Sidebar Navigation

**Layout:**
- Width: `260px` expanded, `64px` collapsed
- Position: fixed left, full height
- Background: `--bg-sidebar`
- Border-right: `1px solid var(--border-default)`
- Transition: width `--transition-slow`

**Nav Items:**
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font: var(--weight-medium) var(--text-sm) var(--font-ui);
  color: var(--text-secondary);
  transition: all var(--transition-default);
}
.nav-item:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: #00f0ff10;
  color: var(--accent-cyan);
  border-left: 2px solid var(--accent-cyan);
  box-shadow: var(--shadow-glow-cyan);
}
```

**Icons:** 20px, use Lucide or Phosphor icon set. Active icon inherits `--accent-cyan`.

**Collapse toggle:** Hamburger icon at top. In collapsed mode, show only icons centered, tooltip on hover.

**Sections:** Group items with uppercase `--text-xs` labels (`--text-muted`, `--tracking-wide`), separated by `--border-subtle` dividers.

### 7.2 Terminal Emulator

**Container:**
```css
.terminal {
  background: var(--bg-terminal);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  font: var(--weight-normal) var(--text-mono) / var(--leading-relaxed) var(--font-mono);
  overflow: hidden;
}
```

**Tab Bar:**
- Height: `36px`
- Background: `--bg-surface`
- Tabs: padding `var(--space-1) var(--space-3)`, `--text-xs`, `--text-secondary`
- Active tab: `--bg-terminal` background, `--text-primary`, top border `2px solid var(--accent-cyan)`
- Tab close button: `×` icon, visible on hover, 14px
- New tab `+` button at end

**Split Panes:**
- Divider: `2px solid var(--border-default)`, draggable
- Divider hover: `var(--accent-cyan)` with glow
- Support horizontal and vertical splits
- Min pane width: `200px`

**Terminal Content:**
- Padding: `var(--space-3) var(--space-4)`
- Prompt prefix: `--accent-cyan` for user, `--accent-green` for system
- Cursor: blinking block, `--accent-cyan`, `opacity` animation `1s steps(2) infinite`
- Selection: `--accent-cyan` at 20% opacity
- Scrollbar: `6px` wide, `--border-default` track, `--text-muted` thumb, `--radius-full`

**ANSI Color Mapping:**
```css
--ansi-black:   #1a1a26;
--ansi-red:     #ff3366;
--ansi-green:   #00ff88;
--ansi-yellow:  #ffcc00;
--ansi-blue:    #00f0ff;
--ansi-magenta: #ff00aa;
--ansi-cyan:    #00d4ff;
--ansi-white:   #e0e0ec;
```

### 7.3 Project Cards

**Card Container:**
```css
.project-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  transition: all var(--transition-default);
}
.project-card:hover {
  border-color: var(--accent-cyan);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
```

**Card Content (top to bottom):**
1. **Header row:** Project name (`--text-lg`, `--weight-semibold`, `--font-ui`) + status badge
2. **Description:** 2 lines max, `--text-sm`, `--text-secondary`, `text-overflow: ellipsis`
3. **Tags/Tech:** Pill badges (`--radius-full`, `--bg-elevated`, `--text-xs`, `--tracking-wide`)
4. **Metrics row:** Stars, commits, issues — `--text-xs`, `--text-muted`, icon + number
5. **Footer:** Last updated timestamp, contributor avatars (stacked circles, 24px)

**Status Badges:**
```css
.badge-active   { background: #00ff8818; color: var(--accent-green); }
.badge-paused   { background: #ffcc0018; color: var(--accent-yellow); }
.badge-error    { background: #ff336618; color: var(--accent-red); }
.badge-archived { background: #55556a18; color: var(--text-muted); }
```
All badges: `--text-xs`, `--weight-medium`, `--tracking-wide`, uppercase, padding `var(--space-1) var(--space-2)`, `--radius-full`.

**Status Indicator Dot:** `8px` circle before the project name. Color matches status. Pulse animation for active:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.status-dot.active { animation: pulse 2s ease-in-out infinite; }
```

### 7.4 Buttons

```css
/* Primary */
.btn-primary {
  background: var(--accent-cyan);
  color: var(--text-inverse);
  font: var(--weight-semibold) var(--text-sm) var(--font-ui);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: none;
  box-shadow: var(--shadow-glow-cyan);
  transition: all var(--transition-default);
}
.btn-primary:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 20px #00f0ff50;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}
.btn-ghost:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}
```

### 7.5 Inputs

```css
.input {
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font: var(--weight-normal) var(--text-sm) var(--font-ui);
  color: var(--text-primary);
  transition: border-color var(--transition-default), box-shadow var(--transition-default);
}
.input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: var(--shadow-inset-focus);
}
.input::placeholder {
  color: var(--text-muted);
}
```

---

## 8. Layout Patterns

### Dashboard Grid
```css
.dashboard {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.main-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
  padding: var(--space-6);
  align-content: start;
}
```

### Split Terminal Layout
```css
.terminal-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;  /* Divider handled by border */
}
.terminal-split.vertical {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr;
}
```

### Responsive Breakpoints
```css
--bp-sm: 640px;   /* Stack sidebar, single column cards */
--bp-md: 1024px;  /* Collapse sidebar, 2-col cards */
--bp-lg: 1440px;  /* Full layout */
--bp-xl: 1920px;  /* Wider cards, more columns */
```

**Mobile (< 640px):** Sidebar becomes bottom tab bar (5 icons max), cards single column, terminal full-width.

**Tablet (640–1024px):** Sidebar collapsed by default (icon-only), 2-column card grid.

**Desktop (1024+):** Full sidebar, auto-fill card grid, split terminal available.

---

## 9. Decorative / Cyberpunk Effects

**Use sparingly — these are accent effects, not defaults.**

### Scanline overlay (optional, on terminal only)
```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
}
```

### Gradient accent line (top of cards or header)
```css
.accent-line {
  height: 1px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-magenta), transparent);
}
```

### Text glow (headings only)
```css
.text-glow {
  text-shadow: 0 0 8px var(--glow-cyan);
}
```

---

## 10. Icon Set

Use **Lucide** (`lucide-react` or CDN). Consistent 24px grid, 1.5px stroke. Matches the clean-but-technical aesthetic.

Key icons:
- Navigation: `layout-dashboard`, `terminal`, `folder-kanban`, `settings`, `bell`
- Status: `circle-dot` (active), `pause-circle`, `alert-triangle`, `archive`
- Actions: `plus`, `chevron-right`, `external-link`, `copy`, `trash-2`

---

## 11. Z-Index Scale

```css
--z-base: 0;
--z-sidebar: 100;
--z-header: 200;
--z-dropdown: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-toast: 600;
--z-tooltip: 700;
```
