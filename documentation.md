# Frontend (React + Vite) — Technical Documentation

This document is the primary technical reference for the **`frontend-react-v1`** application as it exists in the repository today. It describes the actual code, configuration, and behavior found in the project. Where a detail cannot be confidently inferred from the codebase, the document states so explicitly.
test
---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Routing Documentation](#4-routing-documentation)
5. [API Integration](#5-api-integration)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [State Management](#7-state-management)
8. [UI Components & Design System](#8-ui-components--design-system)
9. [Forms & Validation](#9-forms--validation)
10. [Configuration](#10-configuration)
11. [Dependencies](#11-dependencies)
12. [Build & Deployment](#12-build--deployment)
13. [Known Issues / Technical Debt](#13-known-issues--technical-debt)
14. [Future Improvements](#14-future-improvements)
15. [Progressive Web App (PWA)](#15-progressive-web-app-pwa)

---

## 1. Project Overview

### Purpose

`frontend-react-v1` is a **React 19 + Vite 7** single-page application built on top of the **Berry Material UI** admin template (`berry-material-react-js`, version `5.1.0`). It serves as the administrator/operator dashboard for the FYP system whose backend is the Laravel application in `backend-laravel-v1`.

The frontend currently provides:

- A **JWT-protected dashboard layout** (header, sidebar, breadcrumbs, footer, theme customization).
- A **login flow** that calls the Laravel backend (`POST /login`, with fallback to `POST /auth/login`) and stores `access_token` in `localStorage`.
- A **route-guarded** structure that separates protected app routes (`MainRoutes`) from guest-only routes (`AuthenticationRoutes`).
- A **User Management module** under `feature/management-user` that lists, views, creates, updates, and deletes users via the backend `/users` endpoints. (Add/Edit pages exist but their routes are commented out — see [Section 13](#13-known-issues--technical-debt).)
- Sample dashboard widgets (charts, cards) inherited from the Berry template.
- Theme customization (light scheme + CSS variables) with font family / border radius adjustments persisted to `localStorage`.
- **Progressive Web App (PWA)** support via `vite-plugin-pwa` (service worker precache, web app manifest, optional **Install App** UI in the sidebar when the browser fires `beforeinstallprompt`).

### Core Functionality

| Area | Status | Notes |
|------|--------|-------|
| Login (JWT) | Implemented | `views/pages/auth-forms/AuthLogin.jsx`, persists token via `utils/auth.js`. |
| Logout | **Not implemented** | A “Logout” menu item exists in `Header/ProfileSection`, but it does **not** call any handler. |
| Register | **UI-only** | `AuthRegister.jsx` is a static form; no API call is wired. |
| Dashboard | Implemented (template) | Demo charts & cards. |
| User Management — list | Implemented | `feature/management-user/views/UserList.jsx`. |
| User Management — view | Implemented | `feature/management-user/views/UserView.jsx`. |
| User Management — add/edit | **Code present but routes disabled** | Components import non-existent files (`ui-component/FieldContainer`, `SuccessDialog`, etc.) and routes are commented out in `MainRoutes.jsx`. |
| Zone / Camera / Checkpoint management | **Partially implemented** | Zone module now includes service/repository/controller/view files and calls backend `/zones`; camera/checkpoint modules remain incomplete. |
| Theme Customization | Implemented | Font family + border radius drawer (toggle button itself is currently commented out). |
| Notifications | UI-only | Static demo data. |

### Main Modules / Features (as found in `src/`)

- `feature/management-user` — only fully-implemented business module.
- `views/dashboard/Default` — demo dashboard.
- `views/pages/authentication` — Login + Register pages.
- `views/utilities` — Typography / Color / Shadow showcase pages.
- `views/sample-page` — Berry template sample page.
- `layout/MainLayout`, `layout/MinimalLayout`, `layout/Customization` — application chrome.

### Versions (from `package.json`)

| Item | Version |
|------|---------|
| React | `19.2.0` |
| React DOM | `19.2.0` |
| React Router / Router DOM | `7.9.6` |
| Vite | `7.2.6` |
| `@vitejs/plugin-react` | `5.1.1` |
| Material UI (`@mui/material`) | `7.3.5` |
| `@mui/icons-material` | `7.3.5` |
| `@emotion/react` / `@emotion/styled` | `11.14.0` / `11.14.1` |
| `@tabler/icons-react` | `3.35.0` |
| ApexCharts / `react-apexcharts` | `5.3.6` / `1.9.0` |
| SWR | `2.3.7` |
| `framer-motion` | `12.23.25` |
| `yup` | `1.7.1` |
| Sass | `1.94.2` (devDependency) |
| Yarn | `4.10.3` (`packageManager`) |
| `vite-plugin-pwa` | `^1.3.0` (devDependency) — Workbox service worker + web manifest generation. |
| `workbox-window` | `^7.4.1` (devDependency) — Used by the PWA client registration path. |

### UI Libraries / Frameworks Used

- **Material UI v7** (`@mui/material`, `@mui/icons-material`) for all UI primitives.
- **Emotion** (`@emotion/react`, `@emotion/styled`) — MUI's styling engine.
- **Tabler Icons** (`@tabler/icons-react`) — primary icon set, with a Vite alias to its ESM build.
- **Framer Motion** — used by Berry's `AnimateButton` / `Transitions`.
- **ApexCharts** — dashboard charts.
- **SimpleBar React** — custom scrollbars in the **desktop** sidebar. On **mobile** (`useMediaQuery` / `downMD`), the sidebar’s scrollable region uses a native `overflow-y: auto` `Box` instead of the shared `SimpleBar` component: that wrapper uses `react-device-detect`’s `BrowserView` + `MobileView`, and on many phones both mount, which breaks the flex column and hides the pinned **Install App** button (see [Section 15](#15-progressive-web-app-pwa)).
- **Slick Carousel** — listed as a dependency (no usage detected in `src/`; carried from the Berry template).

### Main npm Packages

See [Section 11](#11-dependencies) for the full table.

### Frontend ↔ Backend Relationship

The frontend talks to the Laravel API in `backend-laravel-v1`. The relationship is:

- **Base URL:** `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8000/api`).
- **Auth scheme:** JWT bearer token (`Authorization: Bearer <token>`); token saved in `localStorage` under key `access_token`.
- **Endpoints actually called from the frontend:**
  - `POST /login` (with fallback to `POST /auth/login` on 404) — login.
  - `GET /users`, `GET /users/{id}`, `POST /users`, `PATCH /users/{id}`, `DELETE /users/{id}` — user CRUD.

No other backend endpoints are currently invoked from the frontend.

---

## 2. System Architecture

### Overall Frontend Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Browser (Vite SPA)                     │
│                                                         │
│   ┌───────────────────────────────────────────────┐    │
│   │ index.jsx — createRoot; registerSW() (PWA SW)  │    │
│   │   └── ConfigProvider (Context + localStorage)  │    │
│   │        └── App.jsx                             │    │
│   │             └── ThemeCustomization (MUI Theme) │    │
│   │                  └── NavigationScroll          │    │
│   │                       └── RouterProvider       │    │
│   └───────────────────────────────────────────────┘    │
│                                                         │
│   Routes: MainRoutes (protected) + AuthenticationRoutes │
│           (guest)                                       │
│                                                         │
│   ┌────────────────┐     ┌────────────────────────┐    │
│   │   MainLayout   │     │     MinimalLayout       │    │
│   │  (header,      │     │     (only <Outlet />)   │    │
│   │   sidebar,     │     └────────────────────────┘    │
│   │   breadcrumbs, │                                    │
│   │   customization│                                    │
│   │   drawer)      │                                    │
│   └────────────────┘                                    │
│                                                         │
│   Feature modules → controllers → repositories          │
│   ↓                                                     │
│   src/api/api.js (fetch wrapper, JWT, 401 redirect)     │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
              Laravel API (backend-laravel-v1)
                  http://localhost:8000/api
```

### Component Architecture

The codebase blends two styles:

- **Berry template style** — `views/`, `layout/`, `ui-component/`, `themes/`, `menu-items/` use the original Berry conventions (functional components, MUI styled APIs, lazy-loaded route components).
- **Feature/Clean-Architecture style** — `src/feature/management-user/` is organized as:

```
feature/management-user/
├── views/          # Page-level components (UserList, UserView, UserAdd, UserEdit)
├── components/     # Feature-specific reusable components (table rows, cards…)
├── controllers/    # React hooks containing business logic (useUserController, …)
├── repositories/   # Class-based repositories that wrap data sources
├── datasources/    # Real (HTTP) and mock data sources (userService, userDataSource)
└── styles/         # Feature-specific styled() components
```

Dependency injection is performed at the view level:

```jsx
const repository = new UserRepository(userService);
const controller = useUserController(repository);
```

This keeps views purely presentational while controllers own state, side effects, and navigation.

### Feature-Based Structure

`src/feature/` contains one folder per business domain. `management-user` is the most complete module; `management-zone` now has active data/service wiring, while `authentication`, `management-camera`, and `management-checkpoint` are still partially implemented.

### State Management Flow

There is **no Redux / Zustand**. State is managed at three levels:

1. **App config (global, persisted)** — `ConfigContext` + `useLocalStorage('berry-config-vite-js', config)`.
2. **App-wide ephemeral state via SWR** — `api/menu.js` uses `useSWR` purely as a global key/value cache to track sidebar drawer open/close (`isDashboardDrawerOpened`).
3. **Local component / controller state** — each feature controller hook (e.g. `useUserController`) owns its own `useState` / `useEffect`.

```
ConfigContext (theme, fontFamily, borderRadius, …) ─┐
                                                    │
SWR cache (isDashboardDrawerOpened)─────────────────┤
                                                    ▼
                                          Components & layouts
                                                    ▲
Controller hooks (per-feature) ─────────────────────┘
```

### API Communication Flow

```
View
 └─ controller hook (useState / useEffect)
      └─ Repository (class)
           └─ DataSource / Service (userService.js)
                └─ src/api/api.js (fetch wrapper)
                     ├─ adds Authorization: Bearer <token>
                     ├─ JSON body unless FormData
                     └─ on 401 → clearAuthToken() + redirect to /login
                          └─ Laravel API
```

### Routing Structure

```
createBrowserRouter([MainRoutes, AuthenticationRoutes], {
  basename: import.meta.env.VITE_APP_BASE_NAME // "/fyp" by default
})
```

- `MainRoutes` (`'/'`) → `<ProtectedRoute><MainLayout /></ProtectedRoute>`
- `AuthenticationRoutes` (`'/'`) → `<GuestRoute><MinimalLayout /></GuestRoute>`

See [Section 4](#4-routing-documentation) for the full table.

### Authentication Flow

```
   ┌─────────┐     submit form      ┌─────────────────┐
   │  Login  │ ───────────────────► │ POST /login or   │
   │  Page   │                       │ POST /auth/login │
   └────┬────┘                       └────────┬─────────┘
        │ 200 OK                              │
        │  data.access_token, data.user       │
        ▼                                     │
   localStorage:                              │
     access_token = <JWT>                     │
     auth_user    = <user JSON>               │
        │                                     │
        ▼                                     │
   navigate('/dashboard')                     │
                                              ▼
   Subsequent API calls ──► Authorization: Bearer <JWT>
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
              200/2xx OK              401 Unauthorized
                  │                           │
                  ▼                           ▼
           Render data         clearAuthToken() + window.location.replace('/login')
```

### Data Flow Between Frontend and Backend

For user list / view:

```
UserList.jsx
  → useUserController(repository)
      → repository.getAllUsers()
          → userService.getAllUsers()
              → api.get('/users')        # fetch GET /api/users with Bearer token
              ← { data: [...users] }     # response.data
          ← payload                      # response.data unwrapped
      ← payload
  → setUsers(payload.data)               # template stores list as `data.data`
  → repository.filterUsers / paginateUsers
  → render <UserTable />
```

---

## 3. Directory Structure

The repository is organized as a single Vite-React app at the project root.

```
frontend-react-v1/
├── index.html                # Vite entry
├── vite.config.mjs           # Vite + plugin config
├── jsconfig.json             # baseUrl: "src" (path aliases)
├── jsconfig.node.json        # Node-only config for vite.config.mjs
├── eslint.config.mjs         # Flat ESLint config
├── .prettierrc               # Prettier config
├── .env                      # Local env (VITE_*)
├── package.json              # Scripts + deps (Yarn 4 / Berry)
├── yarn.lock
├── README.md                 # Original CRA-style README (legacy)
├── documentation.md          # ← this file
├── public/                   # Static files copied to dist root (favicon, `icons/` for PWA manifest)
└── src/
    ├── App.jsx               # Mounts ThemeCustomization + RouterProvider
    ├── index.jsx             # createRoot + ConfigProvider + fonts + `registerSW` (vite-plugin-pwa)
    ├── config.js             # DASHBOARD_PATH, fontFamily, borderRadius defaults
    ├── reportWebVitals.js
    ├── vite-env.d.js         # `vite/client` + `vite-plugin-pwa/client` references
    ├── api/                  # Centralized HTTP client + SWR-based menu store
    ├── assets/               # SCSS + images (logo, auth backgrounds, user avatar)
    ├── contexts/             # ConfigContext (theme, persisted via localStorage)
    ├── feature/              # Feature/domain modules (Clean-Arch style)
    ├── hooks/                # Reusable React hooks
    ├── layout/               # MainLayout, MinimalLayout, Customization, …
    ├── menu-items/           # Sidebar menu definitions
    ├── routes/               # Router config + guards + ErrorBoundary
    ├── store/                # Theme constants only (NOT a state store)
    ├── themes/               # MUI theme: palette, typography, overrides
    ├── ui-component/         # Reusable presentational components
    ├── utils/                # Pure utilities (auth, color, password, image URL)
    └── views/                # Page-level components (dashboard, sample, utilities, auth pages)
```

### `src/api/`

| File | Purpose |
|------|---------|
| `api.js` | Centralized `fetch` wrapper. Builds headers (`Accept: application/json`, optional `Authorization: Bearer <token>`, JSON content-type unless `FormData`). Throws on non-2xx, attaches `error.status` and `error.data`. Redirects to `/login` and clears the token on `401`. Reads base URL from `VITE_API_BASE_URL` (fallback `http://localhost:8000/api`). |
| `menu.js` | Tiny SWR-based store for `isDashboardDrawerOpened`. Exposes `useGetMenuMaster()` (read) and `handlerDrawerOpen(value)` (write via `mutate`). Despite the file path, **no remote call is made** — the SWR fetcher just returns the initial state. |

### `src/feature/`

Multiple feature folders exist (e.g. `management-user`, `management-zone`, `patrol`, `feature/authentication`, …). The tree below documents **`management-user`** as the reference Clean-Architecture example.

```
feature/management-user/
├── components/
│   ├── index.js                     # Barrel: UserTable, UserTableToolbar, UserProfileCard, UserContactCard
│   ├── user-table/
│   │   ├── UserTable.jsx
│   │   ├── UserTableHeader.jsx
│   │   ├── UserTableRow.jsx
│   │   └── UserTableToolbar.jsx
│   ├── user-view/
│   │   ├── UserContactCard.jsx
│   │   ├── UserProfileCard.jsx
│   │   └── UserInfoItem.jsx
│   └── user-add/
│       └── UserAddProfile.jsx
├── controllers/
│   ├── useUserController.js         # List page logic (pagination, filter, CRUD nav, delete)
│   ├── useUserViewController.js     # Single user load + back/edit nav
│   ├── useUserAddController.js      # Create user (validation, submit, success modal)
│   └── useUserFormController.js     # Edit user (load + update; password excluded)
├── datasources/
│   ├── userService.js               # Real HTTP service (calls api.get/post/patch/delete)
│   └── userDataSource.js            # Hard-coded mock dataset (NOT used by current views)
├── repositories/
│   └── userRepository.js            # Class wrapper; pagination + client-side filter helpers
├── styles/
│   ├── StyledPaper.js
│   ├── InfoContainer.js
│   └── IconStyle.js
└── views/
    ├── UserList.jsx
    ├── UserView.jsx
    ├── UserAdd.jsx                  # Imports unresolved components — see Section 13
    └── UserEdit.jsx                 # Imports unresolved components — see Section 13
```

The other feature folders (`authentication/`, `management-camera/`, `management-checkpoint/`) remain sparse/incomplete; `management-zone/` now includes service/repository/controller/view files.

### `src/views/`

Page-level components rendered by routes:

| Folder / file | Purpose |
|---------------|---------|
| `dashboard/Default/` | Berry demo dashboard (Earnings card, Total Order line chart, Total Income light/dark cards, Total Growth bar chart, Popular card, Bajaj area chart). |
| `pages/authentication/Login.jsx` | Login page wrapper (uses `AuthWrapper1`, `AuthCardWrapper`). |
| `pages/authentication/Register.jsx` | Register page wrapper. |
| `pages/auth-forms/AuthLogin.jsx` | The actual login form — wired to `api.post('/login')`. |
| `pages/auth-forms/AuthRegister.jsx` | Static register form (no submit handler). |
| `pages/authentication/AuthWrapper1.jsx` | Styled `<div>` background for auth pages. |
| `pages/authentication/AuthCardWrapper.jsx` | `MainCard` wrapper used on auth pages. |
| `sample-page/index.jsx` | Berry sample page (lorem ipsum card). |
| `utilities/Typography.jsx` | Typography showcase. |
| `utilities/Color.jsx` | Color showcase. |
| `utilities/Shadow.jsx` | Shadow showcase. |

### `src/layout/`

| Folder / file | Purpose |
|---------------|---------|
| `MainLayout/index.jsx` | Sticky AppBar header, sidebar, breadcrumbs (`ui-component/extended/Breadcrumbs`), `<Outlet />`, footer, `Customization` drawer. |
| `MainLayout/Header/` | Logo, drawer toggle button, `NotificationSection`, `ProfileSection`. (`SearchSection` is commented out.) |
| `MainLayout/Sidebar/` | Drawer + mini drawer + `MenuList` + (empty) `MenuCard` + `SidebarPwaInstall` (PWA install CTA when supported). |
| `MainLayout/MenuList/` | `NavGroup`, `NavItem`, `NavCollapse` — render the menu tree from `menu-items/`. |
| `MainLayout/HorizontalBar.jsx` | Alternate horizontal menu bar (defined but **not mounted** by `MainLayout`). |
| `MainLayout/Footer.jsx` | Static footer with CodedThemes / GitHub / Figma links. |
| `MinimalLayout/index.jsx` | Bare layout (just `<Outlet />`) used by guest pages. |
| `Customization/` | Right-side drawer for live theme tweaks: `FontFamily`, `BorderRadius`. The Fab toggle is currently commented out, so the drawer is mounted but has no UI to open it. |
| `NavigationScroll.jsx` | Smooth-scrolls to top once on mount. |

### `src/ui-component/`

Reusable presentational components.

| File | Purpose |
|------|---------|
| `Loadable.jsx` | HOC that wraps lazy-loaded route components in `<Suspense fallback={<Loader />}>`. |
| `Loader.jsx` | Top-of-page `LinearProgress` indicator. |
| `Logo.jsx` | App logo (Berry SVG). |
| `MalaysiaTime.jsx` | Formats a date in `Asia/Kuala_Lumpur` time zone using `Intl.DateTimeFormat` (`en-MY`, `dateStyle: 'medium'`, `timeStyle: 'short'`). Renders a `fallback` when value is missing/invalid. |
| `cards/MainCard.jsx` | Standard card with header / divider / content slots. |
| `cards/DetailCard.jsx` | Variant of `MainCard` with built-in “Back” button (used by user view/add/edit). |
| `cards/SubCard.jsx`, `cards/AuthFooter.jsx`, `cards/CardSecondaryAction.jsx` | Berry card variants. |
| `cards/TotalIncomeDarkCard.jsx`, `cards/TotalIncomeLightCard.jsx` | Dashboard income widgets. |
| `cards/Skeleton/*` | MUI Skeleton placeholders for the dashboard widgets. |
| `extended/AnimateButton.jsx` | Framer-motion-driven button animations. |
| `extended/Transitions.jsx` | MUI `Grow`/`Fade` transitions used by popovers. |
| `extended/Breadcrumbs.jsx` | Auto-generated breadcrumbs from `menu-items` + current path. |
| `extended/Avatar.jsx`, `extended/AppBar.jsx`, `extended/Accordion.jsx`, `extended/ImageList.jsx` | Berry MUI extensions. |
| `extended/Form/CustomFormControl.jsx`, `FormControl.jsx`, `FormControlSelect.jsx`, `InputLabel.jsx` | Styled form controls used by login form / Berry pages. |
| `table/PaginationFooter.jsx` | Generic “rows per page + page index + MUI Pagination” footer (used by User Management). |
| `third-party/SimpleBar.jsx` | Wrapper around `simplebar-react` for custom scrollbars. Renders `BrowserView` (SimpleBar) and `MobileView` (plain `Box`) — **the main layout sidebar on small screens does not use this** for the menu scroller; see `layout/MainLayout/Sidebar/index.jsx`. |

### `src/hooks/`

| Hook | Purpose |
|------|---------|
| `useConfig` | Implemented in `contexts/ConfigContext.jsx` and re-exported as default from `hooks/useConfig.js`. Returns `{ state, setState, setField, resetState }`. If React context cannot be resolved (e.g. duplicate React bundles in edge builds), logs a **one-time warning** and returns **non-persistent defaults** so the app still renders instead of throwing. |
| `useLocalStorage(key, defaultValue)` | Generic `useState`-backed local-storage hook with `setField` and `resetState` helpers. Backs `ConfigContext`. |
| `useMenuCollapse` | Walks the menu tree and auto-expands the parent menu of the current pathname (uses `react-router-dom#matchPath`). |
| `useScriptRef` | Tiny `useRef` helper that flips to `false` after mount; used to guard async state updates after unmount. |
| `usePwaInstallPrompt` | Listens for `beforeinstallprompt` / `appinstalled`, tracks standalone mode (`matchMedia`, `navigator.standalone`), exposes `showInstallButton` and `promptInstall`. Safe on browsers without PWA install APIs (guarded `matchMedia` / legacy `MediaQueryList.addListener`). |

### `src/utils/`

| File | Purpose |
|------|---------|
| `auth.js` | Token storage utilities. Exports `AUTH_TOKEN_KEY = 'access_token'`, `getAuthToken`, `hasAuthToken`, `setAuthToken`, `clearAuthToken`. |
| `colorUtils.js` | `hexToRgbChannel`, `extendPaletteWithChannels`, `withAlpha` — hex→rgb channel string and CSS-var-aware alpha handling for the MUI palette. |
| `getImageUrl.js` | Builds an `import.meta.url`-relative image path (`/src/assets/images/<path>/<name>`). |
| `password-strength.js` | Pure scoring functions used by the (static) Register form: `strengthIndicator`, `strengthColor`. |

### `src/contexts/`

| File | Purpose |
|------|---------|
| `ConfigContext.jsx` | Defines `ConfigContext`, `ConfigProvider`, and **`useConfig`** in one module so provider and hook always share the same context identity. Persists Berry UI prefs via `useLocalStorage('berry-config-vite-js', appConfig)`. Default context uses a **sentinel** (`Symbol`) so “outside provider” is distinguishable from legitimate values; **fallback path** avoids crashing when duplicate React copies break `useContext`. |

### `src/store/`

Despite the name, this is **not** a state-management store.

| File | Purpose |
|------|---------|
| `constant.js` | Constants only: `gridSpacing = 3`, `drawerWidth = 260`, `appDrawerWidth = 320`. |

### `src/themes/`

MUI theme definition.

| File | Purpose |
|------|---------|
| `index.jsx` | Builds the MUI theme using `createTheme` with `colorSchemes.light` and CSS variables (`cssVarPrefix`, `colorSchemeSelector: 'data-color-scheme'`). Composes palette, typography, custom shadows, and component overrides. |
| `palette.jsx` | `buildPalette(presetColor)` — builds the palette from preset color sets. |
| `typography.jsx` | Builds typography from a chosen `fontFamily`. |
| `custom-shadows.jsx` | Custom MUI shadow tokens. |
| `theme/default.js` | Default named color tokens (primary/secondary/success/error/orange/warning/grey + dark variants). |
| `overrides/*.jsx` | Per-component MUI overrides (Button, Chip, Paper, Tabs, …). |

### `src/menu-items/`

| File | Purpose |
|------|---------|
| `index.js` | Aggregates `[dashboard, admin, pages, utilities, other]`. |
| `dashboard.js` | Dashboard group with one item → `/dashboard/default`. |
| `admin.js` | Admin group → Management collapse with **User**, **Zone**, **Camera** items. (Zone & Camera URLs exist in the menu but the corresponding routes are not registered.) |
| `pages.js` | Authentication collapse: Login (`/pages/login`) + Register (`/pages/register`). |
| `utilities.js` | Typography, Color, Shadow links. |
| `other.js` | Sample page + external link to Berry docs. |

### `src/assets/`

| Path | Purpose |
|------|---------|
| `scss/style.scss` | Global styles (apexcharts theming, keyframes for `wings`, `bounce`, `slideX/Y`, `blink`). Imports `simplebar-react/dist/simplebar.min.css`. |
| `images/logo.svg`, `logo-dark.svg` | App logo. |
| `images/auth/*.svg` | Authentication background patterns (light + dark). |
| `images/users/user-round.svg` | Default user avatar for the profile chip. |
| `images/icons/google.svg`, `earning.svg` | Misc icons. |

---

## 4. Routing Documentation

Routing uses **React Router v7** object routes via `createBrowserRouter`. The `basename` is set to `VITE_APP_BASE_NAME` (default `/fyp`).

### Top-Level Tree

```jsx
const router = createBrowserRouter(
  [MainRoutes, AuthenticationRoutes],
  { basename: import.meta.env.VITE_APP_BASE_NAME }
);
```

| Group | Path | Wrapper | Layout |
|-------|------|---------|--------|
| `MainRoutes` | `/` | `<ProtectedRoute>` | `MainLayout` |
| `AuthenticationRoutes` | `/` | `<GuestRoute>` | `MinimalLayout` |

> Both groups declare `path: '/'`. React Router resolves child routes by their `path` segments, and the route guards (`ProtectedRoute` / `GuestRoute`) decide which group is reachable for the current visitor.

### Public (Guest) Routes

Defined in `src/routes/AuthenticationRoutes.jsx`. Wrapped in `GuestRoute` — authenticated users are redirected to `/dashboard`.

| Path | Component | Layout | Purpose |
|------|-----------|--------|---------|
| `/login` | `views/pages/authentication/Login` | `MinimalLayout` | JWT login form. |
| `/pages/login` | _redirect_ | `MinimalLayout` | `<Navigate to="/login" replace />` (legacy compatibility). |
| `/pages/register` | `views/pages/authentication/Register` | `MinimalLayout` | Static register page (UI only). |

### Protected Routes

Defined in `src/routes/MainRoutes.jsx`. Wrapped in `ProtectedRoute` — unauthenticated visitors are redirected to `/login` (with `state.from = location`).

| Path | Component | Layout | Purpose |
|------|-----------|--------|---------|
| `/` | _redirect_ | `MainLayout` | `<Navigate to="/dashboard" replace />`. |
| `/dashboard` | `views/dashboard/Default` | `MainLayout` | Default dashboard. |
| `/dashboard/default` | `views/dashboard/Default` | `MainLayout` | Same as above (kept for menu compatibility). |
| `/admin/management-user` | `feature/management-user/views/UserList` | `MainLayout` | User Management list. |
| `/admin/management-user/view/:userId` | `feature/management-user/views/UserView` | `MainLayout` | User detail page. |
| `/typography` | `views/utilities/Typography` | `MainLayout` | Typography showcase. |
| `/color` | `views/utilities/Color` | `MainLayout` | Color showcase. |
| `/shadow` | `views/utilities/Shadow` | `MainLayout` | Shadow showcase. |
| `/sample-page` | `views/sample-page` | `MainLayout` | Berry sample page. |

### Admin Routes

The application currently has a single admin namespace (`/admin/*`) under `MainRoutes`. There is no separate admin layout or role check — access is gated only by JWT presence.

| Path | Component | Notes |
|------|-----------|-------|
| `/admin/management-user` | `UserList` | Active route. |
| `/admin/management-user/view/:userId` | `UserView` | Active route. |
| `/admin/management-user/add` | `UserAdd` | **Disabled** (route is commented out in `MainRoutes.jsx`). |
| `/admin/management-user/edit/:userId` | `UserEdit` | **Disabled** (route is commented out in `MainRoutes.jsx`). |

### Staff / Customer Routes

Unable to determine from current implementation. No staff-specific or customer-specific route groups exist in the codebase.

### Route Guards

Both guards live in `src/routes/guards/`.

#### `ProtectedRoute`

```7:14:src/routes/guards/ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
```

- Reads token presence via `utils/auth#hasAuthToken()`.
- Redirects to `/login` and stores the originally requested location in `state.from`.
- Note: the saved `state.from` is **not yet consumed** anywhere (the login flow always navigates to `/dashboard`).

#### `GuestRoute`

```6:12:src/routes/guards/GuestRoute.jsx
export default function GuestRoute({ children }) {
  if (hasAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
```

- If a token exists, the user is bounced to `/dashboard`.

### Redirect Behavior Summary

| Trigger | Result |
|---------|--------|
| `/` (no token) | `ProtectedRoute` → `/login`. |
| `/` (with token) | `MainRoutes` index → `/dashboard`. |
| `/login` (with token) | `GuestRoute` → `/dashboard`. |
| `/pages/login` | Always redirected to `/login`. |
| API responds `401` | `clearAuthToken()` + `window.location.replace('/login')`. |

### Unauthorized / Error Handling

`src/routes/ErrorBoundary.jsx` defines a `react-router` `ErrorBoundary` that maps `error.status` to MUI alerts (`404`, `401`, `503`, `418`, falls back to “Under Maintenance”). However, **it is not currently registered** on either route group via `errorElement`, so router-level errors fall back to the default React Router boundary. See [Section 13](#13-known-issues--technical-debt).

---

## 5. API Integration

### Base URL Setup

`src/api/api.js`:

```4:4:src/api/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

The base URL is read from `VITE_API_BASE_URL` (see [Section 10](#10-configuration)) with `http://localhost:8000/api` as a hard-coded fallback. Vite's `base` is independently set from `VITE_APP_BASE_NAME` in `vite.config.mjs` (used as the SPA's public path).

### HTTP Client

The frontend uses the **native `fetch` API** wrapped in a small client. **Axios is not used.**

`src/api/api.js` exposes:

```js
const api = {
  get:    (url, options)        => request('GET',    url, undefined, options),
  post:   (url, data, options)  => request('POST',   url, data,      options),
  put:    (url, data, options)  => request('PUT',    url, data,      options),
  patch:  (url, data, options)  => request('PATCH',  url, data,      options),
  delete: (url, options)        => request('DELETE', url, undefined, options),
};
```

Behavior of `request()`:

1. **Headers** built by `buildHeaders()`:
   - Always: `Accept: application/json`.
   - If `getAuthToken()` returns a value: `Authorization: Bearer <token>`.
   - If body is **not** `FormData` and a body is being sent: `Content-Type: application/json`.
   - Caller-supplied headers are merged in.
2. **Body** is auto-serialized (`JSON.stringify`) unless it is `FormData`.
3. **Response parsing**:
   - If `Content-Type` includes `application/json` → parse JSON; else `await response.text()`.
4. **Error handling**:
   - `401` → `clearAuthToken()` + redirect to `/login` (only if not already there). Throws `Error('Unauthorized')`.
   - Other non-`ok` → throws `Error('API request failed')` with `error.status` and `error.data` attached.
5. **Success return shape**: `{ data, status, headers }`.

### API Service Structure

Per-feature services wrap `api.*` calls and normalize responses. `userService` and `zoneService` are implemented.

`src/feature/management-user/datasources/userService.js`:

| Method | HTTP call | Notes |
|--------|-----------|-------|
| `getAllUsers()` | `api.get('/users')` | Throws a normalized service error on failure. |
| `getUserById(id)` | `api.get('/users/{id})` | |
| `createUser(userData)` | `api.post('/users', userData)` | |
| `updateUser(id, userData)` | `api.patch('/users/{id}', userData)` | |
| `deleteUser(id)` | `api.delete('/users/{id}')` | |

It also normalizes errors via `buildServiceError()`:

- Reads `error.status` + `error.data?.message`.
- Maps `401` → "Unauthorized. Please log in again." and `403` → "Forbidden. Admin access is required."
- Re-throws an `Error` with `status`, `data`, and `originalError` attached.

`extractResponsePayload(response)` then returns `response.data` (the parsed JSON body), so callers receive the raw backend payload.

`src/feature/management-zone/datasources/zoneService.js`:

| Method | HTTP call | Notes |
|--------|-----------|-------|
| `getAllZones()` | `api.get('/zones')` | Returns parsed backend payload from Laravel zone list endpoint. |
| `getZoneById(id)` | `api.get('/zones/{id}')` | |
| `createZone(zoneData)` | `api.post('/zones', zoneData)` | Admin-only route on backend. |
| `updateZone(id, zoneData)` | `api.patch('/zones/{id}', zoneData)` | Uses PATCH to match Laravel `PUT/PATCH` update route. |
| `deleteZone(id)` | `api.delete('/zones/{id}')` | Handles backend `204 No Content` responses safely. |

Like `userService`, `zoneService` maps `401` and `403` to user-friendly service errors (`Unauthorized...` / `Forbidden...`) and rethrows with `status`, `data`, and `originalError`.

### Authentication Token Handling

- Token is stored in `localStorage` under the key `access_token` (`utils/auth.js#AUTH_TOKEN_KEY`).
- Every request automatically attaches the token via `buildHeaders` if present.
- The frontend additionally stores the user object under `auth_user` (set by `AuthLogin` after login).

### Request / Response Interceptors

There are **no axios-style interceptors**. Equivalent behavior is implemented inline inside `request()`:

- Pre-flight: `buildHeaders()` injects `Authorization`.
- Post-flight: `401` handling, content-type sniffing, and structured error throwing.

### Error Handling Strategy

| Layer | Behavior |
|-------|----------|
| `api.js` | Throws on non-2xx; carries `status` + `data`. Handles `401` globally. |
| Service (`userService`) | Catches the low-level error, maps to a friendlier message, re-throws as a normalized `Error`. |
| Repository (`userRepository`) | Logs to console and rethrows. |
| Controller (`useUserController`, etc.) | `try/catch` around repository calls. On error: `console.error` + `window.alert(...)`. |
| Login form | Extracts the most user-friendly message via `extractErrorMessage()` (Laravel-style `data.errors`, then `message`, then a generic fallback) and shows it inline. |

### API Utilities / Helpers

- `buildHeaders()` — builds request headers with optional token + JSON content-type.
- `request()` — central low-level fetch wrapper.
- `buildServiceError()` (per-service) — error normalization.
- `extractResponsePayload()` (per-service) — unwraps the `data` field from the `api.*` return value.

### Main Backend Endpoints Used

| Frontend caller | Method | Path |
|-----------------|--------|------|
| `AuthLogin` (primary) | `POST` | `/login` |
| `AuthLogin` (fallback on 404) | `POST` | `/auth/login` |
| `userService.getAllUsers` | `GET` | `/users` |
| `userService.getUserById` | `GET` | `/users/{id}` |
| `userService.createUser` | `POST` | `/users` |
| `userService.updateUser` | `PATCH` | `/users/{id}` |
| `userService.deleteUser` | `DELETE` | `/users/{id}` |
| `zoneService.getAllZones` | `GET` | `/zones` |
| `zoneService.getZoneById` | `GET` | `/zones/{id}` |
| `zoneService.createZone` | `POST` | `/zones` |
| `zoneService.updateZone` | `PATCH` | `/zones/{id}` |
| `zoneService.deleteZone` | `DELETE` | `/zones/{id}` |

### Frontend ↔ Laravel Communication

- Token comes back as `data.access_token` from the login response (matches the documented Laravel JWT contract).
- All subsequent calls send `Authorization: Bearer <token>`.
- `Content-Type` is `application/json` for non-`FormData` requests; the backend Laravel API is JSON-first.
- The frontend assumes Laravel-style validation responses (`data.errors` or `errors` keyed by field with array of messages) when extracting login error messages.

---

## 6. Authentication & Authorization

### Login Flow

Implemented in `src/views/pages/auth-forms/AuthLogin.jsx`.

1. User submits the login form (email + password).
2. Client-side validation:
   - Email is required and must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
   - Password is required (no length/complexity rule).
3. `submitLogin(payload)`:
   - First tries `POST /login`.
   - If the call throws `error.status === 404`, retries `POST /auth/login`.
4. On success, the response is unpacked as:

   ```js
   const responseData = response?.data?.data || {};
   const token = responseData.access_token;
   const user  = responseData.user;
   ```

5. The token must be present, otherwise the form throws `'Missing access token from login response.'`.
6. `setAuthToken(token)` writes `access_token` to `localStorage`.
7. If a user object exists, it is also persisted: `localStorage.setItem('auth_user', JSON.stringify(user))`.
8. Navigation: `navigate('/dashboard', { replace: true })`.

On failure, `extractErrorMessage(error)` produces a user-facing message:

- First validation error from `error.data.data.errors` or `error.data.errors`.
- Otherwise `error.data.message`.
- Otherwise `'Login failed. Please try again.'`.

If the error status is `401`, the password input is cleared.

### Logout Flow

Unable to determine from current implementation — there is **no logout handler** wired in the UI.

- The Profile menu (`layout/MainLayout/Header/ProfileSection/index.jsx`) renders a static "Logout" `ListItemButton`, but it has no `onClick` handler that calls `clearAuthToken()` or invalidates the backend session.
- A logout endpoint exists on the backend (`POST /auth/logout`), but it is not yet called from the frontend.

### Registration Flow

The Register page (`/pages/register`) uses `AuthRegister.jsx`, which is a **purely visual form**:

- Inputs are uncontrolled, with `value` hard-coded to `"Jhones"`, `"Doe"`, etc.
- The `Sign up` button has `type="submit"` but no `onSubmit` handler is registered on the surrounding `<form>` (there is no `<form>` element).
- No registration API call is made.

### JWT / Token Storage

| Item | Value |
|------|-------|
| Storage backend | `localStorage` |
| Token key | `access_token` (`utils/auth#AUTH_TOKEN_KEY`) |
| User key | `auth_user` (set by `AuthLogin` after login) |
| Helper API | `getAuthToken()`, `hasAuthToken()`, `setAuthToken(token)`, `clearAuthToken()` |

Centralizing the key avoids duplicated `localStorage.getItem('access_token')` calls.

### Token Refresh Behavior

Unable to determine from current implementation — no refresh-token flow is implemented on the frontend. Expiry is detected only when the backend responds `401`, at which point `api.js` clears the token and forces a full-page redirect to `/login`.

### Route Protection

See [Section 4](#4-routing-documentation). Implemented entirely client-side via:

- `ProtectedRoute` (token must exist).
- `GuestRoute` (token must NOT exist).
- Global `401` handler in `api.js` (clears token + redirects).

### Role-Based Rendering / Permission Handling

Unable to determine from current implementation — there are no role-based components, no permission helpers, and no role check inside the route guards. The persisted `auth_user` object is **stored** but never **consumed** in the codebase outside being saved.

The `userService` does map a `403` response to `"Forbidden. Admin access is required."`, which is the only place where role/permission semantics surface in the frontend code.

### Session Persistence

- Page reloads keep the user logged in because `access_token` lives in `localStorage`.
- There is no cross-tab synchronization (no `storage` event listeners).
- A "Keep me logged in" checkbox exists in the login form but is **not used** when storing the token.

### Redirect Handling After Login / Logout

- After successful login: always `navigate('/dashboard', { replace: true })`. The `state.from` saved by `ProtectedRoute` is **not** consumed.
- After `401`: `window.location.replace('/login')` (full page reload) unless already at `/login`.
- After logout: Unable to determine from current implementation — no logout flow exists.

---

## 7. State Management

### Approach

The project deliberately avoids a global state library. State is split between:

| Layer | Mechanism | Used for |
|-------|-----------|----------|
| App config | `ConfigContext` (React Context) backed by `useLocalStorage` | Theme + UI preferences (font, border radius, miniDrawer, presetColor, container, outlinedFilled, …). |
| App-wide ephemeral | SWR (`api/menu.js`) | Sidebar drawer open/close (`isDashboardDrawerOpened`). |
| Per-feature business state | Custom controller hooks (`useUserController`, etc.) | Lists, paging, filters, form state, loading, errors. |
| Component-local | `useState` | UI toggles (popovers, drawers, dialog open). |

### Global State Flow

```
┌──────────────────────────┐
│   ConfigProvider         │  ← src/contexts/ConfigContext.jsx
│   (LocalStorage backed)  │
└──────────┬───────────────┘
           │ via useConfig() hook
           ▼
   ThemeCustomization (themes/index.jsx)
   MainLayout (drawer / mini-drawer)
   Customization drawer (font + border radius)
```

`ConfigContext.jsx` exposes:

```jsx
const { state, setState, setField, resetState } = useLocalStorage('berry-config-vite-js', config);
```

The **`useConfig`** hook lives in the same file as `ConfigProvider` so the context object is never duplicated by split chunks. If `useContext` still sees the empty sentinel (duplicate React in rare builds), the hook logs once and returns **in-memory defaults** with no-op setters so the app does not white-screen.

- `state` — current config object.
- `setState(next)` — replace.
- `setField(key, value)` — partial update.
- `resetState()` — restore defaults from `src/config.js`.

### Shared State Handling

The sidebar uses **SWR as a tiny shared state container**:

```13:18:src/api/menu.js
export function useGetMenuMaster() {
  const { data, isLoading } = useSWR(endpoints.key + endpoints.master, () => initialState, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
```

- `useGetMenuMaster()` — read.
- `handlerDrawerOpen(value)` — write via `mutate('api/menumaster', updater, false)`.

`MainLayout`, `Header`, and `Sidebar` all read this state to keep the drawer in sync without prop-drilling.

### Local Component / Controller State

Each user-management controller exposes only the slice the view needs.

`useUserController` (`src/feature/management-user/controllers/useUserController.js`) state:

| State | Default | Purpose |
|-------|---------|---------|
| `users` | `[]` | All users from the API. |
| `page` | `0` | Current pagination page (0-indexed). |
| `rowsPerPage` | `5` | Page size; selectable: 5 / 10 / 25. |
| `filterText` | `''` | Filter applied to name/email/phone. |
| `loading` | `true` | Initial fetch indicator. |

Controllers also expose handlers (`handleChangePage`, `handleChangeRowsPerPage`, `handleFilterChange`, `handleAddUser`, `handleViewUser`, `handleEditUser`, `handleDeleteUser`).

### Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useConfig` | `contexts/ConfigContext.jsx` (re-export `hooks/useConfig.js`) | Theme/config API; fallback path if context is broken by duplicate React (see `contexts/ConfigContext.jsx`). |
| `useLocalStorage` | `hooks/useLocalStorage.js` | Generic LocalStorage-backed `useState`. |
| `useMenuCollapse` | `hooks/useMenuCollapse.js` | Auto-expands the parent menu of the active route. |
| `useScriptRef` | `hooks/useScriptRef.js` | Tracks mounted state for guarded async updates. |
| `usePwaInstallPrompt` | `hooks/usePwaInstallPrompt.js` | PWA install prompt capture (`beforeinstallprompt`), standalone detection, `promptInstall`. |
| `useUserController` | `feature/management-user/controllers/...` | Business logic for user list. |
| `useUserViewController` | same | Business logic for user detail. |
| `useUserAddController` | same | Business logic for create form. |
| `useUserFormController` | same | Business logic for edit form. |
| `useGetMenuMaster` | `api/menu.js` | SWR-backed sidebar state. |

### Loading / Error State Management

- Each controller hook owns its own `loading` boolean.
- Errors are handled with `console.error` plus `window.alert(...)` in the user-management controllers, or inline form helper text in the login form.
- There is no unified toast / snackbar / notification provider.

### Data-Fetching Patterns

- **Imperative fetch in controllers** (User Management): `useEffect(() => loadX(), [...])` + `setState`. No caching, no automatic refetch, no optimistic updates.
- **SWR** is imported and used in only one place (`api/menu.js`) — and not for actual remote fetching.

---

## 8. UI Components & Design System

### Reusable UI Components

See [Section 3 → `src/ui-component`](#srcui-component). The most reused are:

| Component | Used by |
|-----------|---------|
| `MainCard` | Almost every page wrapper. |
| `DetailCard` | User detail / add / edit pages. |
| `Loadable` | All lazy-loaded route components. |
| `Loader` | Layout suspense fallback. |
| `PaginationFooter` | User Management list. |
| `MalaysiaTime` | User table + user detail (timestamps). |
| `Transitions` | Header popovers. |
| `AnimateButton` | Primary CTA buttons. |
| `Breadcrumbs` (extended) | `MainLayout` body. |

### Layout Components

| Layout | Path | Used by |
|--------|------|---------|
| `MainLayout` | `layout/MainLayout/index.jsx` | All protected routes. |
| `MinimalLayout` | `layout/MinimalLayout/index.jsx` | All guest routes. |
| `HorizontalBar` | `layout/MainLayout/HorizontalBar.jsx` | Defined but not mounted in current code path. |
| `Customization` | `layout/Customization/index.jsx` | Mounted by `MainLayout` (drawer-only; toggle Fab is commented out). |

### Navigation Components

- **Sidebar** (`Sidebar/index.jsx`) — switches between MUI `<Drawer>` (mobile / mini-drawer mode) and a styled permanent drawer (`MiniDrawerStyled`). **Desktop:** `MenuList` + `MenuCard` live inside `SimpleBar`. **Mobile:** a flex column uses a native scrolling `Box` for the menu and pins **Install App** (`SidebarPwaInstall`) under it when the PWA install prompt is available. `usePwaInstallPrompt()` is called on `Sidebar` so `beforeinstallprompt` is captured even when the drawer starts closed.
- **MenuList** (`MenuList/index.jsx`) — renders the menu tree (`menu-items/index.js`). Uses `NavGroup` → `NavCollapse` → `NavItem`.
- **Header** (`Header/index.jsx`) — Logo + drawer toggler + `NotificationSection` + `ProfileSection`.
- **Breadcrumbs** (`ui-component/extended/Breadcrumbs.jsx`) — auto-derived from the current path + menu items.

### Tables / Charts / Cards

| Type | Where |
|------|-------|
| Table | `feature/management-user/components/user-table/UserTable.jsx` (MUI `<Table>` + `<TableContainer>`). |
| Pagination | `ui-component/table/PaginationFooter.jsx` (MUI `Pagination` + rows-per-page `Select`). |
| Charts | `react-apexcharts` in `views/dashboard/Default/*` (line, bar, area). |
| Cards | `MainCard`, `DetailCard`, `SubCard`, `EarningCard`, `TotalIncomeDarkCard`, `TotalIncomeLightCard`, `PopularCard`. |

### Modal / Toast / Alert Systems

- **Alerts** are used only in `routes/ErrorBoundary.jsx` (inline MUI `<Alert>` for HTTP error codes).
- **Toasts/snackbars**: Unable to determine from current implementation — none are wired.
- **Modal/Dialog**: User add/edit pages reference a `SuccessDialog` from `ui-component/dialogs/SuccessDialog`, but **that file does not exist** (see [Section 13](#13-known-issues--technical-debt)).
- For destructive actions (e.g. "Delete user"), the project uses native `window.confirm()` and `window.alert()`.

### Form Components

- `CustomFormControl` (Berry's styled MUI `<FormControl>`) — used in login/register forms.
- `OutlinedInput` + `InputLabel` + `FormHelperText` — MUI primitives.
- Feature views (UserAdd / UserEdit) reference `FieldContainer`, `SelectFieldContainer`, `SectionHeader`, and `SubmitButton` from `ui-component/...`, which are **not present in the codebase**. See [Section 13](#13-known-issues--technical-debt).

### Styling Approach

- **Material UI v7** is the primary styling system, using its `styled()` API and `sx` prop.
- **Emotion** is the underlying engine.
- **CSS variables** are enabled via `cssVariables.cssVarPrefix` and `colorSchemeSelector: 'data-color-scheme'`. Components frequently read `theme.vars.palette.*` instead of `theme.palette.*`.
- **SCSS** is used for a single global stylesheet (`src/assets/scss/style.scss`) — keyframes, ApexCharts theming overrides, and `simplebar` import.

### CSS Framework / Library

- No utility-CSS framework (no Tailwind, no Bootstrap).
- Berry's MUI theme + `styled()` is the design system.

### Theme / Color Usage

- Defined in `src/themes/`. Default tokens live in `themes/theme/default.js`.
- Theme uses MUI v7 **color schemes** with a `light` scheme defined; dark mode is **not** explicitly provided in this codebase (`createTheme` only declares `colorSchemes.light`). However, the default config is `DEFAULT_THEME_MODE = 'system'` (`config.js`), which is passed to `<ThemeProvider defaultMode={DEFAULT_THEME_MODE}>`. Without a `colorSchemes.dark`, system dark mode preference cannot fully apply.

### Responsive Design Handling

- Breakpoints come from MUI: `useMediaQuery(theme.breakpoints.down('md' | 'sm'))`.
- Pages adapt with the `Grid size={{ xs: 12, md: 6 }}` API.
- `Sidebar` switches between temporary/persistent/mini drawer based on screen size and config.
- `PaginationFooter` and `UserTableToolbar` collapse to a column layout on `xs`.

---

## 9. Forms & Validation

### Form Architecture

There are two patterns in the code:

1. **Berry / direct MUI** — used by `AuthLogin.jsx` and `AuthRegister.jsx` (standalone `useState`).
2. **Controller-driven** — used by User Management forms. The controller hook (`useUserAddController`, `useUserFormController`) owns `formData`, `errors`, `loading`, and exposes `handleChange(field)`, `handleSubmit(event)`, `handleCancel()`.

### Validation Libraries Used

- `yup` (1.7.1) is **listed in `package.json`** but no `import yup` / schema definition is present in `src/`. All current validation is hand-written.
- `prop-types` is used at runtime where present.

### Validation Patterns

#### Login (`AuthLogin.jsx`)

- Inline `validateForm()`:
  - Required: email, password.
  - Email format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.

#### User Add (`useUserAddController.js`)

| Field | Rule |
|-------|------|
| `full_name` | Required (trimmed). |
| `username` | Required (trimmed). |
| `email` | Required + must match `/\S+@\S+\.\S+/`. |
| `phone_number` | Required + must reduce to 10–15 digits via `/^\d{10,15}$/.test(replace(/\D/g, ''))`. |
| `address` | Required (trimmed). |
| `role` | Required (trimmed). |
| `password` | Required + minimum 8 characters. (Stronger uppercase/lowercase/number policy is commented out.) |

#### User Edit (`useUserFormController.js`)

Same as Add **minus** the password rule. Password is excluded from `formData` entirely in edit mode.

### Error Display Handling

- Per-field errors live in `controller.errors[field]` and are rendered as MUI `helperText` + the `error` boolean on the input.
- Submit-level errors:
  - Login form → `submitError` rendered as a `<FormHelperText error>`.
  - User Add/Edit → `console.error` + `window.alert('Failed to ...: ' + error.message)`.

### Create / Edit Form Flows

```
UserAdd / UserEdit page
  ▼
useUserAddController / useUserFormController
  ▼
validate()
  └── on fail → setErrors() and return
  └── on pass:
        repository.createUser / updateUser
          └── userService.createUser / updateUser
                └── api.post / api.patch
        → on success: setShowSuccessModal(true)
              → useEffect 2s timer → handleModalClose() → navigate(`/admin/userManagement/view/${id}`)
        → on failure: alert('Failed to ...')
```

> The success-flow `navigate()` calls hard-code the path `/admin/userManagement/...`, which **does not match** the registered route prefix `/admin/management-user/...`. This is an existing bug — see [Section 13](#13-known-issues--technical-debt).

### Client-Side Validation

All validation is client-side (regex + truthiness). The backend's validation responses are surfaced to the user only through the global error-message extraction logic in `AuthLogin.extractErrorMessage()`.

### File Upload Handling

`useUserAddController` and `useUserFormController` contain handlers for profile-image upload (`handleImageUpload`, `handleRemoveImage`, `previewUrl`, `fileInputRef`):

- The picked file is read via `FileReader.readAsDataURL` to produce a preview.
- The file is stored as `formData.profilePicture`.
- The actual UI (`UserAddProfile`) is **commented out** in both `UserAdd.jsx` and `UserEdit.jsx`, so this flow is unreachable today.
- The HTTP layer would need to switch to `FormData` to send the file; `api.js` already detects `FormData` and skips JSON serialization, but the controllers send the plain `formData` object as JSON.

---

## 10. Configuration

### Important `.env` Variables

`.env` (committed):

```
VITE_APP_VERSION=v5.1.0
GENERATE_SOURCEMAP=false
VITE_APP_BASE_NAME=/fyp
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable | Used in | Purpose |
|----------|---------|---------|
| `VITE_APP_VERSION` | `Sidebar/index.jsx` (commented `<Chip>`) | Versions the sidebar (currently disabled). |
| `GENERATE_SOURCEMAP` | — | CRA-style flag, currently unused by Vite. |
| `VITE_APP_BASE_NAME` | `vite.config.mjs` (`base`) and `routes/index.jsx` (router `basename`) | Public path of the SPA (e.g. `/fyp`). |
| `VITE_API_BASE_URL` | `api/api.js` | Base URL of the Laravel API. |

### Vite Configuration (`vite.config.mjs`)

The config file is **`vite.config.mjs`** (not `vite.config.js`). Plugins include **`VitePWA`** from `vite-plugin-pwa`, a custom **`jsconfigSrcBaseUrlFallback`** plugin (bare imports when `vite-jsconfig-paths` has no importer during the prod graph), **`react()`**, and **`jsconfigPaths()`**.

| Section | Setting | Notes |
|---------|---------|-------|
| `server` | `open: true`, `port: 3000`, `host: true` | Auto-opens browser; binds on all interfaces; fixed dev port. |
| `build` | `chunkSizeWarningLimit: 1600` | Raises Vite's default chunk warning. |
| `preview` | `open: true`, `host: true` | Used by `yarn preview`. |
| `optimizeDeps` | `dedupe: ['react', 'react-dom']`, `include: ['react', 'react-dom', 'react/jsx-runtime']` | Dev pre-bundle consistency. |
| `define` | `global: 'window'` | Polyfills CommonJS-style `global`. |
| `resolve.dedupe` | `react`, `react-dom`, `scheduler` | Reduces duplicate React in the bundle. |
| `resolve.alias` | `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime` → absolute `node_modules` paths | Pins a single React instance for context/providers. |
| `resolve.alias` | `contexts/ConfigContext`, `config` → absolute paths under `src/` | Ensures one canonical module for context + default config. |
| `resolve.alias` | `@tabler/icons-react` → ESM icons bundle | Smaller icon imports. |
| `base` | `${env.VITE_APP_BASE_NAME}` | SPA public base path (from `.env`, often `/`). |
| `plugins` | `jsconfigSrcBaseUrlFallback`, `react()`, `jsconfigPaths()`, `VitePWA({ … })` | PWA: `generateSW`, manifest, Workbox precache; `injectRegister: false` because registration uses `virtual:pwa-register` in `index.jsx`. |

The **`jsconfigSrcBaseUrlFallback`** plugin resolves bare imports from `src/` when needed for Vite 7 production builds; it explicitly **skips** `react`, `react-dom`, and `scheduler` so those always resolve via normal node resolution.

### Build Configuration

- `vite build` produces a `dist/` folder.
- `vite preview` serves the build with the same `base` setting.
- Source maps are not customized — Vite uses defaults.

### Environment Handling

- Variables are read with Vite's `import.meta.env.*`.
- Only the `VITE_*`-prefixed variables are exposed to the bundle.
- The `.gitignore` ignores `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`. The committed `.env` is the project-default file.

### Constants / Config Files

| File | Constants |
|------|-----------|
| `src/config.js` | `DASHBOARD_PATH`, `DEFAULT_THEME_MODE`, `CSS_VAR_PREFIX`, default `fontFamily`, `borderRadius`. |
| `src/store/constant.js` | `gridSpacing`, `drawerWidth`, `appDrawerWidth`. |
| `src/utils/auth.js` | `AUTH_TOKEN_KEY`. |

### Runtime Configuration

- The Berry config object is persisted under `localStorage['berry-config-vite-js']` (`ConfigContext`), and changes apply live without reloading. Defaults come from `src/config.js`.
- The user/token live under `localStorage['access_token']` and `localStorage['auth_user']`.
- The MUI color-scheme mode is stored under `localStorage['theme-mode']` (the `modeStorageKey` passed to `<ThemeProvider>`).

### `jsconfig.json` (Path Aliases)

```13:19:jsconfig.json
"resolveJsonModule": true,
"isolatedModules": true,
"noEmit": true,
"jsx": "react-jsx",
"baseUrl": "src"
}
```

`baseUrl: "src"` lets the codebase import without relative paths, e.g.:

- `import api from 'api/api'`
- `import { hasAuthToken } from 'utils/auth'`
- `import MainCard from 'ui-component/cards/MainCard'`

### Secrets

No secrets are currently stored in `.env` or `src/`. Be careful to keep this true: only the Laravel API base URL and the public base name belong here.

---

## 11. Dependencies

### Runtime Dependencies (from `package.json`)

| Package | Version | Purpose / Where it is used |
|---------|---------|----------------------------|
| `react` | 19.2.0 | Core UI library. |
| `react-dom` | 19.2.0 | Rendering / `createRoot`. |
| `react-router` | 7.9.6 | Router primitives. |
| `react-router-dom` | 7.9.6 | DOM bindings (`createBrowserRouter`, `RouterProvider`, `Outlet`, `Navigate`, hooks). |
| `@mui/material` | 7.3.5 | Primary UI component library. Used everywhere. |
| `@mui/icons-material` | 7.3.5 | Material icons (used by login form, header, etc.). |
| `@emotion/react` | 11.14.0 | MUI styling engine. |
| `@emotion/styled` | 11.14.1 | MUI styling engine. |
| `@tabler/icons-react` | 3.35.0 | Most icons in the app (sidebar, table actions, …). |
| `@vitejs/plugin-react` | 5.1.1 | React Fast Refresh + JSX. |
| `vite` | 7.2.6 | Bundler / dev server. |
| `vite-jsconfig-paths` | 2.0.1 | Honors `jsconfig.json` path aliases at build time. |
| `apexcharts` | 5.3.6 | Dashboard charts. |
| `react-apexcharts` | 1.9.0 | React wrapper for ApexCharts. |
| `framer-motion` | 12.23.25 | Animations (`AnimateButton`). |
| `lodash-es` | 4.17.21 | Utility functions (used by some Berry internals). |
| `material-ui-popup-state` | 5.3.6 | Used in (commented) `Header/SearchSection`. |
| `react-device-detect` | 2.2.3 | Device detection (imported by Berry components). |
| `simplebar-react` | 3.3.2 | Custom scrollbars (sidebar). |
| `slick-carousel` | 1.8.1 | Listed in `package.json`; no `import` detected in `src/` (template residue). |
| `swr` | 2.3.7 | Used in `api/menu.js` as a local key/value store. |
| `web-vitals` | 5.1.0 | Optional performance reporting (`reportWebVitals.js`). |
| `yup` | 1.7.1 | Listed but **not currently imported** (no schemas defined). |
| `@fontsource/inter` / `@fontsource/poppins` / `@fontsource/roboto` | 5.x | Self-hosted fonts loaded in `index.jsx`. |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | 9.39.1 | Linter (flat-config). |
| `@eslint/js`, `@eslint/eslintrc`, `@eslint/compat` | — | ESLint core + flat-config compat. |
| `eslint-plugin-react` | 7.37.5 | React lint rules. |
| `eslint-plugin-react-hooks` | 7.0.1 | React hooks rules. |
| `eslint-plugin-jsx-a11y` | 6.10.2 | Accessibility rules. |
| `eslint-plugin-prettier` | 5.5.4 | Surface Prettier issues as lints. |
| `eslint-config-prettier` | 10.1.8 | Disable conflicting style rules. |
| `prettier` | 3.7.3 | Code formatter (config: `.prettierrc`). |
| `prettier-eslint-cli` | 8.0.1 | CLI helper. |
| `sass` | 1.94.2 | Compiles `assets/scss/style.scss`. |
| `vite-plugin-pwa` | ^1.3.0 | PWA manifest + Workbox `generateSW`. |
| `workbox-window` | ^7.4.1 | PWA client registration bundle support. |

### Categorized Notes

| Category | Library |
|----------|---------|
| UI primitives | `@mui/material`, `@mui/icons-material`, `@emotion/*`, `@tabler/icons-react` |
| Routing | `react-router`, `react-router-dom` |
| State / data | `swr` (very limited use), local `useState` |
| PWA | `vite-plugin-pwa`, `workbox-window` |
| Forms / validation | Hand-written (yup is unused) |
| Charts | `apexcharts`, `react-apexcharts` |
| Utilities | `lodash-es`, `react-device-detect`, `material-ui-popup-state` |
| HTTP | Native `fetch` (wrapped in `src/api/api.js`) |

---

## 12. Build & Deployment

### Required Tooling

| Tool | Version |
|------|---------|
| Node.js | The project itself does not pin a Node version, but Vite 7 requires **Node 20.19+ or 22.12+** (per upstream Vite 7 requirements). |
| Yarn | `4.10.3` (`packageManager` field). The repo includes `.yarn/`, `.yarnrc.yml`, and `yarn.lock`. |
| npm | Optional — scripts are equivalent under npm, but Yarn 4 is the declared package manager. |

### Installation

From `frontend-react-v1/`:

```bash
# Using Yarn (recommended; Yarn 4 is bootstrapped via Corepack)
corepack enable
yarn install
```

### Development Setup

```bash
# Start the dev server (Vite, port 3000, opens browser, exposes on LAN)
yarn start
```

The dev server is configured by `vite.config.mjs`:

- Port: `3000`
- `host: true` (binds on `0.0.0.0`)
- `open: true` (auto-opens browser)
- Public path / base: `VITE_APP_BASE_NAME` (default `/fyp`).

So with the default `.env`, the app is reachable at `http://localhost:3000/fyp/`.

### Run Commands

| Command | What it does |
|---------|---------------|
| `yarn start` | `vite` — starts the dev server. |
| `yarn build` | `vite build` — produces a production build in `dist/`. |
| `yarn preview` | `vite preview` — serves the built `dist/` for local verification. |
| `yarn lint` | `eslint "src/**/*.{js,jsx,ts,tsx}"`. |
| `yarn lint:fix` | `eslint --fix ...`. |
| `yarn prettier` | `prettier --write "src/**/*.{js,jsx,ts,tsx}"`. |

### Build Commands

```bash
yarn build      # production bundle into ./dist
yarn preview    # local sanity check of the built bundle
```

### Production Deployment Notes

- Output directory: `dist/` (Vite default).
- The bundle expects to be served under the path defined by `VITE_APP_BASE_NAME` (default `/fyp`). The hosting server (Nginx, Apache, S3+CloudFront, etc.) must:
  - Serve `dist/` at that path.
  - Fallback unknown paths to `index.html` so the SPA router can take over (typical SPA `try_files $uri /fyp/index.html;` rule).
- Backend CORS must allow the frontend origin and the `Authorization` header.

### Environment Variable Setup

For production, override:

```
VITE_APP_BASE_NAME=/your-public-path
VITE_API_BASE_URL=https://api.example.com/api
```

These must be set **at build time** (Vite inlines `import.meta.env.VITE_*` into the bundle).

### Vite Build Output

After `yarn build`:

```
dist/
├── index.html                  # Entry HTML; `<link rel="manifest">` injected by vite-plugin-pwa
├── manifest.webmanifest        # Web app manifest (name, icons, theme_color, …)
├── sw.js                       # Generated service worker (Workbox)
├── workbox-*.js                # Workbox runtime (hash varies by build)
├── icons/                      # Copied from public/icons (PWA icons referenced by manifest)
├── assets/
│   ├── *.js                    # Hashed JS chunks (one per route via React.lazy + Loadable)
│   ├── *.css                   # Hashed CSS / SCSS output
│   └── *.{svg,woff2,…}         # Static + font assets
└── favicon.svg                 # May be hashed under assets/ depending on build
```

`build.chunkSizeWarningLimit` is bumped to `1600` KB to account for the large MUI + ApexCharts bundles.

---

## 13. Known Issues / Technical Debt

The following items were verified against the current source tree and represent real gaps or bugs.

### Broken / Disabled User Add & Edit Flow

- `MainRoutes.jsx` has the `add` and `edit/:userId` routes **commented out**, so `UserAdd` and `UserEdit` cannot be reached via the UI today.
- Both `UserAdd.jsx` and `UserEdit.jsx` import components that **do not exist** in the codebase:
  - `ui-component/FieldContainer`
  - `ui-component/CreateActionButtons` (for `SubmitButton`)
  - `ui-component/dialogs/SuccessDialog`
  - `ui-component/SelectFieldContainer`
  - `ui-component/SectionHeader`
- Even if the routes were re-enabled, the page would fail to compile until those components are added (or removed from the imports).

### Hard-Coded Wrong Navigation Paths in User Controllers

In `useUserAddController.js` and `useUserFormController.js`, the cancel/success navigation calls go to `/admin/userManagement/...`, but the registered route prefix is `/admin/management-user/...`:

```189:191:src/feature/management-user/controllers/useUserAddController.js
const handleCancel = () => {
   navigate('/admin/userManagement');
};
```

This will produce a 404-equivalent (no matching route) until the paths are aligned.

### Repository-Side Validation Field Mismatch

`UserRepository.createUser` and `updateUser` validate against `userData.name`, `userData.phone`, etc., but the controllers populate `full_name` and `phone_number`:

```26:28:src/feature/management-user/repositories/userRepository.js
if (!userData.name || !userData.email || !userData.phone || !userData.address || !userData.role) {
  throw new Error('Name, email, phone number, home address, and role are required');
}
```

So every create/update call would throw "...are required" before reaching the data source. (Currently moot because the UI flow is disabled.)

### `userDataSource.js` Mock Is Unused

`feature/management-user/datasources/userDataSource.js` is a hand-written mock dataset. It is **not imported by any view** today (`userService.js` is used instead). It is dead code.

### Logout Is Not Implemented

The "Logout" `ListItemButton` in `Header/ProfileSection/index.jsx` has no handler. Token clearing only happens implicitly on a `401`.

### Register Form Is Visual-Only

`AuthRegister.jsx` uses hard-coded `value` props on the inputs and has no submit handler. Calling the backend `/auth/register` (or equivalent) is not wired.

### `state.from` from `ProtectedRoute` Is Never Consumed

`ProtectedRoute` saves `state.from = location` when bouncing to login, but the login flow always navigates to `/dashboard`, ignoring the original target.

### Empty Feature Folders

`feature/authentication`, `feature/management-camera`, and `feature/management-checkpoint` are still incomplete. Zone service wiring exists, but route/menu parity for all admin management screens should still be validated end-to-end.

### `ErrorBoundary` Is Defined but Not Wired

`src/routes/ErrorBoundary.jsx` defines an HTTP-status-aware error UI, but neither route group sets `errorElement`. Therefore the React Router default error boundary is what users see on routing errors.

### Toggle for Customization Drawer Is Commented Out

`layout/Customization/index.jsx` mounts the drawer but the `Fab` that opens it is wrapped in a comment. The drawer is therefore unreachable through the UI.

### `MainCard` Inside Sidebar Is Empty

`layout/MainLayout/Sidebar/MenuCard/index.jsx` returns a `<Card>` with no content (the original Berry copy was removed). It still mounts but adds visual weight without information.

### SCSS Variables Reference May Drift

`src/assets/scss/style.scss` references CSS custom properties (`--palette-text-secondary`, `--palette-primary-main`, …) that depend on the `cssVarPrefix` used by `themes/index.jsx`. Today `CSS_VAR_PREFIX = ''` so the names match (`--palette-...`). Changing the prefix in the future requires updating this SCSS file in lock-step.

### `yup` Is Listed but Unused

`yup` is in `dependencies` but no schema is imported. Either adopt it for the validation rules in `useUserAddController` / `useUserFormController` / `AuthLogin`, or remove the dependency to slim the bundle.

### Repeated Validation Logic

`useUserAddController` and `useUserFormController` duplicate the same validation rules. The phone, email, role, address, and required-name checks should be extracted (or moved into a single `yup` schema).

### `FieldContainer`-Style Imports Make UserAdd / UserEdit Brittle

The current pattern of importing many small wrappers (`FieldContainer`, `SectionHeader`, …) was started but never finished. Until those components exist, every change to UserAdd/UserEdit breaks the build. Either implement them under `ui-component/` or rewrite the views with raw MUI primitives.

### Native `alert` / `confirm` Dialogs

Both `useUserController.handleDeleteUser` (uses `window.confirm`) and various error paths (`window.alert(...)`) ship with the user — accessible/i18n-friendly modal-based dialogs would be a better fit.

### No Test Tooling

There is no Jest/Vitest setup, no test scripts, and no test files in `src/`.

### ~~`serviceWorker.unregister()`~~ (removed)

The legacy CRA-style `serviceWorker.jsx` was removed. Service worker lifecycle is handled by **`vite-plugin-pwa`** via `registerSW` from `virtual:pwa-register` in `src/index.jsx`.

---

## 14. Future Improvements

Suggestions that are actionable given the current implementation.

### Feature Enhancements

- **Complete the User Management module**: implement `UserAdd` / `UserEdit` properly by adding the missing `ui-component/FieldContainer`, `SelectFieldContainer`, `SectionHeader`, `CreateActionButtons` (`SubmitButton`), and `dialogs/SuccessDialog` components, then re-enable the commented-out routes in `MainRoutes.jsx`.
- **Implement logout**: wire the Profile menu's "Logout" item to a handler that calls the backend `POST /auth/logout`, then `clearAuthToken()`, then `navigate('/login', { replace: true })`. Also remove `auth_user` from `localStorage`.
- **Implement Register**: convert `AuthRegister.jsx` from a static form into a controlled form that calls the backend register endpoint.
- **Implement Zone / Camera / Checkpoint modules** under `feature/management-zone`, `feature/management-camera`, `feature/management-checkpoint`. Mirror the user-management pattern (views → controllers → repository → service).
- **Show authenticated user info** in the header (currently hard-coded "Johne Doe" in `ProfileSection`). The token already saves a user object under `auth_user`.

### Refactoring Opportunities

- **Adopt `yup`**: replace the bespoke regex validation in `AuthLogin`, `useUserAddController`, and `useUserFormController` with a shared `yup` schema per form. Today `yup` is installed but unused.
- **Single source of truth for routes**: extract the path constants (`/admin/management-user`, `/dashboard`, etc.) into a `src/routes/paths.js` to avoid mismatches like the `userManagement` vs. `management-user` bug.
- **Unify table tooling**: a generic `<DataTable />` (with the existing `PaginationFooter`) could replace per-feature tables when more management screens are built.
- **Replace native dialogs**: introduce a global `ConfirmDialog` and `SnackbarProvider` (e.g. MUI Snackbar) to drop `window.alert` / `window.confirm`.
- **Remove dead code**: delete `feature/management-user/datasources/userDataSource.js` (mock dataset) and `slick-carousel` dependency if not adopted.

### Scalability Improvements

- **Per-feature SWR adoption**: switch the user list to `useSWR('/users', userService.getAllUsers)` for background revalidation, retry, and cache sharing across pages.
- **Global error / 401 handling**: today, `api.js` triggers a hard `window.location.replace`. Migrating to a router-level navigation (custom event or context) would preserve SPA state.
- **Code splitting per feature**: today route components are lazy-loaded but feature controllers / repositories still ship as common chunks. With more features, dynamic imports per feature module would matter.

### Better Architecture Patterns

- **Consider a thin auth context** (`AuthProvider`) that exposes `user`, `isAuthenticated`, `login()`, `logout()`. This removes duplication between `AuthLogin`, `ProfileSection`, and the guards.
- **Type safety**: migrate to TypeScript progressively. The project already has `jsconfig.json` that enables `strict` semantics, and React Router 7 is fully typed.
- **Domain entities**: introduce a `User` model class (or zod/yup-typed object) so controllers and views can rely on a stable shape, even when the backend tweaks fields like `phone` vs `phone_number`.

### UI / UX Improvements

- **Re-enable the Customization Fab** (or replace it with a header gear icon).
- **Show a 404 page** for unknown routes (currently router falls back to its default error UI). Wire the existing `ErrorBoundary.jsx` via `errorElement` on both route groups, plus a catch-all `path: '*'` route.
- **Consistent toast feedback** for create/update/delete actions in user management.
- **Theme dark mode**: add `colorSchemes.dark` alongside the existing `light` scheme so `DEFAULT_THEME_MODE = 'system'` actually has somewhere to switch to.
- **Empty / not-found visuals**: `UserView.jsx` already has a "User not found" branch — generalize this with a reusable `<EmptyState />` component.

### Performance Optimization Ideas

- **Tree-shake `@tabler/icons-react` imports**: the existing alias targets the ESM bundle, but per-icon imports (`import { IconBell } from '@tabler/icons-react/dist/esm/icons/IconBell.mjs'`) can shrink the initial bundle further.
- **Lazy-load ApexCharts**: today the dashboard imports them eagerly inside its lazy route, which is fine, but moving each chart into its own dynamic import would help slow-network first paints.
- **Image optimization**: existing assets are SVG. If photo uploads are added later, a dedicated image-CDN flow (with `srcset`) is recommended.

### Testing Improvements

- **Add Vitest** (most natural fit with Vite). Start with the validation rules in the controllers (pure functions), the repositories, and the `api.js` wrapper (mock `fetch`).
- **React Testing Library** for `UserList` / `UserView` / `AuthLogin`. The controller-hook pattern makes views easy to test in isolation by mocking the repository.
- **Linting in CI**: run `yarn lint` in CI to enforce the existing flat ESLint config.

---

## 15. Progressive Web App (PWA)

### Overview

The app uses **`vite-plugin-pwa`** with the **`generateSW`** strategy. Workbox precaches hashed assets; navigation falls back to `index.html` for SPA routing. Registration uses **`import { registerSW } from 'virtual:pwa-register'`** in `src/index.jsx` with `injectRegister: false` in the Vite plugin (registration is explicit in application code, not auto-injected into HTML).

### Manifest & icons

- **Manifest** filename: `manifest.webmanifest` (emitted to `dist/`).
- **Icons:** static PNGs under **`public/icons/`** (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`) — copied to `dist/icons/` at build time.
- **Theme / meta:** `index.html` includes `<meta name="theme-color" content="#111827">` aligned with the manifest.

### Entry (`src/index.jsx`)

- Calls **`registerSW({ immediate: true, … })`** inside `typeof window !== 'undefined'` with try/catch.
- Logs basic online/offline events (`navigator.onLine`, `online` / `offline` listeners).
- **`src/vite-env.d.js`** references **`vite-plugin-pwa/client`** for TypeScript/IDE support of `virtual:pwa-register`.

### Sidebar install UX

- **`usePwaInstallPrompt`** is invoked from **`layout/MainLayout/Sidebar/index.jsx`** (not only inside the button component) so `beforeinstallprompt` can be captured **before** the mobile drawer opens.
- **`SidebarPwaInstall.jsx`** renders the **Install App** button when `showInstallButton` is true (Chromium-style browsers that expose the deferred prompt). Wrapped in an error boundary so failures hide only this UI.
- **Mobile layout:** For `useMediaQuery(theme.breakpoints.down('md'))`, the sidebar avoids the shared **`SimpleBar`** wrapper for the menu list (see [Section 3 — `ui-component/third-party/SimpleBar.jsx`](#3-directory-structure)) so the install button stays visible at the bottom of the drawer.

### Platform notes

- **`beforeinstallprompt`** is **not** available on iOS Safari; the install button typically appears only on browsers that support it (e.g. Chrome on Android).
- **`navigator.standalone`** is iOS-specific; Android ignores it.

### Related source files

| Path | Role |
|------|------|
| `vite.config.mjs` | `VitePWA({ manifest, workbox, registerType: 'autoUpdate', injectRegister: false, … })` |
| `hooks/usePwaInstallPrompt.js` | Install prompt state + safe media-query listeners |
| `layout/MainLayout/Sidebar/SidebarPwaInstall.jsx` | Install button UI + optional mobile debug logs |
| `feature/authentication/controllers/useAuthController.js` | Minimal `currentUser` from `localStorage` `auth_user` (used by patrol feature; unrelated to PWA but added alongside bundle fixes) |

---

_Last updated: keep this document in sync whenever routing, authentication, the API contract, the feature/module layout, PWA settings, or environment variables change. Source files are the source of truth — when in doubt, re-derive this document from the codebase._
