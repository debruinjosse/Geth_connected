# Stolzl web fonts

GETH brand typography uses **Stolzl** (Book, Medium, Bold).

## Current setup

Fonts load from `app/fonts/stolzl.css` (CDN woff2). All UI tokens in `app/globals.css` point to the `Stolzl` family.

## Self-hosting (recommended for production)

1. Add licensed woff2 files from the client brand package:
   - `Stolzl-Book.woff2` (400)
   - `Stolzl-Medium.woff2` (500)
   - `Stolzl-Bold.woff2` (700)

2. Place them in this folder: `public/fonts/stolzl/`

3. Update `app/fonts/stolzl.css` src URLs to:

```css
src: url("/fonts/stolzl/Stolzl-Book.woff2") format("woff2");
```

4. Redeploy.

## Brand colors (reference)

| Name        | HEX     |
|-------------|---------|
| Deep purple | #3c223d |
| Gold        | #b7a057 |
| Light blue  | #0ca3d4 |
| Lime green  | #68b32d |
