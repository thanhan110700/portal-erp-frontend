# Portal ERP — Frontend Agent Rules

> [!IMPORTANT]
> **READ THIS FILE AND COMPLY 100% BEFORE WRITING ANY CODE.**
> Every agent, developer, and automated prompt **MUST** follow these rules without exception.

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

| Layer             | Technology                                                    |
| ----------------- | ------------------------------------------------------------- |
| **Framework**     | React 19 + Vite 8 (SPA, no SSR)                               |
| **Language**      | TypeScript 5.9 (`strict` mode)                                |
| **Styling**       | Tailwind CSS v4 + `@tailwindcss/vite` plugin                  |
| **UI Primitives** | shadcn/ui (Radix-based) in `src/components/ui/`               |
| **Data Table**    | Mantine React Table (`mantine-react-table`) + Mantine Core 6  |
| **Forms**         | React Hook Form 7 + Zod 4                                     |
| **State**         | Zustand 5 (client state), React Hook Form (form state)        |
| **Routing**       | React Router DOM 7                                            |
| **HTTP**          | Axios 1.x                                                     |
| **Date**          | Day.js (extended in `src/lib/dayjs.ts`)                       |
| **Rich Text**     | TipTap 3                                                      |
| **Icons**         | Lucide React, Tabler Icons React                              |
| **Linting**       | ESLint 9 (flat config) + Prettier 3                           |
| **Class Merge**   | `cn()` utility (`clsx` + `tailwind-merge`) in `src/lib/utils` |

---

## Code Style & Formatting

All formatting is enforced by **Prettier + ESLint** and runs automatically on save via `.vscode/settings.json`.

| Rule            | Value                          |
| --------------- | ------------------------------ |
| Quotes          | **Double quotes** (`"`)        |
| JSX Quotes      | **Double quotes** (`"`)        |
| Semicolons      | **No** (`semi: false`)         |
| Trailing commas | **All** (`trailingComma: all`) |
| Print width     | **100** characters             |
| Indentation     | **2 spaces** (no tabs)         |
| Arrow parens    | **Always** (`(x) => ...`)      |
| Line endings    | **LF** (`\n`)                  |

**Commands:**

```bash
pnpm format       # Prettier --write + ESLint --fix (full codebase)
pnpm lint          # ESLint check only
pnpm lint:fix      # ESLint --fix only
```

---

## Strict Rule: Date Formatting

- You **MUST** use `dayjs` for all date formatting and manipulation instead of `date-fns` or native `Date`. This project relies on `dayjs` extensions defined in `src/lib/dayjs.ts`.

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

> **CRITICAL RULE**: You **MUST** use the components provided in the `src/components/common/` folder instead of creating custom ones or using native HTML/shadcn equivalents.
>
> - **Selects**: All select inputs **MUST** use the `SearchableSelect` or `MultiSearchableSelect` component. Do not use standard `<Select>` or native `<select>`.
> - **Modals & Drawers**: You **MUST** use `CommonDialog` for modals and `CommonDrawer` for sheets/drawers.
> - **Confirmations**: You **MUST** use `ConfirmDialog` for all user confirmation actions (e.g. deletion, cancellation, status updates, or critical actions). Using native `window.confirm` is **strictly prohibited**.
> - **Date Pickers**: You **MUST** use `CommonDatePicker` or `CommonDateRangePicker`.

| Component                | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `CommonDialog`           | Modal dialog with configurable actions, sizes, loading      |
| `CommonDrawer`           | Sheet/drawer (left, right, top, bottom)                     |
| `ConfirmDialog`          | Standard confirmation dialog with customizable text/loading |
| `CommonDatePicker`       | Single date picker with validation, hints, clear            |
| `CommonDateRangePicker`  | Date range (from/to) picker                                 |
| `DateRangePickerPresets` | Date range picker with preset filters (Today, Last 7d…)     |
| `FilterPanel`            | Collapsible multi-field filter (input, select, date…)       |
| `ActiveFilterChips`      | Display & remove active filter values                       |
| `FileUploadField`        | Drag & drop file upload with preview and RHF integration    |
| `SearchableSelect`       | Searchable dropdown select                                  |
| `MultiSearchableSelect`  | Multi-select searchable dropdown select                     |
| `StatusBadge`            | Colored status indicator badge                              |
| `TextEditor`             | Rich text editor (TipTap-based)                             |
| `MobileBottomNav`        | Fixed bottom navigation bar for mobile                      |
| `ScreenTitle`            | Page title auto-derived from route handle                   |
| `PageLoader`             | Full-page loading spinner                                   |
| `ThemeToggle`            | Dark/light mode toggle                                      |
| `ImagePreviewDialog`     | Zoom/preview dialog for uploaded images                     |

