# SKILL.md — Enterprise Attendance Management Platform
## UI/UX Engineering Skill Guide

> **Purpose**: This skill file governs all frontend UI/UX implementation decisions for the Enterprise Attendance Management Platform. Every component, page, animation, and interaction must align with this guide to ensure a cohesive, premium, and accessible experience across both **Light** and **Dark** modes.

---

## 1. Skill Activation Rules

Use this skill when:
- Building or modifying **any Angular component** in the project
- Creating **new UI pages** (dashboards, reports, modals, forms)
- Implementing **dark/light mode** theming
- Designing **data tables**, **charts**, or **attendance cards**
- Writing **Tailwind CSS** utility class combinations
- Adding **animations**, **transitions**, or **micro-interactions**
- Designing **badges**, **status indicators**, or **semantic labels**
- Refactoring UI for **accessibility (a11y)** or **performance**

Do NOT use this skill for:
- Pure backend API logic (refer to `ENTERPRISE_ARCHITECTURE.md`)
- Database schema changes
- JWT / OAuth2 security configurations

---

## 2. Core Design Philosophy

### 2.1 Aesthetic Direction: **"Precision Glassmorphism"**
The application follows a **Premium Enterprise Glassmorphic** aesthetic — refined, data-dense, and visually calm. Every surface should feel like it belongs in a world-class SaaS product. Think Notion meets Linear meets enterprise HRMS.

**Key Principles:**
- **Clarity over decoration** — UI serves data, not the other way around
- **Depth without noise** — Glass panels add dimension, not distraction
- **Semantic color** — Every color choice carries meaning (status, priority, action)
- **Micro-motion with purpose** — Animations guide attention, never demand it
- **Adaptive by default** — Every component must work flawlessly in both modes

---

## 3. Theming System

### 3.1 Theme Modes
The application supports **class-based dark mode** via Tailwind CSS.
```html
<!-- Light mode: no class on <html> -->
<html class="">

<!-- Dark mode: add 'dark' class on <html> -->
<html class="dark">
```

Always use Tailwind's `dark:` prefix alongside the base class. Never hard-code colors.

### 3.2 Color Palette Reference

#### Primary Brand — Deep Navy Blue
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `primary-50` | `#eef2ff` | `#1e293b` | Subtle backgrounds |
| `primary-100` | `#dbeafe` | `#1f3a5f` | Card borders |
| `primary-500` | `#1f3a5f` | `#3b82f6` | Brand primary |
| `primary-700` | `#1e3a8a` | `#60a5fa` | Hover states |
| `primary-950` | `#0f1f3d` | `#bfdbfe` | Dark headings |

#### Accent — Vibrant Teal
| Token | Hex | Usage |
|---|---|---|
| `accent-DEFAULT` | `#1f7a6b` | CTAs, success states, active nav |
| `accent-light` | `#2dd4bf` | Hover on dark backgrounds |
| `accent-subtle` | `#f0fdf9` | Badge backgrounds (light mode) |

#### Status Semantic Colors
| Status | Background | Text | Border |
|---|---|---|---|
| WFO | `bg-blue-50 dark:bg-blue-900/20` | `text-blue-700 dark:text-blue-300` | `border-blue-200 dark:border-blue-700` |
| WFH | `bg-violet-50 dark:bg-violet-900/20` | `text-violet-700 dark:text-violet-300` | `border-violet-200 dark:border-violet-700` |
| Leave | `bg-amber-50 dark:bg-amber-900/20` | `text-amber-700 dark:text-amber-300` | `border-amber-200 dark:border-amber-700` |
| Absent | `bg-red-50 dark:bg-red-900/20` | `text-red-700 dark:text-red-300` | `border-red-200 dark:border-red-700` |
| Holiday | `bg-emerald-50 dark:bg-emerald-900/20` | `text-emerald-700 dark:text-emerald-300` | `border-emerald-200 dark:border-emerald-700` |

### 3.3 Surface Hierarchy (Z-Layers)
```
Layer 0 (Base):    bg-slate-50  dark:bg-slate-950       ← Page background
Layer 1 (Surface): bg-white     dark:bg-slate-900        ← Cards, panels
Layer 2 (Raised):  bg-white     dark:bg-slate-800        ← Modals, dropdowns
Layer 3 (Overlay): bg-white/80  dark:bg-slate-900/80     ← Glass panels (backdrop-blur)
Layer 4 (Toast):   bg-slate-900 dark:bg-white            ← Notifications (inverted)
```

---

## 4. Typography System

### 4.1 Font Stack
```css
/* Primary — UI, Data, Body */
font-family: 'Inter', sans-serif;

/* Secondary — Headings, Hero text */
font-family: 'Manrope', sans-serif;

/* Tertiary — Accent labels, badges */
font-family: 'Outfit', sans-serif;
```

Always import via `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;600;700;800&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
```

