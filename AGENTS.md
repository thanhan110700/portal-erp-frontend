# Portal ERP — Frontend Agent Rules

> **Read this file before writing any code in the frontend project.**

---

## 🚨 Critical: Mobile-First Design

This application is **primarily used on mobile devices**. Every page, component, and layout **MUST** be designed with mobile UX as the top priority:

- Design for small screens first, then scale up to desktop with responsive breakpoints.
- Touch targets must be at least **44×44px** (use `min-h-11 min-w-11` or equivalent).
- Avoid hover-only interactions — always provide tap/click alternatives.
- Use bottom sheets (`CommonDrawer direction="bottom"`) instead of popovers/dropdowns where possible on mobile.
- Test all modals, drawers, and date pickers for usability at `375px` width.
- The `MobileBottomNav` component is the primary navigation on mobile — sidebar is hidden.
- Use `safe-area-inset-*` padding for fixed/sticky elements near screen edges.

---

## Tech Stack

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| **Framework**    | React 19 + Vite 8 (SPA, no SSR)                               |
| **Language**     | TypeScript 5.9 (`strict` mode)                                 |
| **Styling**      | Tailwind CSS v4 + `@tailwindcss/vite` plugin                   |
| **UI Primitives**| shadcn/ui (Radix-based) in `src/components/ui/`                |
| **Data Table**   | Mantine React Table (`mantine-react-table`) + Mantine Core 6   |
| **Forms**        | React Hook Form 7 + Zod 4                                     |
| **State**        | Zustand 5 (client state), React Hook Form (form state)         |
| **Routing**      | React Router DOM 7                                             |
| **HTTP**         | Axios 1.x                                                     |
| **Date**         | Day.js (extended in `src/lib/dayjs.ts`)                        |
| **Rich Text**    | TipTap 3                                                      |
| **Icons**        | Lucide React, Tabler Icons React                               |
| **Linting**      | ESLint 9 (flat config) + Prettier 3                            |
| **Class Merge**  | `cn()` utility (`clsx` + `tailwind-merge`) in `src/lib/utils`  |

---

## Code Style & Formatting

All formatting is enforced by **Prettier + ESLint** and runs automatically on save via `.vscode/settings.json`.

| Rule               | Value                          |
| ------------------ | ------------------------------ |
| Quotes             | **Double quotes** (`"`)        |
| JSX Quotes         | **Double quotes** (`"`)        |
| Semicolons         | **No** (`semi: false`)         |
| Trailing commas    | **All** (`trailingComma: all`) |
| Print width        | **100** characters             |
| Indentation        | **2 spaces** (no tabs)         |
| Arrow parens       | **Always** (`(x) => ...`)      |
| Line endings       | **LF** (`\n`)                  |

**Commands:**

```bash
pnpm format       # Prettier --write + ESLint --fix (full codebase)
pnpm lint          # ESLint check only
pnpm lint:fix      # ESLint --fix only
```

---

## Tailwind CSS v4 — Important Rules

This project uses **Tailwind CSS v4**. Key differences from v3:

- **`!important` modifier is POSTFIX, not prefix:**
  ```
  ✅  mx-auto!       (v4 syntax — correct)
  ❌  !mx-auto       (v3 syntax — will NOT work)
  ```
- CSS variables are defined in `src/index.css` using `@theme` blocks.
- No `tailwind.config.js` — all config is in CSS via `@theme` / `@plugin`.
- Use `cn()` from `@/lib/utils` for conditional class merging.

---

## Project Structure

```
src/
├── app/
│   ├── providers/          # AuthProvider, ThemeProvider
│   └── router/             # ProtectedRoute, RequirePermission
├── components/
│   ├── ui/                 # shadcn primitives (Button, Dialog, Input, etc.)
│   ├── common/             # App-wide composites (see list below)
│   └── sidebar/            # Sidebar navigation components
├── features/
│   └── <domain>/
│       ├── pages/          # Route screens (thin: fetch data, check perms, delegate)
│       ├── components/     # Feature-specific UI (dialogs, tables, sections)
│       ├── api/            # API client functions
│       └── types/          # TypeScript types, Zod schemas, form values
├── hooks/                  # Shared custom hooks
├── constants/              # App-wide constants (paths, permissions, roles)
├── config/                 # Environment config
├── layouts/                # AuthLayout, DashboardLayout
├── lib/                    # Utilities (cn, dayjs, etc.)
├── shared/
│   ├── api/                # Axios instance & interceptors
│   └── types/              # Global shared types
└── routes/                 # Route definitions
```

---

## Common Components (reuse these — do NOT recreate)

| Component                | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `CommonDialog`           | Modal dialog with configurable actions, sizes, loading   |
| `CommonDrawer`           | Sheet/drawer (left, right, top, bottom)                  |
| `CommonDatePicker`       | Single date picker with validation, hints, clear         |
| `CommonDateRangePicker`  | Date range (from/to) picker                              |
| `DateRangePickerPresets` | Date range picker with preset filters (Today, Last 7d…)  |
| `FilterPanel`            | Collapsible multi-field filter (input, select, date…)    |
| `ActiveFilterChips`      | Display & remove active filter values                    |
| `FileUploadField`        | Drag & drop file upload with preview and RHF integration |
| `SearchableSelect`       | Searchable dropdown select                               |
| `StatusBadge`            | Colored status indicator badge                           |
| `TextEditor`             | Rich text editor (TipTap-based)                          |
| `MobileBottomNav`        | Fixed bottom navigation bar for mobile                   |
| `ScreenTitle`            | Page title auto-derived from route handle                |
| `PageLoader`             | Full-page loading spinner                                |
| `ThemeToggle`            | Dark/light mode toggle                                   |
| `ImagePreviewDialog`     | Zoom/preview dialog for uploaded images                  |

---

## Path Aliases

| Alias           | Maps to              |
| --------------- | -------------------- |
| `@/*`           | `src/*`              |
| `@components/*` | `src/components/*`   |
| `@hooks/*`      | `src/hooks/*`        |
| `@utils/*`      | `src/utils/*`        |
| `@lib/*`        | `src/lib/*`          |
| `@assets/*`     | `src/assets/*`       |

---

## Coding Conventions

### Components

- Use **function declarations** (`function MyComponent()`) or **arrow function with `const`**.
- Export components as **named exports** (no default exports).
- Keep page components thin — delegate complex UI to feature components.
- Use `cn()` for all conditional/merged class strings.

### State Management

- **Zustand** for global client state (auth, session, UI state).
  - Always use **selectors** to avoid unnecessary re-renders: `useAuthStore((s) => s.user)`.
- **React Hook Form** for all form state.
- Use `useMemo` / `useCallback` where performance matters (large lists, expensive computations).

### API & Data

- API functions live in `src/features/<domain>/api/`.
- Use the shared Axios instance from `src/shared/api/axios.ts`.
- Authentication: hybrid (cookie + token), managed by `AuthProvider`.
- Permissions: string slugs checked via `RequirePermission` route guard.

### Verification

After substantive edits, **always run:**

```bash
pnpm format        # Fix formatting + lint
pnpm build         # Verify TypeScript compilation
```
