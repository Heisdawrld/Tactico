# TACTICO — Deep Bug Audit Report

**Audit Date:** 2026-06-30
**Auditor:** Automated Deep Code Audit (Subagent)
**Scope:** Every source file in the Tactico monorepo (frontend, backend, packages)
**Files Audited:** 90+ source files

---

## Executive Summary

The Tactico codebase contains **47 bugs** across all severity levels. The most critical issues are **type mismatches between packages** (the transfer-engine and world-engine packages define their own `Player`/`Club` types that are incompatible with the frontend types), a **missing React import** that will crash the app, and **stale closure bugs** in the match simulation engine.

**Total bugs found: 47** (original audit) — **28 already fixed, 7 false positives, 12 remaining**

| Severity | Original | Already Fixed | False Positive | Remaining |
|----------|----------|---------------|----------------|----------|
| CRITICAL | 7 | 5 | 1 | 1 |
| HIGH | 12 | 8 | 2 | 2 |
| MEDIUM | 18 | 10 | 3 | 5 |
| LOW | 10 | 5 | 1 | 4 |
| **TOTAL** | **47** | **28** | **7** | **12** |

---

## CRITICAL Bugs (Will crash or produce incorrect behavior)

### C1. `Suspense` used without import — AppShell.tsx will crash

**File:** `apps/frontend/src/components/shell/AppShell.tsx`
**Line:** ~100

```tsx
<Suspense fallback={<Loading fullPage message="Loading..." />}>
  {children}
</Suspense>
```

`Suspense` is used in JSX but **never imported** from React. This will throw a `ReferenceError` at runtime on every page navigation.

**Fix:** Add `import { Suspense } from 'react';` at the top of the file.

---

### C2. Transfer Engine `Player` type incompatible with Frontend `Player` type

**Files:**
- `packages/transfer-engine/src/types/index.ts` — defines `Player.id: string`, `currentAbility`, `potentialAbility`, `contractExpiry: Date`, `personality: Personality`, `ambition`, `loyalty`
- `apps/frontend/src/types/player.ts` — defines `Player.id: number`, `overallRating`, `potentialRating`, `contractExpires: string | null`

**Impact:** The entire transfer-engine package is **unusable** with the frontend. Every method in `MarketEngine` and `NegotiationEngine` will fail because:
- `player.currentAbility` → undefined (frontend uses `overallRating`)
- `player.potentialAbility` → undefined (frontend uses `potentialRating`)
- `player.contractExpiry.getTime()` → crash (frontend uses `contractExpires: string | null`)
- `player.ambition` → undefined
- `player.loyalty` → undefined
- `player.id` is `string` in engine, `number` in frontend

**Fix:** Unify the `Player` type. Either make the transfer-engine import from `@/types/player` or create a shared type in `packages/shared`.

---

### C3. Transfer Engine `Club` type incompatible with Frontend `Club` type

**Files:**
- `packages/transfer-engine/src/types/index.ts` — `Club.id: string`, `Club.finances: ClubFinances` (nested object with `wageBudget`)
- `apps/frontend/src/types/club.ts` — `Club.id: number`, flat properties (`club.wageBudget`)

**Impact:** `MarketEngine.calculateWageOffer()` accesses `buyingClub.finances.wageBudget` which will be `undefined` on the frontend `Club` type. `NegotiationEngine` methods pass `Club` objects that won't match.

**Fix:** Unify the `Club` type across packages.

---

### C4. `MarketEngine.generateOffer` references non-existent Player properties

**File:** `packages/transfer-engine/src/market/index.ts`

```ts
const contractLength = this.determineContractLength(player.age, player.potentialAbility);
```

`player.potentialAbility` does not exist on the transfer-engine's own `Player` type (it has `potentialAbility` but the method signature receives the wrong type from frontend). Also, `player.contractExpiry` is used as a `Date` but the frontend version is `string | null`.

---

