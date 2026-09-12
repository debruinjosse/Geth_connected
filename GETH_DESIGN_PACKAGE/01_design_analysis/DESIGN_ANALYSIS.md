# GETH Connected — Design Analysis & Revamp Direction
Prepared for: Josse (developer) → to hand to Claude Code
Purpose: give Claude Code everything it needs to revamp the Flutter app's
visual design to match what the client actually approved, without guessing.

---

## 1. THE CORE PROBLEM (in one paragraph)

The client approved a Lovable mockup (`gethappmockup.lovable.app`) that has a
premium, dark-indigo-and-gold, "constellation" visual identity with rich
depth (glow, gradients, a radar/spider chart, layered cards). The Flutter
build that was actually delivered uses the **same layout and component
structure**, but with flat, muted, brownish-plum colors, no glow/gradient
treatment, no radar chart, and a generally lower-contrast, lower-polish
finish. Structurally the two are close. Visually, they read as two
different products. That gap — not the layout — is almost certainly what's
frustrating the client.

---

## 2. SOURCE FILES INVENTORIED

| File | What it is |
|---|---|
| `gethappmockup.lovable.app` (docx link) | The client-approved mockup the app should look like |
| 3 screenshots (jossedebruin attachments) | Annotated screen captures of that Lovable mockup — Home, Insights (AI panel), Insights (DNA radar chart) |
| `Beeld met nieuw design GETH app.png` / `Beeld met nieuw design.png` | Screenshots of the **current Flutter build** — Home screen |
| `Serie iconen GETH.pdf` | **Official vector icon set** from Illustrator — 6 milestone shield badges (Nieuw → Zichtbaar → Erkend → Groeiend → Verbindend → Inspirerend). Real vector paths, not flattened art. |
| `logo sky GETH inzoom/uitzoom.png` + 2 more | The gold "constellation bird" hero artwork, in 4 crops/variants — this is raster (rendered), not vector |
| `Geth_app_mockup_link_and_info.docx` | Client's own notes (reproduced in full in section 6) |

---

## 3. COLOR PALETTE

### 3.1 Brand core — exact values (pulled directly from the vector icon PDF's fill data, not eyeballed)

| Role | Hex | Swatch context |
|---|---|---|
| Brand purple (shield fill) | `#3C233D` | Background of every milestone badge |
| Brand gold | `#B69F57` | Milestone dot / laurel / accent |
| Brand teal | `#03A2D4` | "Verbindend" leaf accent |
| Brand green | `#6AB32D` | "Groeiend" leaf accent |
| White | `#FFFFFF` | Bird glyph, badge fill |

### 3.2 Target direction — sampled from the client's approved mockup

| Role | Hex | Notes |
|---|---|---|
| Hero/insight card background | `#220F2F` | Deep indigo-purple, near-black — **cooler and darker** than the current build's `#231525` |
| Secondary panel background | `#231438` | Used behind the DNA-score circle in the radar chart |
| CTA button purple | `#63387D` | "Meer over jouw inzichten" button |
| Radar chart fill | `#B39CC1` | Light lavender, translucent-looking |
| Gold glow / outline | `#DDBF6F` – `#D4AF6A` | Brighter, warmer gold than the flat brand gold — used for glow/highlight states |
| Light-mode page background | `#FCFCFC` | Near-white, used on Insights screen outside the hero card |
| Dark text on light bg | `#1E1033` | Near-black indigo, not pure black |

### 3.3 Current build — what's live today (for diffing only)

| Role | Hex |
|---|---|
| App/page background | `#231525` |
| Card background | `#301F32` |

**The gap in one line:** the current build's purple is warmer/browner and
flatter; the target is a cooler, deeper indigo with gold glow accents layered
on top rather than just flat gold text/icons.

A ready-to-import Flutter/Dart version of this palette is in
`03_flutter_ready/geth_design_tokens.dart`.

---

## 4. TYPOGRAPHY

`pdffonts` on the official icon PDF shows two embedded weights of a font
called **Stölzl** (`Stolzl-Book`, `Stolzl-Medium`) — a licensed geometric
sans-serif (Milieu Grotesque). This is very likely the brand typeface.

**Action needed:** confirm with the client/designer whether they hold a
license for Stölzl and have the font files. If not, a free geometric-sans
alternative (Manrope, Sora, or General Sans from Google Fonts) will get you
90% of the way there — same rounded-geometric character, similar x-height.

