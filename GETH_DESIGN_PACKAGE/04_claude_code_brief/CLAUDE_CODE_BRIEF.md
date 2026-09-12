# Instructions for Claude Code: GETH Connected Flutter design revamp

You're revamping the visual design of an existing Flutter app ("GETH
Connected Cards") to match a client-approved mockup. The layout/structure is
already mostly right — this is a **visual polish and asset-swap pass**, not
a rebuild. Read `../01_design_analysis/DESIGN_ANALYSIS.md` first for full
context; this file is the condensed action list.

## Before you touch code
1. Find the app's existing theme/color definition file(s) in the Flutter
   project (likely `lib/theme/`, `lib/core/theme/`, or similar).
2. Cross-reference every hardcoded color in the widget tree against the
   "current build" hex values in `geth_design_tokens.dart` — those are the
   colors to replace.

## Step 1 — Swap the color system
Import or merge `geth_design_tokens.dart` (in `03_flutter_ready/`) into the
project's theme layer. Replace:
- `#231525` / `#301F32` (current backgrounds) → `GethColors.heroBgIndigo`
  (`#220F2F`) / `GethColors.heroBgIndigoAlt` (`#231438`)
- Any flat gold text/icon color → keep `GethColors.brandGold` for small UI
  elements, but use `GethColors.goldGlowWarm` for anything meant to glow or
  stand out (hero art, active states)

## Step 2 — Swap in the real vector icons
Replace whatever milestone-badge images are currently bundled with the
files in `02_assets/icons/svg/`. These are genuine vector paths extracted
from the client's own Illustrator file — not re-drawn, not raster:
- `geth_badge_01_nieuw.svg` through `geth_badge_06_inspirerend.svg`
- Use `flutter_svg` (`SvgPicture.asset(...)`) instead of `Image.asset(...)`
  for these — crisp at any size, tiny file size vs. PNG.
- Implement locked/unlocked state per the client's note ("Milestones &
  Badges become visual when achieved"): render achieved badges at full
  opacity/color, locked ones at ~30% opacity or with a grey `ColorFilter`.
  PNG fallbacks are in `02_assets/icons/png/` if any use case still needs
  raster.
- `geth_bird_mark_only.svg` — isolated bird glyph with no shield, useful
  for compact placements (app bar icon, splash screen, favicon).

## Step 3 — Hero card artwork
The current build's hero card art is a small, flat version of the
constellation-bird motif. Two options, in order of preference:
1. **Best**: get final artwork from the client's graphic designer (per
   their own docx note that GDs own visual assets) and drop it in.
2. **Interim/placeholder**: use `geth_constellation_bird_mark.svg` (in
   `02_assets/icons/svg/`) — a lightweight procedural vector approximation
   of the gold particle/constellation bird, built to sit on the
   `heroBgIndigo` background. It's not pixel-identical to the designer's
   original PNGs (`02_assets/logo/`), but it's scalable, tiny, and close
   enough to unblock development without waiting on final art.

Either way, apply `GethGradients.heroCard` as the card background gradient
rather than a flat fill — this is what gives the target mockup its depth.

## Step 4 — Build the Recognition DNA radar chart (Insights screen)
This component does not appear to exist in the current build at all, and
it's the single biggest visual gap vs. the approved mockup. Reference image:
`02_assets/reference_screens/client_target_mockup/target_03_insights_dna_radar.png`

Spec, read off that reference:
- Hexagonal (6-axis) radar/spider chart, one axis per quality: Betrouwbaar,
  Verbinder, Coach, Inspirerend, Innovatief, Aanpakker
- Each axis shows an icon + label above the number, number below the plot
- Plot line: gold stroke (`GethColors.goldGlowLight`, `#DDBF6F`)
- Plot fill: translucent lavender (`GethColors.radarFillLavender`, `#B39CC1`
  at reduced opacity)
- Center: dark navy circle (`#231438`) with "DNA Score" label + big number
- Concentric gridlines behind the plot in a very faint grey
- Package suggestion: `fl_chart` supports radar charts (`RadarChart`
  widget) and is already commonly used in Flutter — check if it's already a
  dependency before adding a new package.

## Step 5 — AI-insight card (Insights screen)
Reference: `target_02_insights_ai.png`. A purple gradient card with:
- "✨ AI-inzicht" pill label top-left
- Bold headline ("Je groeit als verbindende kracht")
- 2–3 lines of body copy
- "Meer over jouw inzichten →" button in `GethColors.ctaPurple` (`#63387D`)
- Decorative gold sparkle/particle graphic bottom-right (can reuse the
  constellation SVG at small scale + low opacity, or leave for designer)

## Step 6 — Stat card treatment
Current build's 2×2 stat cards use flat icon colors. Target mockup wraps
each stat icon in a soft circular colored badge (rose for heart/received,
blue for people/colleagues, orange for flame/streak, purple for
star/qualities). Apply ~15–20% opacity fills of each stat's accent color
behind the icon, full-strength icon color on top.

## Step 7 — Housekeeping items from the client's notes
These aren't visual-design work but were flagged in the client's brief and
should ride along with this pass if you're already touching these files:
- Global find/replace: every literal `"Geth"` string → `"GETH®"`
- Confirm the dark/light mode model with the client before building a full
  theme switcher — the two target screenshots suggest a **light base theme
  with dark feature/hero cards**, not a single global dark mode. Don't
  guess; ask if ambiguous.
- Notification bell icon exists but isn't wired up — not a design task,
  just flag it if you land in that part of the code.

## Do NOT do
- Don't hand-draw new brand artwork to replace the designer's raster
  constellation-bird PNGs — use the provided placeholder SVG or wait for
  final assets (see Step 3).
- Don't change the underlying screen structure/navigation — this is a
  visual pass on an already-approved layout, not a redesign.