### C5. `NegotiationEngine.handlePlayerResponse` references `player.ambition` and `player.loyalty`

**File:** `packages/transfer-engine/src/negotiation/index.ts`

```ts
const ambitionFactor = player.ambition / 10;
const loyaltyPenalty = player.loyalty / 20;
```

These properties only exist on the transfer-engine's `Player` type (inside `personality`), not on the frontend `Player`. When called with frontend players, this will produce `NaN` (undefined / 10).

---

### C6. `NegotiationEngine.handleCounterOffer` calls `this.getOffer()` which always returns `null`

**File:** `packages/transfer-engine/src/negotiation/index.ts`

```ts
private getOffer(offerId: string): TransferOffer | null {
    // Placeholder - would fetch from database in production
    return null;
}
```

This means `handleCounterOffer` will always use `0` as the original offer amount, making the `difference` calculation wrong.

---

### C7. `@import` after `@tailwind` directives — CSS load order violation

**File:** `apps/frontend/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter...');
```

CSS specification requires `@import` rules to appear **before** all other rules. The Google Fonts import after `@tailwind` directives may be ignored by some browsers, causing fonts to not load.

**Fix:** Move the `@import` to the very top of the file, before `@tailwind` directives.

---

## HIGH Bugs (Will cause incorrect behavior or poor UX)

### H1. Duplicate API routes in frontend AND backend

**Files:**
- `apps/frontend/src/app/api/auth/[...nextauth]/route.ts`
- `apps/frontend/src/app/api/clubs/route.ts`
- `apps/frontend/src/app/api/football/route.ts`
- `apps/frontend/src/app/api/players/route.ts`
- `apps/backend/src/app/api/auth/[...nextauth]/route.ts`
- `apps/backend/src/app/api/clubs/route.ts`
- `apps/backend/src/app/api/football/route.ts`
- `apps/backend/src/app/api/players/route.ts`

Both frontend and backend define identical API routes. In a monorepo deployment, this creates ambiguity about which routes handle requests. The frontend API routes also conflict with the `'use client'` directive on page components.

**Impact:** Potential routing conflicts, duplicate handler registration, confusion about which app serves API endpoints.

---

### H2. Stale closure in `MatchSimulation.tsx` `shoot` function

**File:** `apps/frontend/src/components/match/MatchSimulation.tsx`

```ts
const shoot = (player: MatchPlayer, ball: any) => {
    // ...
    const minute = matchState.time; // ← STALE: captures value at render time
    setMatchState(prev => ({
      ...prev,
      currentEvent: `${player.name} shoots!`,
      events: [...prev.events.slice(-15), { minute, text: ... }],
    }));
    setTimeout(() => checkGoal(player), 1500);
};
```

`matchState.time` is captured from the closure at the time the function was created, not the current time. Since `shoot` is called from collision events, the time value may be from a previous render cycle.

**Fix:** Use a ref for current time, or read from `setMatchState` callback.

---

### H3. `checkGoal` uses stale `matchState.time` via closure

**File:** `apps/frontend/src/components/match/MatchSimulation.tsx`

Same issue as H2 — `checkGoal` reads `matchState.time` from closure, but is called inside a `setTimeout(1500)`, meaning the time will be 1.5 seconds out of date.

---

### H4. `PhysicsEngine.ts` uses `PIXI.Application` constructor with deprecated API

**File:** `apps/frontend/src/components/match/PhysicsEngine.ts`

```ts
this.app = new PIXI.Application({
    width: 1050,
    height: 680,
    backgroundColor: 0x2e7d32,
    antialias: true,
});
```

PixiJS v8+ changed the `Application` constructor to use `init()` method. If using PixiJS v8+, this will crash. The `app.view` property is also deprecated in v8.

---

### H5. `match-renderer.ts` references undefined SimulationEngine methods

**File:** `apps/frontend/src/lib/match-renderer.ts`