---

## 5. LAYOUT & COMPONENT INVENTORY

Both versions (current build and target mockup) share the same structural
skeleton on Home:

1. Top bar: logo lockup (left), NL/EN toggle, notification bell, info icon,
   theme/settings icon
2. Personal greeting ("Goedemorgen, Josse") with avatar
3. Hero card — big rounded card with headline + decorative art
4. "Jouw profiel groeit" milestone strip — horizontal row of the 6 shield
   badges inside a white pill container, with a progress bar underneath
5. 2×2 stat grid (received cards / given cards / qualities recognized /
   badges)
6. "Top 3 ontvangen kwaliteiten" panel
7. "Recent ontvangen" list with a "Bekijk alles" link
8. Bottom tab bar: Home / Give / Scan / Insights / Profile

**Where the target mockup goes further** (and the current build doesn't yet):

- **Hero card art**: target uses the gold constellation-bird illustration
  as a full-bleed background inside the hero card, with a glow/particle
  effect. Current build has a much smaller, flatter version of the same
  motif tucked in the corner.
- **Insights screen — Recognition DNA radar/spider chart**: this is in the
  target mockup and appears to be **entirely missing** from the current
  build (not present in either current-build screenshot supplied). This is
  probably the single biggest visual differentiator the client is missing.
- **AI-insight panel**: target has a dedicated purple gradient card with a
  sparkle icon, "AI-inzicht" label, a short generated insight, and a "Meer
  over jouw inzichten →" CTA button. Worth checking if this exists in the
  current build's Insights tab at all.
- **Depth/glow treatment**: target uses soft glows behind gold elements and
  layered card shadows; current build reads flat/matte throughout.
- **Stat cards**: target's stat icons sit in colored circular badges
  (rose/blue/orange/purple backgrounds behind heart/people/flame/star
  icons) for quick visual scanning. Current build's stat icons are flatter
  and less differentiated.

---

## 6. CLIENT'S OWN NOTES (verbatim, from the docx)

> **Overall:** All visuals will be designed by Graphic Designers and
> adjusted when ready.
>
> **Home:**
> - Needs to be dynamic, meaning Milestones & Badges become visual when
>   achieved.
> - Notification button is not connected yet.
> - A dark/Light modus (mode).
> - Personal Welcoming message with profile pic.
> - All "Geth" needs to be "GETH®" (registered trademark symbol, every
>   instance).
>
> **Scan & Give cards:**
> - Scan Cards is now a demo simulation — when developed this needs to work
>   live and be connected with the backend.
> - All cards are visual and need to be the original ones.
>
> **Insights:** *(note ends here in the source doc — no further detail was
> provided under this heading)*

**Read-through / implications for Claude Code:**
- The milestone badges (section 5, item 4) should render **conditionally**
  — locked/greyed vs. achieved/full-color — rather than always showing all
  6 in full color. The extracted SVGs in `02_assets/icons/svg/` are already
  separated per-milestone, so a locked-state (e.g. reduced opacity + grey
  filter) can be applied per-badge in Flutter without new art.
- Every literal "Geth" text string in the UI needs to become "GETH®" — this
  is a global find/replace across the codebase, not a design decision.
- Dark/light mode: the target mockup screenshots actually show **both** —
  the Home screen is dark-hero-on-dark-page, while Insights is
  dark-hero-card-on-light-page. This suggests the design isn't a single
  dark theme but a light base theme with intentionally-dark hero/feature
  cards throughout. Worth confirming with the client which model they mean
  before building a full theme-switcher.
- "Scan cards is now a demo" — not a visual-design issue, flag to the client
  as a backend/functionality item, out of scope for this design pass.

---

## 7. WHAT THIS PACKAGE DOES NOT INCLUDE

- No new brand illustration was generated to replace the gold constellation
  bird artwork — the client's docx explicitly says a graphic designer owns
  visual asset creation. Instead, a lightweight **vector approximation**
  of that artwork (`geth_constellation_bird_mark.svg`) is included as a
  cheaper, scalable stand-in Claude Code can use immediately in Flutter
  (SVG renders instantly and scales losslessly, vs. shipping large PNGs) —
  swap for final designer artwork later.
- No radar-chart widget code — that's implementation, not a static asset.
  The brief in `04_claude_code_brief/` describes what it needs to look like
  and calls out a Flutter charting approach.
