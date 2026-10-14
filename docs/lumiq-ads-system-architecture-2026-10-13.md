# LUMIQ — Ads System Architecture & Build Plan

_Created 2026-10-13. Target networks: Google AdSense + Taboola/Outbrain, generic fallback for any future network. Full system incl. consent (CMP)._

## 1. Current state (what already exists)

| Layer | File | Status |
|---|---|---|
| DB model | `prisma/schema.prisma` → `model AdSlot` | ✅ name, position, type(script/iframe/image), code, enabled, timestamps; `@@index([position, enabled])` |
| Admin UI | `app/admin/ads/page.tsx` | ✅ full CRUD, 8 positions, 3 types, enable toggle |
| Admin API | `app/api/admin/ads/route.ts`, `app/api/admin/ads/[id]/route.ts` | ✅ GET/POST/PATCH/DELETE |
| Public render | `components/AdSlot.tsx` (server, `unstable_cache` 1h) | ✅ rendered in 8 page types |
| AdSense loader | `app/layout.tsx` | ❌ none |
| ads.txt | `public/ads.txt` | ❌ none |
| Consent / CMP | — | ❌ none (only a privacy page) |

## 2. Critical findings (fix before relying on ads)

1. **🔴 `script` ads do not execute.** `AdSlot.tsx` injects `ad.code` via
   `dangerouslySetInnerHTML`. The browser parses injected `<script>` tags but
   **does not run them** (HTML5 spec). So any AdSense/Taboola snippet pasted
   today renders inert. Fix: a client `ScriptAd` component that recreates each
   `<script>` node via `document.createElement` so it executes.
2. **🔴 Position list mismatch.** Admin offers 8 positions; `AdSlot.tsx` accepts
   ~30. Positions outside the admin list can never be filled; some admin
   positions (`homepage-top`) differ from render positions (`home-top`).
   Fix: single shared `AD_POSITIONS` source of truth in `lib/ads/positions.ts`.
3. **No pop-up / interstitial / sticky / dismissible formats** — the formats the
   owner asked for.
4. **No CMP / consent** — AdSense policy requires a certified CMP for EEA/UK
   traffic; script ads should not load before consent there.
5. **No frequency cap, scheduling, or per-page targeting** — mandatory for
   pop-ups to avoid a bad UX and SEO penalty.

## 3. Target architecture

```
lib/ads/
  positions.ts     # AD_POSITIONS + AD_FORMATS + labels (shared admin ↔ render)
  types.ts         # AdSlot TS types, AdFormat, AdNetwork unions
  consent.ts       # read/write consent state (localStorage + cookie)
components/ads/
  ScriptAd.tsx     # client — executes script snippets correctly (FIX #1)
  InlineAd.tsx     # server wrapper, replaces current AdSlot for in-flow slots
  PopupAd.tsx      # modal interstitial, X to close, frequency-capped
  StickyBottomAd.tsx  # anchored bottom banner, dismissible
  SidebarStickyAd.tsx # sticky-on-scroll sidebar unit
  AdManager.tsx    # client, mounted once in layout; fetches active popup/sticky
  ConsentBanner.tsx   # Accept / Reject; gates script ads
app/api/ads/active/route.ts   # public, cached — serves popup/sticky slots as JSON
public/ads.txt     # publisher verification lines (needs real pub IDs)
```

### Data model additions (one additive migration)

```prisma
model AdSlot {
  // ...existing...
  format        String   @default("inline")   // inline | sticky-bottom | popup | interstitial | sidebar-sticky
  network       String   @default("direct")   // adsense | taboola | outbrain | direct
  dismissible   Boolean  @default(false)       // show an X / close button
  frequencyHours Int     @default(0)           // min hours between showings per visitor (popup/sticky); 0 = always
  priority      Int      @default(0)           // higher wins when multiple match a position
  startAt       DateTime?                       // schedule window
  endAt         DateTime?
  pages         String[] @default([])           // path globs to include; empty = all eligible
  @@index([position, enabled])
  @@index([format, enabled])
}
```

### Format behaviour