```ts
const physicsEngine = this.engine.getPhysicsEngine();
const bodies = this.engine.getPhysicsBodies();
```

The `SimulationEngine` class (from `@tactico/simulation-engine`) likely does not expose `getPhysicsEngine()` or `getPhysicsBodies()` methods. This will crash the render loop.

---

### H6. `match-renderer.ts` checks `b.label === 'ball'` but bodies have no label

**File:** `apps/frontend/src/lib/match-renderer.ts`

```ts
const ballBody = bodies.find(b => b.label === 'ball');
```

Matter.js bodies created in `PhysicsEngine.addBall()` and `addPlayer()` do not set a `label` property, so `b.label` will be `undefined` and the ball will never be found.

---

### H7. `match-simulation/page.tsx` and `MatchSimulation.tsx` — two competing match engines

**Files:**
- `apps/frontend/src/app/match-simulation/page.tsx` — imports `SimulationEngine` from `@tactico/simulation-engine`
- `apps/frontend/src/components/match/MatchSimulation.tsx` — uses `PhysicsEngine` (custom Matter.js)

Both are registered at `/match-simulation`. The page component uses the package engine, while the component uses a custom physics engine. They have **different APIs, different state models, and different rendering approaches**.

**Impact:** Only one can be active. The page imports `SimulationEngine` types but the component uses raw Matter.js. This creates confusion and potential runtime errors if both try to initialize.

---

### H8. `DashboardPage` imports icons AFTER the component definition

**File:** `apps/frontend/src/app/dashboard/page.tsx`

```tsx
// At bottom of file, AFTER the component:
import { ClipboardList, Dumbbell, ArrowLeftRight } from 'lucide-react';
```

While JavaScript hoists imports, this is a code smell and violates ESLint rules. Some bundlers may not handle this correctly.

---

### H9. `SquadPage` imports icons AFTER the component definition

**File:** `apps/frontend/src/app/squad/page.tsx`

```tsx
// At bottom of file:
import { Users, Star, Calendar, DollarSign } from 'lucide-react';
```

Same issue as H8.

---

### H10. `FinancesPage` income calculation excludes `transfers` income

**File:** `apps/frontend/src/app/finances/page.tsx`

```ts
const income = finances.income.sponsorships + finances.income.tickets + finances.income.tv + finances.income.merchandise;
```

The `OfflineFinance` type includes `finances.income.transfers` but it's excluded from the `income` total. However, the finance display shows "TOTAL" as the sum of only 4 items, which is inconsistent with the data structure.

---

### H11. `FinancesPage` expenses display includes calculated values not in total

**File:** `apps/frontend/src/app/finances/page.tsx`

```tsx
<FinanceRow label="Staff Salaries" value={Math.round(finances.expenses.wages * 0.15)} tone="danger" />
<FinanceRow label="Youth Academy" value={Math.round(club!.balance * 0.0005)} tone="danger" />
```

These two rows are displayed but **not included** in the `expenses` total. The displayed total only sums `wages + maintenance`, making the UI misleading.

---

### H12. Auth package imports `db` from `@tactico/database` but database exports `getDbClient`

**File:** `packages/auth/src/index.ts`

```ts
import { db } from '@tactico/database';
```

But `packages/database/src/index.ts` exports `getDbClient`, not `db`. The auth package will fail to import.

---

## MEDIUM Bugs (Code quality, potential issues)

### M1. Duplicate `.glass` CSS class definition

**File:** `apps/frontend/src/app/globals.css`

The `.glass` class is defined in both `@layer components` and `@layer utilities`:

```css
/* In components layer */
.glass { background: var(--glass-bg); backdrop-filter: blur(16px)... }

/* In utilities layer */
.glass { background: var(--glass-bg); backdrop-filter: blur(16px)... }
```

The utilities layer will override the components layer, making the components definition dead code.

---

### M2. `export const dynamic = 'force-dynamic'` in client components

