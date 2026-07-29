# Landing Mobile Responsive Audit

Generated: 2026-07-27

## 1. Conflicting Rules Consolidated

- Added one authoritative section at the end of `app/globals.css`: `Public landing responsive system`.
- This section overrides older landing-specific mobile rules at `max-width: 920px`, `max-width: 768px`, `max-width: 767px`, `max-width: 700px`, and `max-width: 480px`.
- Dashboard and protected portal responsive rules were not modified.
- The old mobile issue where `.site-nav` became a horizontal pill row is overridden for public pages.
- The old mobile hero conflict where `.mobileHeroPreview` rendered after `.scrollToExplore` is fixed in JSX.
- The desktop `HeroDashboardMockup` is explicitly hidden below 768px, and the mobile preview is the only rendered product visual.

## 2. Mobile Navigation Implementation

- Created `components/PublicMobileNav.tsx`.
- `PublicSiteChrome` now passes localized links and labels into the client mobile menu.
- The client component handles only open/close behavior, Escape key close, backdrop close, and scroll locking.
- Route localization remains server-side in `PublicSiteChrome`.

## 3. Hero DOM Order Change

New hero order:

1. `landingHeroCopy`
2. `desktopHeroPreview`
3. `mobileHeroPreview`
4. `scrollToExplore`

This keeps mobile preview in normal document flow before the scroll cue.

## 4. Mobile Hero Dimensions

- Mobile hero uses a single-column grid.
- Headline uses `clamp(42px, 13vw, 58px)`.
- Hero buttons become full-width with wrapping text.
- Trust items use a two-column grid, falling back to one column on small phones.
- Mobile product preview maxes at `430px` and uses normal flow.
- Physical card uses `clamp(68px, 22vw, 88px)` and does not force page overflow.

## 5. How It Works Mobile Layout

- Desktop remains five equal columns.
- Mobile becomes a vertical timeline.
- Icons remain visible.
- Text is left-aligned and allowed to wrap safely.
- Connecting line is positioned from the number column.

## 6. Carousel Overflow Fix

- Mobile carousel uses `grid-auto-columns: 100%`.
- Card carousel padding is removed on mobile.
- Arrows stay inside the viewport.
- Recognition card titles can wrap on mobile and no longer use ellipsis.

## 7. Audience Card Mobile Layout

- Mobile audience cards use a compact two-column card layout.
- Icon sits in the first column.
- Copy and CTA sit in the second column.
- Desktop three-column layout is preserved.

## 8. CTA Mobile Layout

- Final CTA becomes one column below 768px.
- Buttons become full-width.
- Image keeps a stable `4 / 3` aspect ratio and no overlap.

## 9. Footer Mobile Layout

- Footer becomes one column on mobile.
- Footer links use a two-column grid.
- Legal/meta links wrap naturally.
- Footer text and links no longer force horizontal overflow.

## 10. EN/NL Translation Checks

- Added mobile navigation labels:
  - `nav.menu`
  - `nav.closeMenu`
- Mobile buttons, nav rows, cards, footer links, and CTA text are allowed to wrap.
- The route-based language switcher remains visible in the mobile header.

## 11. Viewports Tested

Verified with Playwright on the local production server at `http://localhost:3010`.
Both `/nl` and `/en` were tested.

- 320 x 568
- 360 x 800
- 375 x 812
- 390 x 844
- 430 x 932
- 768 x 1024
- 920 x 1180
- 1100 x 800
- 1280 x 800
- 1440 x 900

Results:

- No horizontal overflow at any tested viewport.
- Mobile menu opened successfully at 320, 360, 375, 390, and 430 widths.
- Desktop navigation stayed hidden below 768px.
- Mobile navigation stayed hidden at 768px and above.
- Mobile hero preview was visible below 768px.
- Desktop hero preview was visible at 768px and above.
- EN and NL language links stayed route-based and available in the header.
- Console check after testing: 0 warnings, 0 errors.

## 12. Desktop Comparison Result

Desktop selectors for 1100px and above were not intentionally redesigned.
The new responsive system is scoped to `max-width: 1099px`, `max-width: 767px`, and `max-width: 479px`.

Verified at 1100, 1280, and 1440 widths:

- Desktop navigation is visible.
- Desktop actions are visible.
- Mobile navigation is hidden.
- Desktop hero preview is visible.
- No horizontal overflow was detected.

## 13. Files Changed

- `app/[locale]/page.tsx`
- `components/PublicSiteChrome.tsx`
- `components/PublicMobileNav.tsx`
- `app/globals.css`
- `messages/en.json`
- `messages/nl.json`
- `LANDING_MOBILE_RESPONSIVE_AUDIT.md`

## 14. Lint/Build Results

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