| Format | Render | Close | Frequency control |
|---|---|---|---|
| `inline` | in page flow (current behaviour) | no | — |
| `sidebar-sticky` | sticky in sidebar column on scroll | optional | — |
| `sticky-bottom` | fixed bottom banner | X button | `frequencyHours` via localStorage |
| `popup` | centered modal + backdrop | X button (required) | `frequencyHours` |
| `interstitial` | full-screen between navigations | X + countdown | `frequencyHours` |

### Consent flow (CMP-lite)

- First visit: `ConsentBanner` (Accept all / Reject non-essential).
- Choice stored in `localStorage` + a cookie (SSR read for EEA).
- `network === "adsense" | "taboola" | "outbrain"` → script loads **only after Accept**.
- `network === "direct"` (image/iframe house ads) → always allowed.
- For AdSense specifically: integrate Google's **Consent Mode v2** signals, or a
  Google-certified CMP (e.g. the free AdSense-provided one) when the account is
  live. Our banner carries consent for non-EEA MENA traffic in the meantime.

### Multi-network support

- `network` field per slot + a global per-network config in settings
  (`lib/settings.ts`): `ADSENSE_CLIENT` (ca-pub-…), `TABOOLA_PUBLISHER`, enabled
  flags. AdSense base loader injected once in `layout.tsx`, gated on the flag +
  consent. Each slot's `code` holds only the unit snippet.

## 4. Build phases (each ends with a deploy-approval gate)

- **Phase 0 — bug fix + plumbing (small, high value).**
  `ScriptAd` client that executes snippets; shared `lib/ads/positions.ts`;
  `public/ads.txt` (placeholder pub IDs + instructions); AdSense base loader in
  layout gated behind a settings flag (inert until the owner pastes the pub ID).
- **Phase 1 — model extension.** Add the fields above + one additive migration;
  extend admin API + admin UI (format, network, dismissible, frequency,
  schedule, pages). Keep existing slots working (defaults = today's behaviour).
- **Phase 2 — new format components.** `PopupAd`, `StickyBottomAd`,
  `SidebarStickyAd`, `InterstitialAd` + `AdManager` in layout + `/api/ads/active`.
  Frequency capping via localStorage. Close buttons.
- **Phase 3 — consent + networks + polish.** `ConsentBanner`, consent gating of
  script ads, Consent Mode v2 wiring, per-network settings, admin preview, and
  position-list sync cleanup.

## 5. Open items the owner must provide when live

- AdSense publisher ID (`ca-pub-…`) → ads.txt + loader + Consent Mode.
- Taboola/Outbrain publisher ID + snippet → ads.txt + network config.
- Decision on EEA CMP: Google-certified CMP vs. our banner + Consent Mode v2.

---
## 6. Build log

- **Phase 0** ✅ merged (PR #33): ScriptAd fix, `lib/ads/positions.ts`, ads.txt, AdSense loader (env-gated).
- **Phase 1** ✅ merged (PR #34) + migration applied to prod: format/network/dismissible/frequencyHours/priority/startAt/endAt/pages; admin API + UI; inline renderer serves only `inline` + schedule window + priority order.
- **Phase 2** ✅ merged (PR #35): `/api/ads/active`, `AdManager`, `OverlayAd` (popup/interstitial always-closeable, sticky-bottom/sidebar optional X), `AdBody`; frequency cap via localStorage.
- **Phase 3** — consent: `lib/ads/consent.ts`, `ConsentBanner`, Consent Mode v2 default in layout, `ScriptAd` gated on consent per network (`direct` never waits). Per-network config: AdSense via `NEXT_PUBLIC_ADSENSE_CLIENT`; Taboola/Outbrain publisher IDs live inside their pasted snippet (self-contained).

## 7. Go-live checklist (owner)

1. Set `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…` in Vercel env → redeploy (activates the base loader).
2. Fill real publisher lines in `public/ads.txt` → redeploy.
3. In `/admin/ads`, create slots: pick position/format/network, paste the network's unit snippet into `code`, set dismissible/frequency for overlays.
4. (EEA/UK) layer a Google-certified CMP; the existing banner already feeds Consent Mode v2 `granted`/`denied`.
5. Verify a test popup appears, closes, and respects its frequency cap.