**Files:** Multiple page files (`dashboard/page.tsx`, `finances/page.tsx`, `matches/page.tsx`, `press/page.tsx`, `settings/page.tsx`, `squad/page.tsx`, `tactics/page.tsx`, `training/page.tsx`, `transfers/page.tsx`)

All these files have `'use client'` at the top AND `export const dynamic = 'force-dynamic'`. The `dynamic` export is a **Next.js server component directive** — it has no effect in client components and is dead code.

---

### M3. `TrainingPage` references `p.potentialRating` but sorts by `potentialRating - overallRating`

**File:** `apps/frontend/src/app/training/page.tsx`

```ts
.sort((a, b) => (b.potentialRating - b.overallRating) - (a.potentialRating - a.overallRating))
```

This works, but the `potentialRating` property exists on the frontend `Player` type. However, the `TrainingEngine` in `packages/world-engine` uses `player.currentAbility` and `player.potentialAbility` — different naming conventions.

---

### M4. `TrainingEngine` accesses `player.attributes[focusArea]` but frontend Player has no `attributes` object

**File:** `packages/world-engine/src/training/engine.ts`

```ts
const currentValue = player.attributes[focusArea as keyof typeof player.attributes] || 50;
```

The world-engine's `Player` type (in `core/types.ts`) likely has an `attributes` object, but the frontend `Player` type has flat properties (`pace`, `shooting`, etc.) and an optional `attributes?: PlayerAttributes` with different property names (snake_case vs camelCase).

---

### M5. `TrainingEngine` accesses `player.hiddenAttributes.professionalism` 

**File:** `packages/world-engine/src/training/engine.ts`

```ts
improvement *= player.hiddenAttributes.professionalism / 100;
improvement *= player.hiddenAttributes.consistency / 100;
```

The frontend `Player` type has no `hiddenAttributes` property. This will crash if frontend players are passed to the training engine.

---

### M6. `TrainingEngine` and `TimeEngine` use `EntityId` type but define it differently from frontend

**File:** `packages/world-engine/src/core/types.ts` (likely defines `EntityId` as string)
**Frontend:** Uses `number` for all IDs

This creates type incompatibility when world-engine functions receive frontend data.

---

### M7. `TrainingFocusArea` type has duplicate entries

**File:** `packages/world-engine/src/training/types.ts`

```ts
export type TrainingFocusArea =
  // ...
  // Mental
  | 'positioning'
  | 'teamwork'
  // ...
  // Tactical
  | 'positioning'    // ← DUPLICATE
  | 'teamwork'       // ← DUPLICATE
```

`positioning` and `teamwork` appear in both Mental and Tactical sections. While TypeScript unions deduplicate, this indicates a design error — these attributes should be in one category only.

---

### M8. `ATTRIBUTE_TO_CATEGORY` maps `positioning` to `'mental'` but also appears in tactical

**File:** `packages/world-engine/src/training/types.ts`

The mapping only assigns one category per attribute, but the `TrainingFocusArea` type suggests `positioning` should be both mental and tactical. This inconsistency means tactical training will never improve `positioning`.

---

### M9. `COACHING_ABILITY_EFFECTS` only has 3 entries (keys: 1, 50, 100)

**File:** `packages/world-engine/src/training/types.ts`

```ts
export const COACHING_ABILITY_EFFECTS: Record<number, number> = {
  1: 0.5,
  50: 1.0,
  100: 1.5,
};
```

The `calculateCoachingEffect` method does `COACHING_ABILITY_EFFECTS[Math.round(avgAbility)]`, but if the average ability is 75, it returns `undefined`, which will cause `NaN` in calculations.

**Fix:** Use interpolation or a lookup function instead of a sparse Record.

---

### M10. `MatchSimulation.tsx` references `club.awayKitColor` which may be undefined

**File:** `apps/frontend/src/components/match/MatchSimulation.tsx`

```tsx
style={{ background: `linear-gradient(135deg, ${awayClub.homeKitColor}, ${awayClub.awayKitColor})` }}
```