### 4.2 Type Scale (Tailwind)
| Role | Class | Weight | Font |
|---|---|---|---|
| Page Title | `text-3xl` | `font-bold` (800) | Manrope |
| Section Heading | `text-xl` | `font-semibold` (700) | Manrope |
| Card Title | `text-base` | `font-semibold` (600) | Inter |
| Body Text | `text-sm` | `font-normal` (400) | Inter |
| Caption / Meta | `text-xs` | `font-medium` (500) | Inter |
| Badge Label | `text-xs` | `font-semibold` (600) | Outfit |
| Form Label | `text-xs uppercase tracking-widest` | `font-bold` (700) | Outfit |

---

## 5. Component Library

### 5.1 Glass Card (`.glass-card`)
```css
.glass-card {
  @apply bg-white/70 dark:bg-slate-800/60
         backdrop-blur-xl
         border border-white/40 dark:border-slate-700/50
         rounded-2xl
         shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]
         transition-all duration-300;
}

.glass-card:hover {
  @apply shadow-[0_8px_40px_rgba(31,58,95,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
         -translate-y-0.5;
}
```

### 5.2 Glass Panel (`.glass-panel`)
```css
.glass-panel {
  @apply bg-white/50 dark:bg-slate-900/50
         backdrop-blur-2xl
         border border-slate-200/60 dark:border-slate-700/40
         rounded-3xl;
}
```

### 5.3 Status Badge (`.badge-*`)
```html
<!-- WFO Badge -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
             bg-blue-50 text-blue-700 border border-blue-200
             dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50">
  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
  WFO
</span>
```

Always include the **dot indicator** before the label text. Size: `w-1.5 h-1.5`.

### 5.4 Primary Button
```html
<button class="inline-flex items-center gap-2 px-5 py-2.5
               bg-primary-500 hover:bg-primary-700
               dark:bg-primary-500 dark:hover:bg-primary-400
               text-white text-sm font-semibold
               rounded-xl
               shadow-md hover:shadow-lg
               transition-all duration-200 ease-out
               active:scale-95">
  <ng-icon name="heroPlus" class="w-4 h-4"></ng-icon>
  Add Record
</button>
```

### 5.5 Form Input
```html
<div class="flex flex-col gap-1.5">
  <label class="text-xs font-bold uppercase tracking-widest
                text-slate-500 dark:text-slate-400 font-outfit">
    Employee ID
  </label>
  <input type="text"
    class="w-full px-4 py-2.5
           bg-transparent
           border border-slate-200 dark:border-slate-700
           rounded-xl
           text-sm text-slate-800 dark:text-slate-100
           placeholder:text-slate-400 dark:placeholder:text-slate-500
           focus:outline-none focus:ring-2 focus:ring-primary-500/30
           focus:border-primary-500 dark:focus:border-primary-400
           transition-all duration-200">
</div>
```

### 5.6 Data Table
```html
<div class="glass-card overflow-hidden">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-slate-100 dark:border-slate-700/60">
        <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest
                   text-slate-500 dark:text-slate-400 font-outfit">
          Employee
        </th>
        <!-- more headers -->
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-slate-50 dark:border-slate-800
                 hover:bg-slate-50/80 dark:hover:bg-slate-800/50
                 transition-colors duration-150">
        <!-- cells -->
      </tr>
    </tbody>
  </table>
</div>
```

### 5.7 KPI Metric Card
```html
<div class="glass-card p-6 flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <span class="text-xs font-bold uppercase tracking-widest
                 text-slate-500 dark:text-slate-400 font-outfit">
      Present Today
    </span>
    <div class="w-10 h-10 rounded-xl bg-accent-subtle dark:bg-teal-900/30
                flex items-center justify-center">
      <ng-icon name="heroUsers" class="w-5 h-5 text-accent dark:text-teal-400"></ng-icon>
    </div>
  </div>
  <div class="flex items-end gap-2">
    <span class="text-4xl font-bold text-slate-800 dark:text-white font-manrope">
      142
    </span>
    <span class="text-sm text-emerald-600 dark:text-emerald-400 font-medium pb-1">
      ↑ 4.2%
    </span>
  </div>
  <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
    <div class="bg-accent h-1.5 rounded-full" style="width: 78%"></div>
  </div>
  <p class="text-xs text-slate-500 dark:text-slate-400">78% of total workforce</p>
</div>
```

---

## 6. Layout System

### 6.1 Page Shell Structure
```html
<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter transition-colors duration-300">

  <!-- Sidebar -->
  <aside class="fixed inset-y-0 left-0 w-64 glass-panel border-r
                border-slate-200/60 dark:border-slate-700/40 z-30">
    <!-- nav -->
  </aside>

  <!-- Main Content -->
  <main class="ml-64 min-h-screen">

    <!-- Top Bar -->
    <header class="sticky top-0 z-20 h-16 glass-panel border-b
                   border-slate-200/60 dark:border-slate-700/40
                   flex items-center px-6 justify-between">
      <!-- breadcrumb + actions + theme toggle -->
    </header>

    <!-- Page Body -->
    <div class="p-6 lg:p-8 space-y-6">
      <!-- page content -->
    </div>

  </main>
</div>
```

