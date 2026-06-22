---
name: fe-project-conventions
description: >-
  Frontend conventions: folder layout, feature modules, routing,
  API client (Laravel Sanctum + Bearer token + axios), auth and permissions, path aliases, and stack
  (Vite 8 + Rolldown, React 19, React Router 7, Tailwind 4, Ant Design 6, TipTap, Zustand).
  Use for any task when deciding where files go, how to name them, or which
  library to use. Includes re-render optimization with React Compiler and Zustand selectors.
---

# Frontend project conventions

**Read this skill first** when adding or moving files under `src/`, wiring routes, or calling the API. It encodes this repo's structure; do not invent parallel layouts (for example a second `components` root or a different API client) without aligning with existing code.

## Global Rules & Context

This frontend project inherits global coding rules from the workspace root. AI agents **must** read and adhere to the global rules and conventions located in the parent directory:
- **Global Coding Principles:** [coding-principles.md](../.claude/rules/coding-principles.md)
- **Global Code Quality:** [code-quality.md](../.claude/rules/code-quality.md)
- **Frontend Architecture Rules:** [architecture-frontend.md](../.claude/rules/architecture-frontend.md)
- **Workflow & Verification:** [workflow.md](../.claude/rules/workflow.md) and [plan-verification.md](../.claude/rules/plan-verification.md)
- **Repository Map:** [repository-map.md](../.claude/rules/repository-map.md)
- **Workspace Overview:** [CLAUDE.md](../CLAUDE.md)

## Project context

- The application is a Single Page Application (SPA) built with **Vite 8** (Rolldown bundler); it talks to a Laravel API hosted separately or in a companion repository.
- Auth uses a **hybrid model**: Bearer token stored in `useSessionStore` (Zustand) + Sanctum CSRF cookie (`withCredentials: true`, `xsrfCookieName: "XSRF-TOKEN"`). The request interceptor in `@/shared/api/axios` injects `Authorization: Bearer <token>` when a token is present.
- Keep domain logic and API calls inside **`src/features/<domain>/`**; keep cross-cutting UI under **`src/components/common/`**.
- Put **feature-only** composed UI and co-located helpers under **`src/features/<domain>/components/`** — do not duplicate that tree at another repo root.

## Directory layout (where to put files)

| Location                    | Purpose                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                  | App shell: **`providers/`** (Theme, Auth), **`router/`** (`ProtectedRoute`, `RequirePermission`).                                                                                                             |
| `src/routes/`               | **`index.tsx`** — `createBrowserRouter`, lazy route components, navigation metadata (`handle.title`).                                                                                                         |
| `src/layouts/`              | Route layouts (**`AuthLayout`**, **`DashboardLayout`**). `DashboardLayout` uses Ant Design `Layout` + `Sider` + `Menu`.                                                                                       |
| `src/features/<domain>/`    | Feature modules: **`pages/`**, **`components/`** (see **Feature-scoped components**), **`api/`**, **`types/`** (see **Feature types**). Examples: `features/auth`, `features/dashboard`, `features/gtags`. |
| `src/components/common/`    | Shared composite UI (Header, ScreenTitle, DocumentTitle, PageLoader, SuspenseFallback, TextEditor).                                                                                                           |
| `src/hooks/`                | Reusable hooks and **Zustand** stores: `useAuthStore.ts`, `useSessionStore.ts`, `useTheme.ts`.                                                                                                                 |
| `src/shared/`               | Cross-feature **`api/`** (`axiosInstance`), **`types/`** (`User`, `ApiResponse`, `UserRole`, `RBACRole`).                                                                                                     |
| `src/lib/`                  | Utilities (**`utils.ts`** — `cn`, etc.).                                                                                                                                                                      |
| `src/helpers/`              | Pure utility functions that are not hooks and not domain-specific (e.g. `copyToClipboard`). Export from `src/helpers/index.ts`.                                                                               |
| `src/constants/`            | App-wide constants: `paths.ts` (**`PATHS`**, **`routeSegment`**), `permissions.ts` (**`PermissionSlugs`**, **`PERMISSION_CATALOG`**), `header.ts` / nav, `role.ts`, `languages.ts`.                           |
| `src/config/`               | Env-driven config (`apiURL`, `siteName`, `strictMode`).                                                                                                                                                       |
| `src/assets/`               | Static assets (logos, images).                                                                                                                                                                                |

> **`src/components/ui/`** does **not** exist — there is no shadcn/Radix primitives layer. All shared UI lives in **`src/components/common/`**. Do not create a `ui/` folder.

**Do not** place feature-specific pages at `src/pages/`. **Do not** add API calls inline in layouts without following the `features/*/api` pattern.

### Feature types (`src/features/<domain>/types/`)

Put **exported TypeScript types and interfaces** for that feature here (not inline in `api/` or `components/` unless trivial / file-private):

| Put here                                                                            | Examples                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------- |
| API request/response payloads used by **`src/features/<domain>/api`**               | `LoginPayload`, `LoginResponse`          |
| Form value types whose inferred type is shared across pages/components               | Feature-specific form value interfaces   |
| Domain models not already in **`shared/types`**                                     | Feature-specific DTOs                    |