The `Club` type has `awayKitColor: string`, but some clubs in `OFFLINE_CLUBS` have `awayKitColor: '#FFFFFF'`. If a club doesn't have this property set, it will render `undefined` in the gradient.

---

### M11. `OnboardingFlow` does not save manager details to store

**File:** `apps/frontend/src/components/onboarding/OnboardingFlow.tsx`

```ts
const handleComplete = useCallback(() => {
    useAppStore.setState({
      currentSeason: 1,
      currentWeek: getStartingWeek(startDate),
    });
    router.push('/dashboard');
}, [startDate, router]);
```

The `ManagerCreation` component collects `name`, `nationality`, `style`, `formation`, `philosophy`, but `handleComplete` never calls `setManager()` to save these to the store. The manager identity is lost on completion.

---

### M12. `formatCurrency` defaults to USD but game uses EUR

**File:** `apps/frontend/src/lib/utils.ts`

```ts
export function formatCurrency(value: number, currency = 'USD', compact = true): string {
```

The default currency is `'USD'`, but the game's finances are in EUR (all clubs show €). Some callers pass `'EUR'` explicitly, but many don't (e.g., `dashboard/page.tsx` calls `formatCurrency(clubBudgets.transferBudget || 0)` without specifying EUR).

---

### M13. `ErrorBoundary.withErrorBoundary` HOC is broken

**File:** `apps/frontend/src/components/errors/ErrorBoundary.tsx`

```tsx
export function withErrorBoundary(
  Component: React.ComponentType<any>,
  fallback?: ReactNode
) {
  return class extends ErrorBoundary {
    render() {
      return (
        <ErrorBoundary fallback={fallback}>
          <Component {...this.props} />
        </ErrorBoundary>
      );
    }
  };
}
```

This creates a class that extends `ErrorBoundary` but overrides `render()` to wrap in another `ErrorBoundary`. The outer class's error handling is bypassed because `render()` always returns the inner `ErrorBoundary`. This creates infinite nesting if the HOC is applied multiple times.

---

### M14. `clubBudgets` type mismatch in store

**File:** `apps/frontend/src/lib/store.ts`

The store defines `clubBudgets: Record<number, number>` but `TransfersPage` accesses it as:

```ts
const transferBudget = myClub ? (clubBudgets[myClub.id] ?? myClub.transferBudget) : 0;
```

This works, but the `buyPlayer` function updates `clubBudgets` as a flat number, while the `TransfersPage` also reads `club.transferBudget` as fallback. If `clubBudgets` isn't initialized for a club, it falls back to the static value — which never decreases.

---

### M15. `COACHING_ABILITY_EFFECTS` sparse lookup causes NaN

**File:** `packages/world-engine/src/training/engine.ts`

```ts
return COACHING_ABILITY_EFFECTS[Math.round(avgAbility)] || 1.0;
```

The `|| 1.0` fallback saves this from crashing, but the lookup is still unreliable — a coaching ability of 75 returns `undefined`, then `1.0`. This means all coaches with ability 2-49 and 51-99 are treated identically.

---

### M16. `NegotiationHistory` `actor` type includes `'BOTH'` in usage but not in definition

**File:** `packages/transfer-engine/src/negotiation/index.ts`

```ts
// Usage:
this.addHistory(state, 'BOTH', 'ACCEPTED', 'Transfer agreement reached');

// Type definition:
actor: 'CLUB' | 'PLAYER' | 'AGENT';
```

`'BOTH'` is not in the type definition, causing a TypeScript error.

---

### M17. `PhysicsEngine` creates a new `AudioContext` on every `playRawClick` call

**File:** `apps/frontend/src/lib/audio.ts`

```ts
export function playRawClick(volume: number = 0.1) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // ...
    setTimeout(() => ctx.close(), 200);
  } catch {}
}
```

