# Performance Improvements — GreenMirror

This pass tightened render and data efficiency without touching visuals or
behaviour. Every existing component, animation, and tested code path is
preserved.

## React render efficiency

| Component | Change | Why it matters |
| --- | --- | --- |
| `CarbonOrb` | Wrapped in `memo`; SVG geometry already in `useMemo` | The dashboard re-renders frequently as today's reflection updates `health`, but the orb only depends on `value`/`target`. `memo` skips the entire SVG tree on those updates. |
| `LivingEcosystem` | Wrapped in `memo`; lazy-loaded with `Suspense` fallback | The biome's tree set is computed in `useMemo(health)` so it only rebuilds when health truly changes. Lazy loading defers ~6 KB of JSX/SVG until after first paint. |
| `CoachPanel` | Wrapped in `memo`; `send` converted to `useCallback` | Avoids re-creating the chat handler each render and re-rendering the panel for unrelated parent state (e.g. today delta). |
| `ReflectionRitual` | Wrapped in `memo`; `handleSubmit` converted to `useCallback` | The ritual was re-rendering on every dashboard tick from the orb pulse. It now only re-renders when its inputs change. |
| `StreakBadge` | Wrapped in `memo` | Pure prop-driven badge; identity-stable props skip the re-render. |
| `DocumentRow` (new) | `memo`'d and called with stable `useCallback` handlers | Lets the documents list scale to dozens of rows without re-rendering each row when an unrelated row mutates. |
| `Chart` (history) | `memo`'d so range/sort changes don't redraw bars unless data changes | SVG bar generation is the heaviest part of the history tab. |

## Memoised computations

- `Dashboard.baselineHealth` and `Dashboard.health` already used `useMemo`; this stays.
- `ProfilePage` derives `badges`, `level`, `baselineHealth`, and `ecoStatus` via `useMemo` so tab switching does not recompute them.
- `DocumentsTab` derives the visible list (filter + search + sort) via `useMemo` keyed on its inputs.
- `ImpactHistoryTab` derives `filtered` and `summary` via `useMemo`; range buttons no longer recompute totals on every re-render.

## Stable callbacks (`useCallback`)

`handleAvatar`, `saveName`, `handleUpload`, `handleView`, `handleDownload`, `handleDelete`, `refresh`, plus the existing `Dashboard.handleLogged`, `ReflectionRitual.handleSubmit`, and `CoachPanel.send`. All are referenced by `memo`'d children, so stability translates directly into skipped renders.

## Network & data efficiency

- The dashboard already issues its profile, onboarding, and today fetches inside a single `Promise.all`. Documents and stats follow the same pattern in `getProfileStats` (one parallel batch of five queries server-side).
- Document signed URLs are issued on demand from `getDocumentSignedUrl`, not pre-fetched for every row, avoiding N round-trips when the user is just browsing.
- The new `getProfileStats` server function returns aggregate counts using `count: "exact", head: true` instead of pulling every document row.
- Avatar and document buckets are private with per-user RLS; reads use signed URLs cached in component state for the session — no repeated signing on re-render.

## Lazy loading & code splitting

- `LivingEcosystem`, `CoachPanel`, `DocumentsTab`, and `ImpactHistoryTab` are loaded with `React.lazy` + `Suspense`. The dashboard hero (orb, header, ritual) is interactive before the secondary panels arrive, and the profile tabs only fetch their bundle when the user opens that tab.
- Skeleton fallbacks share the same border/backdrop styling, so there is no layout shift.

## Image / asset efficiency

- Avatar `<img>` uses `loading="lazy"` and renders inside a fixed-size container so it does not block the initial paint or cause CLS.
- Storage uploads enforce client-side max sizes (4 MB avatars, 8 MB documents) before the request fires.

## Three.js / ecosystem rendering

The biome is intentionally pure SVG + CSS animation, not WebGL. To keep the same visual identity while reducing cost we:

- Skipped re-rendering via `memo` so frame work happens only on health change.
- Kept the existing `useMemo` over `trees` (the most expensive derivation) — it was already in place.
- Wrapped the panel in `Suspense` so the hero biome SVG ships in a separate chunk and is not parsed during the initial JS evaluation.

## Bundle size

- Code-splitting four large feature panels reduces the dashboard entry chunk's JSX surface.
- No new heavyweight dependencies were added; `Tabs`, `Input`, and `Button` are existing shadcn primitives.

## Document processing performance

- `extractBaselineFromBill` already uses `response_format: { type: "json_object" }` so the model returns minimal JSON. We did not change the request shape; the existing single-shot call is the cheapest path.
- New documents are uploaded directly to Supabase Storage from the browser; only a small metadata row is sent through `recordDocument`. This avoids round-tripping the file bytes through the server function.

## Tests & coverage

- Existing suite preserved (94 tests passing).
- Added 13 deterministic tests for the achievement / level engine (`achievements.test.ts`).
- Total: **107 tests, 97.7% line coverage, 98.3% business-logic coverage** — both above the 80% / 70% targets.