Use **`types/index.ts`** as a barrel when it helps (`@/features/<domain>/types`). **Props** types for a single component can stay private in that `.tsx` file.

### Feature-scoped components (`src/features/<domain>/components/`)

Use this folder for **UI and small modules that belong to a single feature** and are not meant to be reused across domains:

| Put here                                                                         | Put elsewhere                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Dialogs, wizard steps, feature tables/cards, permission trees tied to one screen | **`components/common/`** — shell/header/loaders shared app-wide   |
| `formatXxxError`, mask/bit helpers used only by that feature's pages             | **`shared/`** — axios instance, cross-feature types               |
| Optional **`index.ts`** barrel — import as `@/features/<domain>/components`      | **`helpers/`** — generic pure utilities (no domain coupling)       |

Exported **types** belong in **`src/features/<domain>/types/`**, not under `components/`.

- **`pages/*Page.tsx`** should stay **thin**: permissions, loading state, handlers that call **`src/features/<domain>/api`**, and composition of feature components.
- When a piece of UI is clearly **reused by multiple features**, move it to **`components/common/`** instead of copying under another `features/*/components/`.

## Path aliases (imports)

Configured in **`vite.config.ts`** and **`tsconfig.json`**:

| Alias         | Resolves to         | Prefer when                                                             |
| ------------- | ------------------- | ----------------------------------------------------------------------- |
| `@/`          | `src/`              | Default for all imports (`@/components/...`, `@/features/...`).         |
| `@components` | `src/components`    | Optional; `@/components` is equivalent via `@/`.                        |
| `@hooks`      | `src/hooks`         | Optional.                                                               |
| `@lib`        | `src/lib`           | Prefer `@/lib/...` for consistency.                                     |
| `@assets`     | `src/assets`        | Images, favicons.                                                       |

Use **`@/lib/utils`** and **`cn()`** for Tailwind class merging.

## Stack (packages you should align with)

| Area                 | Packages                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                | **Vite 8** (Rolldown bundler), **TypeScript ~5.9**, `@tailwindcss/vite`, **Tailwind 4**, **Babel** via `@rolldown/plugin-babel` (for React Compiler), `@vitejs/plugin-react` (compat)                        |
| UI core              | **React 19**, **react-router-dom 7** (`createBrowserRouter`, `RouterProvider`)                                                                                                                                |
| UI components        | **Ant Design 6** (`antd`) — primary component library for layout, forms, tables, menus, modals. **Do not** introduce shadcn, Radix, or Mantine unless explicitly asked.                                       |
| Icons                | **`@ant-design/icons`** (primary Ant Design icons) and **`@tabler/icons-react`** (supplementary). Do **not** use `lucide-react` — it is not installed.                                                       |
| Styling              | **Tailwind 4** semantic tokens from `index.css` (`bg-background`, `text-foreground`, etc.) + Apple Design System CSS variables. Use `cn()` from `@/lib/utils` for conditional classes.                        |
| Rich text editor     | **TipTap 3** (`@tiptap/react`, `@tiptap/starter-kit`, plus extension packages) — exposed via `TextEditor` in `components/common/`.                                                                            |
| Charts               | **recharts 3** — use for data visualization.                                                                                                                                                                  |
| HTTP                 | **axios 1.15** via **`@/shared/api/axios`** (`axiosInstance`). Base URL from **`import { apiURL } from '@/config'`**.                                                                                        |
| Auth                 | Hybrid: **Bearer token** stored in `useSessionStore` (injected via request interceptor) + **Sanctum CSRF** cookie (`withCredentials: true`). Global auth state in **`useAuthStore`** (Zustand).              |
| Dates                | **dayjs**                                                                                                                                                                                                     |
| Global client state  | **zustand 5**                                                                                                                                                                                                 |
| Fonts                | **`@fontsource-variable/inter`** — imported in `index.css`.                                                                                                                                                   |

## Zustand stores (in `src/hooks/`)

| Store file             | Exported hook       | Holds                                                         |
| ---------------------- | ------------------- | ------------------------------------------------------------- |
| `useAuthStore.ts`      | `useAuthStore`      | `user: User \| null`, `isAuthenticated`, `setUser`, `logout` |
| `useSessionStore.ts`   | `useSessionStore`   | `token: string \| null`, `setToken`, `clearToken`            |
| `useTheme.ts`          | `useTheme`          | `theme: 'light' \| 'dark'`, toggle logic                     |

## Routing

- **Path strings:** define every user-facing pathname once in **`src/constants/paths.ts`** as **`PATHS`** (values with a leading `/`). Use **`PATHS`** for `<Link to>`, `navigate()`, `<Navigate to>`, and **`href`** in **`@/constants/header.ts`**. Do **not** scatter duplicate string literals.
- **`routeSegment()`** — for **`createBrowserRouter`** child routes under a parent with **`path: '/'`**, pass **`path: routeSegment(PATHS.somePage)`** so segments stay derived from **`PATHS`** (supports nested segments).
- Define routes in **`src/routes/index.tsx`**.
- Use **`lazy()`** for page and layout components.
- Wrap authenticated areas with **`ProtectedRoute`**; wrap permission-gated UI with **`RequirePermission`** and **`PermissionSlugs`** from **`@/constants/permissions`**.
- Add nav items in **`@/constants/header.ts`** (`NAVIGATION_ITEMS`). Nav item icons must be `FC` type-compatible (Ant Design icons satisfy this).