### 6.2 Grid Layouts
```html
<!-- KPI Row (4 cards) -->
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

<!-- 2/3 + 1/3 Split -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2"><!-- chart --></div>
  <div class="lg:col-span-1"><!-- summary --></div>
</div>
```

---

## 7. Animation System

### 7.1 Keyframe Definitions (in `styles.css` or `tailwind.config.js`)
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes reveal-line {
  from { width: 0; }
  to   { width: 100%; }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
```

### 7.2 Animation Utility Classes
```css
.animate-fade-in    { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-slide-up   { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-slide-right{ animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
```

### 7.3 Staggered Loading Pattern
```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.10s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.20s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.30s; }
```

### 7.4 Modal Animation
```css
.modal-backdrop {
  @apply fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-50;
  animation: fade-in 0.2s ease both;
}

.modal-container {
  @apply glass-panel p-8 rounded-3xl shadow-2xl w-full max-w-lg mx-auto;
  animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

---

## 8. Dark / Light Mode Toggle

### 8.1 Theme Toggle Button (Angular Component)
```typescript
// theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDark = signal(false);

  constructor() {
    // Restore from localStorage
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDark(saved === 'dark' || (!saved && prefersDark));
  }

  setDark(value: boolean) {
    this.isDark.set(value);
    document.documentElement.classList.toggle('dark', value);
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }

  toggle() { this.setDark(!this.isDark()); }

  get dark() { return this.isDark; }
}
```

```html
<!-- theme-toggle.component.html -->
<button (click)="theme.toggle()"
  class="w-10 h-10 rounded-xl flex items-center justify-center
         bg-slate-100 dark:bg-slate-800
         hover:bg-slate-200 dark:hover:bg-slate-700
         text-slate-600 dark:text-slate-300
         transition-all duration-200 active:scale-90">
  @if (theme.dark()) {
    <ng-icon name="heroSun" class="w-5 h-5"></ng-icon>
  } @else {
    <ng-icon name="heroMoon" class="w-5 h-5"></ng-icon>
  }
</button>
```

---

## 9. Chart Theming

### 9.1 ApexCharts Dark/Light Config
```typescript
getChartOptions(isDark: boolean): ApexOptions {
  return {
    theme: { mode: isDark ? 'dark' : 'light' },
    chart: {
      background: 'transparent',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#1f7a6b', '#1f3a5f', '#f59e0b', '#ef4444', '#8b5cf6'],
    grid: {
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
    },
    xaxis: {
      labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' } },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#94a3b8' : '#64748b' } },
    },
  };
}
```

---

## 10. Accessibility (a11y) Checklist

Every component must pass:
- [ ] **Color contrast** ≥ 4.5:1 for body text (WCAG AA), ≥ 7:1 for small text
- [ ] All interactive elements have `:focus-visible` ring: `focus-visible:ring-2 focus-visible:ring-primary-500`
- [ ] All images / icons have `aria-label` or `aria-hidden="true"`
- [ ] Form inputs paired with visible `<label>` or `aria-label`
- [ ] Modal has `role="dialog"` and `aria-modal="true"` with focus trap
- [ ] Status badges include `aria-label` (e.g., `aria-label="Status: Work From Home"`)
- [ ] Table has `<caption>` or `aria-label`
- [ ] Keyboard navigation: Tab → Enter → Escape fully functional

---

## 11. Performance Rules

| Rule | Implementation |
|---|---|
| Lazy load feature modules | `loadChildren: () => import(...)` |
| Virtual scroll for long lists | `@angular/cdk/scrolling` `CdkVirtualScrollViewport` |
| Debounce search inputs | `debounceTime(300)` via RxJS |
| OnPush change detection | All components: `changeDetection: ChangeDetectionStrategy.OnPush` |
| Track by in ngFor | Always use `trackBy: trackById` function |
| Image optimization | Use `NgOptimizedImage` directive |
| Skeleton loaders | Show `.skeleton-pulse` placeholders during data fetch |

### Skeleton Loader Pattern
```css
.skeleton-pulse {
  @apply bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse;
}
```

---

## 12. Code Quality Checklist

Before any PR:
- [ ] All colors use Tailwind tokens, **never raw hex in templates**
- [ ] `dark:` variant exists for every color class
- [ ] No hardcoded pixel values (use Tailwind spacing scale)
- [ ] Angular component uses `OnPush` change detection
- [ ] `trackBy` used in all `*ngFor` / `@for`
- [ ] No inline styles except truly dynamic values (chart colors, progress widths)
- [ ] Animations respect `@media (prefers-reduced-motion: reduce)`
- [ ] Component has unit test file (`.spec.ts`)

---

*This SKILL.md is the single source of truth for all frontend UI/UX decisions. When in doubt, refer here first.*