---

## Path Aliases

| Alias           | Maps to            |
| --------------- | ------------------ |
| `@/*`           | `src/*`            |
| `@components/*` | `src/components/*` |
| `@hooks/*`      | `src/hooks/*`      |
| `@utils/*`      | `src/utils/*`      |
| `@lib/*`        | `src/lib/*`        |
| `@assets/*`     | `src/assets/*`     |

---

## Coding Conventions

### Components

- Use **function declarations** (`function MyComponent()`) or **arrow function with `const`**.
- Export components as **named exports** (no default exports).
- Keep page components thin — delegate complex UI to feature components.
- Use `cn()` for all conditional/merged class strings.
- **Always use Common Components** from `src/components/common/` (e.g., `SearchableSelect`, `CommonDialog`, `CommonDatePicker`, `ConfirmDialog`) instead of building custom equivalents.

### State Management

- **Zustand** for global client state (auth, session, UI state).
  - Always use **selectors** to avoid unnecessary re-renders: `useAuthStore((s) => s.user)`.
- **React Hook Form** for all form state.
  - **CRITICAL**: Always use **Zod** for form validation (`zodResolver`). You MUST verify expected payload types from the backend API to ensure 100% accurate data mapping before submission.
- Use `useMemo` / `useCallback` where performance matters (large lists, expensive computations).

### Confirmation Dialogs & Actions

- **Rule**: Whenever any user action requires confirmation (e.g., deleting a record, discarding changes, reversing a status, canceling a transaction), you **MUST** use the `ConfirmDialog` component.
- **Strict Prohibition**: Native `window.confirm()` or custom ad-hoc confirmation prompts are strictly forbidden.
- **State Management Pattern**:
  - For simple confirmations: Use a boolean state `const [confirmOpen, setConfirmOpen] = useState(false)`.
  - For item-specific confirmations (e.g., list/table delete actions): Store the ID/object of the target item, e.g., `const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)`.
  - Implement a loading/disabled state on the confirmation button if the operation is asynchronous, ensuring the button loading states function correctly.
  - Always clean up the state (e.g., set to `false` or `null`) inside a `finally` block or after the operation finishes.

### Localization & Internationalization (i18n)

- **CRITICAL**: Hardcoding user-facing strings (e.g., text, titles, table headers, form labels, input placeholders, validation rules, success/error toasts) is **strictly forbidden**.
- All user-facing strings **MUST** use the `useTranslation` hook:
  ```tsx
  const { t } = useTranslation(["feature_namespace", "common"])
  ```
- All translation keys MUST be defined and matching in both English (`src/locales/en/*.json`) and Vietnamese (`src/locales/vi/*.json`).
- Standardize common actions and items using the `common` namespace:
  - Actions: `t("common:actions.confirm")`, `t("common:actions.cancel")`, `t("common:actions.save")`, `t("common:actions.delete")`.
  - Table headers & states: `t("common:table.actions")`, `t("common:table.noData")`.
  - Toast & modal messages: `t("common:messages.success")`, `t("common:messages.error")`, `t("common:messages.deleteConfirm")`.

### API & Data

- API functions live in `src/features/<domain>/api/`.
- Use the shared Axios instance from `src/shared/api/axios.ts`.
- **Options Mapping**: All backend option APIs (`/v1/options/*`) return items in the `{ value, label }` format. Always use `item.value` and `item.label` when mapping options (e.g., in `SelectItem`), NEVER use `item.id` or `item.name`.
- Authentication: hybrid (cookie + token), managed by `AuthProvider`.
- Permissions: string slugs checked via `RequirePermission` route guard.

### Data Tables & Filters

- **Data Tables**: Use **Mantine React Table** (`mantine-react-table`) for all list pages.
  - Disable default toolbars, filters, and pagination from Mantine React Table config (`enableColumnActions: false`, `enableColumnFilters: false`, `enablePagination: false`, `enableBottomToolbar: false`, `enableTopToolbar: false`).
  - Striped and hover states should be enabled (`mantineTableProps: { striped: true, highlightOnHover: true }`).
  - Set table wrapper container overflow to scroll horizontally smoothly on mobile devices.
- **Filters**: Use the common `FilterPanel` (`@/components/common/FilterPanel`) for filtering options.
  - Bind fields to `FilterFieldDef` schema and use `applyMode` where filters are submitted explicitly.
- **Pagination**: Use the custom `TablePagination` (`@/components/common/TablePagination`) beneath the table for standard page-numbered navigation.

### Verification

After any code modifications, **always run:**

```bash
pnpm format        # Fix formatting + run eslint checks
pnpm build         # Verify full TypeScript compilation and build success
```

You MUST fix all TypeScript warnings, compiler errors, and lint warnings before completing the task.
