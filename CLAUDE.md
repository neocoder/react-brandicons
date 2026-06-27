# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (see `bun.lock`).

- `bun run build` — Vite library build + emit `.d.ts` via `tsc --emitDeclarationOnly` into `dist/`.
- `bun test` (or `bunx vitest run`) — run the Vitest suite once.
- `bunx vitest run src/BrandIcon.test.tsx -t "default alt text"` — single test (filename + `-t` name filter).
- `bunx vitest` — watch mode.

There is no lint or typecheck script; the `build` step is what surfaces TS errors (declaration emit type-checks `src/`, excluding tests per `tsconfig.json`).

## Architecture

Single-component library published to npm as `react-brandicons`. The whole public surface is `src/index.tsx` re-exporting `BrandIcon` from `src/BrandIcon.tsx`.

**What `BrandIcon` does that isn't obvious from the JSX:**

It renders an `<img>` whose `src` is built from `domain`, `size`, `apiKey`, and the optional `placeholder` / `loadingPlaceholder` query params (`p`, `pl`). The interesting behavior is the post-load **state-check loop**:

1. After every successful `onLoad`, it issues a `HEAD` to the same URL.
2. Reads the `x-brandicons-state` header: `loading` | `provisional` | `not-found` | (absent).
3. Schedules a re-render by incrementing a `bust` counter (which appends `&_=<n>` to the URL) according to a fixed backoff (`RETRY_DELAYS_MS` for `loading`, single 5-minute delay for `provisional`, stop otherwise).
4. HEAD and GET share the CloudFront cache key so polls usually hit the edge.

Cleanup: a `useEffect` keyed on `url` resets `attemptRef` and on unmount/url-change clears the pending timeout and aborts any in-flight HEAD via `AbortController`.

When changing retry logic, keep these invariants:
- `RETRY_DELAYS_MS` indexed by `attemptRef.current`; `undefined` past the end means "stop polling" — do not wrap or loop.
- Bumping `bust` is the only way to force the browser to re-request the image (URL must change).
- `retry={false}` must skip the HEAD entirely (no network at all post-load).

## Build output

Vite library mode produces `dist/index.js` (ESM) + `dist/index.cjs` (CJS) with `react` and `react/jsx-runtime` marked external. `tsc` then writes `dist/index.d.ts`. Published files are restricted to `dist/`, `README.md`, `LICENSE` via `package.json#files`.

React 18 and 19 are both supported (peer dep `>=18.0.0`); devDep pins React 19, so don't rely on 19-only APIs in component code.