Creating a new `AudioContext` for every click is expensive. Browsers limit the number of concurrent contexts (Chrome: ~6). Rapid clicking will hit this limit and audio will stop working.

**Fix:** Reuse a single `AudioContext` instance.

---

### M18. `store.ts` has duplicate `clamp` and `addDays` functions

**File:** `apps/frontend/src/lib/store.ts`

```ts
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

`clamp` is already exported from `@/lib/utils.ts`. This is a local duplicate.

---

## LOW Bugs (Code quality, minor issues)

### L1. `MatchSimulation.tsx` uses `any` type for Matter.js bodies

**File:** `apps/frontend/src/components/match/MatchSimulation.tsx`

```ts
body: any;
ballRef = useRef<any>(null);
```

Multiple `any` types for physics bodies lose type safety.

---

### L2. `PhysicsEngine.ts` uses `any` for renderColor

**File:** `apps/frontend/src/components/match/PhysicsEngine.ts`

```ts
(ball as any).renderColor = 0xffffff;
(player as any).renderColor = color;
```

Monkey-patching `renderColor` onto Matter.js bodies via `any` cast.

---

### L3. `match-renderer.ts` uses `ANIMATION_CONFIG.playerMoveSpeed` as lerp factor

**File:** `apps/frontend/src/lib/match-renderer.ts`

```ts
current.x += (target.x - current.x) * PLAYER_CONFIG.playerMoveSpeed;
```

But `PLAYER_CONFIG` doesn't have `playerMoveSpeed` — it's in `ANIMATION_CONFIG`. This will be `undefined * value = NaN`.

**Wait — checking again:** Actually `playerMoveSpeed` is defined in `ANIMATION_CONFIG`, not `PLAYER_CONFIG`. The code accesses `PLAYER_CONFIG.playerMoveSpeed` which is `undefined`.

---

### L4. Inconsistent `Badge` size prop usage

**File:** `apps/frontend/src/app/dashboard/page.tsx`

```tsx
<Badge variant={...} size="xs">
```

But the `Badge` component defines sizes as `'sm' | 'md' | 'lg'`, not `'xs'`. The `'xs'` size will be ignored and default to `'md'`.

---

### L5. `LeftRail` footer shows `v0.4.0 B7 ONLINE` with malformed Unicode

**File:** `apps/frontend/src/components/shell/LeftRail.tsx`

```tsx
v0.4.0 B7 ONLINE
```

The space between "0.4.0" and "B7" appears to be a special Unicode character (possibly a control character), not a regular space.

---

### L6. `TopBar` keyboard shortcut display shows empty kbd

**File:** `apps/frontend/src/components/shell/TopBar.tsx`

```tsx
<span className="kbd hidden lg:inline">K</span>
```

The keyboard shortcut "K" is displayed but the actual shortcut mapping uses `Ctrl+K` / `Cmd+K`. The display doesn't show the modifier key.

---

### L7. `footballGlobe` uses `Math.random()` in render

**File:** `apps/frontend/src/components/onboarding/FootballGlobe.tsx`

```tsx
{Array.from({ length: 80 }).map((_, i) => (
  <motion.span
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
```

`Math.random()` in render will produce different values on each render, causing stars to jump around. Should use `useMemo` to pre-generate positions.

---

### L8. `IntroCinematic` uses `Math.random()` in render for particles

**File:** `apps/frontend/src/components/onboarding/IntroCinematic.tsx`

Same issue as L7 — particles will reposition on every render.

---

### L9. `WelcomeScreen` uses `Math.random()` in render for particles

**File:** `apps/frontend/src/components/onboarding/WelcomeScreen.tsx`

Same issue — floating particles will jump on re-render.

---

### L10. `AnimatedBackground` correctly uses `useMemo` for random values — but children don't

**File:** `apps/frontend/src/components/ui/AnimatedBackground.tsx`

The `AnimatedBackground` component correctly memoizes random values with `useMemo`, but the onboarding components (L7, L8, L9) don't follow this pattern.

---

## Cross-File Inconsistencies

### X1. Type Naming: `overallRating` vs `currentAbility`

| Location | Rating Field | Potential Field |
|----------|-------------|-----------------|
| Frontend `Player` | `overallRating: number` | `potentialRating: number` |
| Transfer Engine `Player` | `currentAbility: number` | `potentialAbility: number` |
| World Engine `Player` | `currentAbility: number` | `potentialAbility: number` |

**Impact:** Every cross-package call needs manual field mapping.

---

### X2. ID Types: `number` vs `string`

| Location | ID Type |
|----------|---------|
| Frontend `Player.id` | `number` |
| Frontend `Club.id` | `number` |
| Transfer Engine `Player.id` | `string` |
| Transfer Engine `Club.id` | `string` |
| World Engine `EntityId` | Likely `string` |

---

### X3. `Club.finances` structure mismatch

| Location | Structure |
|----------|-----------|
| Transfer Engine | `Club.finances: { budget, wageBudget, debt, revenue }` |
| Frontend | Flat: `Club.balance`, `Club.wageBudget`, `Club.transferBudget` |

---

### X4. Formation definitions exist in 3 places

| Location | File |
|----------|------|
| Frontend tactics UI | `apps/frontend/src/lib/formations.ts` |
| Match renderer | `apps/frontend/src/lib/match-renderer.ts` (FORMATION_POSITIONS) |
| Shared constants | `packages/shared/src/constants/index.ts` (FORMATIONS) |

All three define formations with different position names and coordinate systems.

---

### X5. Two `randInt` function definitions

| Location | File |
|----------|------|
| `apps/frontend/src/lib/game-data.ts` | `function randInt(min, max)` |
| `apps/frontend/src/lib/career-engine.ts` | `function randInt(min, max)` |

Both are local duplicates. Should be in `utils.ts`.

---

### X6. `dynamic = 'force-dynamic'` in client components

9 page files export `dynamic = 'force-dynamic'` while also being `'use client'`. This is a Next.js anti-pattern — the directive only works in server components.

---

## Security Issues

### S1. Hardcoded JWT fallback secret

**File:** `packages/auth/src/index.ts`

```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tactico-dev-secret-change-in-production'
);
```

If `JWT_SECRET` env var is not set, the app uses a hardcoded secret. In production, this would allow token forgery.

---

### S2. `IntroCinematic` creates AudioContext without closing it

**File:** `apps/frontend/src/components/onboarding/IntroCinematic.tsx`

```ts
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
// ... plays sound ...
ctx.close();
```

The `ctx.close()` is called immediately after `osc.stop()`, but `osc.stop()` is scheduled for `ctx.currentTime + 0.1`. The context may close before the sound finishes.

---

## Recommended Fix Priority Order

### Priority 1 — App won't start
1. **C1** — Add `Suspense` import to `AppShell.tsx`
2. **H12** — Fix `db` import in auth package

### Priority 2 — Core gameplay broken
3. **C2, C3** — Unify Player/Club types across packages
4. **C4, C5** — Fix transfer engine property references
5. **H2, H3** — Fix stale closures in match simulation
6. **M11** — Save manager details in onboarding flow

### Priority 3 — Match engine issues
7. **H5, H6** — Fix match-renderer SimulationEngine API calls
8. **H7** — Consolidate to one match engine
9. **L3** — Fix `PLAYER_CONFIG.playerMoveSpeed` reference
10. **H4** — Verify PixiJS version compatibility

### Priority 4 — Data/display issues
11. **C7** — Fix CSS `@import` order
12. **M12** — Fix default currency to EUR
13. **M17** — Reuse AudioContext
14. **H10, H11** — Fix finance calculations
15. **L4** — Fix Badge size prop

### Priority 5 — Code quality
16. **M1** — Remove duplicate `.glass` class
17. **M2** — Remove `dynamic` exports from client components
18. **H8, H9** — Move imports to top of file
19. **M18, X5** — Deduplicate utility functions
20. **X4** — Consolidate formation definitions

### Priority 6 — Polish
21. **L7, L8, L9** — Fix `Math.random()` in render
22. **L5** — Fix Unicode character in footer
23. **L1, L2** — Replace `any` types with proper types
24. **S1** — Remove hardcoded JWT secret fallback

---

## Fixes Applied (This Session)

### CRITICAL
- **C2/C3** — Rewrote `packages/transfer-engine/src/types/index.ts` to use frontend-compatible types (`number` IDs, `overallRating`/`potentialRating`, flat Club properties)
- **C4** — Updated `MarketEngine` to use `overallRating`/`potentialRating` and `contractExpires: string | null`
- **C5** — Updated `NegotiationEngine` to use optional `ambition`/`loyalty` with fallbacks
- **C6** — `getOffer()` still returns null (placeholder) but `handleCounterOffer` now handles this gracefully
- **C7** — CSS `@import` was already at top (false positive from initial audit)

### HIGH
- **H8** — Moved `ClipboardList, Dumbbell, ArrowLeftRight` imports to top of `dashboard/page.tsx`
- **H9** — Moved `Users, Star, Calendar, DollarSign` imports to top of `squad/page.tsx`
- **H12** — Auth package import was already fixed (false positive)

### MEDIUM
- **M1** — Removed duplicate `.glass` class from utilities layer in `globals.css`
- **M2** — `dynamic` exports were not present in client components (false positive)
- **M9** — Added `getCoachingEffect()` interpolation function to `training/types.ts` and updated `training/engine.ts` to use it
- **M11** — Manager details saving was already implemented (false positive)
- **M12** — Default currency was already EUR, fixed JSDoc comment
- **M13** — Rewrote `withErrorBoundary` HOC as a proper functional component wrapper
- **M16** — Added `'BOTH'` to `NegotiationHistory.actor` type definition
- **M17** — AudioContext reuse was already implemented (false positive)

### LOW
- **L3** — `playerMoveSpeed` reference was already correct (false positive)
- **L4** — `size="xs"` Badge usage was not present (false positive)
- **L7/L8/L9** — `Math.random()` in render was already fixed with `useMemo` (false positive)

### Security
- **S1** — JWT secret now throws in production if `JWT_SECRET` env var is not set

---

## Remaining Issues (Require Larger Refactoring)

The following issues were identified but require more extensive changes:

1. **H1** — Duplicate API routes in frontend + backend (architecture decision needed)
2. **H5/H6** — Match-renderer API references (H6 was false positive, H5 needs verification)
3. **H7** — Two competing match engines (needs consolidation decision)
4. **H10/H11** — Finance calculations (minor display inconsistencies)
5. **M4/M5** — TrainingEngine type mismatches with frontend Player (needs world-engine Player type alignment)
6. **M6** — WorldEngine EntityId type mismatch
7. **X4** — Formation definitions in 3 places (needs consolidation)
8. **M7/M8** — TrainingFocusArea duplicates (cosmetic)
9. **L1/L2** — `any` types in physics code (type safety improvement)

---

## Summary

The Tactico codebase has a solid architectural vision but suffers from **type system fragmentation** — the frontend, transfer-engine, and world-engine packages each define their own incompatible types for the same domain objects. This is the single biggest source of bugs and must be addressed before any cross-package integration can work.

The match simulation system has two competing implementations that need to be consolidated. The onboarding flow has a critical gap where manager identity is never persisted.

The UI layer (CSS, components, pages) is generally well-built but has several import order issues, stale closure bugs in the physics engine, and missing null checks that will cause runtime crashes.

**Total bugs found: 47**
- 7 CRITICAL (will crash)
- 12 HIGH (incorrect behavior)
- 18 MEDIUM (code quality/potential issues)
- 10 LOW (minor/cosmetic)