## Permissions (string slugs on roles; keep FE / BE in sync)

Access comes from the user's **role** via the backend's pivot table (each row = one slug string):

| Location                               | Role                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Backend enum**                       | One case = one string slug (e.g. `'settings.users.view'`). Defined in the Laravel backend API.                                |
| **`src/constants/permissions.ts`**     | **`PermissionSlugs`** (same string values as backend), **`PERMISSION_CATALOG`** (cluster → screen → rows for role editor UI). |

The logged-in user receives **`permissions: string[]`** from the API — see **`src/shared/types`** (`User`). Use **`hasPermission(perms, PermissionSlugs.SomeCase)`** for checks.

### Checklist: new page / screen / API

1. **Backend first** — Ensure the new permission is registered on the backend, and backend routes/controllers are appropriately gated.
2. **Frontend constants** — Add the same slug to **`PermissionSlugs`**, and add an entry under the right cluster/screen in **`PERMISSION_CATALOG`**.
3. **Paths** — Add the pathname to **`PATHS`** in **`src/constants/paths.ts`**; wire **`src/routes/index.tsx`** with **`routeSegment(PATHS....)`** and use **`PATHS`** in redirects / links / nav **`href`**.
4. **Route** — In **`src/routes/index.tsx`**, wrap the page with **`RequirePermission`** using the matching **`PermissionSlugs`** value.
5. **Nav** — If the page is linked from the header, add an entry in **`src/constants/header.ts`** with `requiredPermission` set to that slug.

**Do not** introduce permission slugs that are not on the PHP enum, or values that disagree between TS and PHP.

## API & errors

- Use **`axiosInstance`** from **`@/shared/api/axios`** — never a raw `axios` import for app API calls.
- Base URL: **`import { apiURL } from '@/config'`**.
- The request interceptor reads `useSessionStore.getState().token` and sets `Authorization: Bearer <token>` if present.
- The response interceptor fires an `"unauthorized"` window event on 401 (rate-limited, skipped for auth/CSRF endpoints) — listen for this to trigger session expiry flows.

## Forms

- **Ant Design Form** is the standard pattern. Use `Form`, `Form.Item`, `Input`, `Button` etc. from `antd`.
- Do **not** introduce `react-hook-form` or `zod` unless the feature already uses them or is explicitly requested.

## Styling rules

1. Use **Tailwind 4 semantic tokens** from `index.css` (`bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.) for consistency with both light and dark themes.
2. Dark mode is toggled via `data-theme="dark"` on the document root (managed by `useTheme`). CSS variables auto-switch — no manual `dark:` Tailwind variants needed for design-system colors.
3. Apple Design System custom tokens (e.g. `--color-ink`, `--color-canvas-parchment`, `--spacing-lg`) are available via `@theme` — use them for brand-consistent spacing and colors.
4. For Ant Design component theming, use the `ConfigProvider` in `src/app/providers/` — do **not** override Ant Design internals with raw CSS unless strictly necessary.

## Re-render & Performance Optimization (React Compiler + Zustand)

Since this project utilizes the **React Compiler** (via `babel-plugin-react-compiler` + `@rolldown/plugin-babel`) and React 19, manual memoization should be avoided.

### Automatic Memoization (React Compiler)
- **Do not write manual `useMemo`, `useCallback`, or `React.memo` by default.** The React Compiler handles this automatically.
- **Rules of React compliance is mandatory:** Keep components and hooks pure. Do not mutate props, state, or variables defined outside a component/hook during render.
- **Do not disable react-hooks rules** (`eslint-disable-next-line react-hooks/exhaustive-deps`), as doing so causes the React Compiler to skip optimizing that component.

### Zustand: Always use selectors
Zustand stores are external to React and are not automatically optimized by the React Compiler.
- **Never** call `useAuthStore()` (or any Zustand hook) without selectors.
- **Always** pass a selector that returns only the specific fields needed:
  ```typescript
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  ```
- Store actions (e.g. `setUser`, `logout`) are stable references. Selecting only actions prevents unnecessary re-renders.

### Components Structure
- **Do not** define new component types inside another component's render (inline component definitions). Always extract child components to the module scope or a separate file so the React Compiler can correctly analyze the structure.

## Code style (tooling)

- **ESLint** + Prettier: no semicolons, single quotes, `printWidth` 100 — match `eslint.config.js`.
- Scripts: **`pnpm lint`** (check), **`pnpm lint:fix`** (auto-fix), **`pnpm dev`** (dev server), **`pnpm build`** (production).
- Run **`pnpm lint`** after substantive edits.

## Verification

- After substantive edits: **`pnpm lint`**

---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
