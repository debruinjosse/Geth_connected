// ============================================================================
// GETH CONNECTED — DESIGN TOKENS
// ============================================================================
// Generated from: (1) exact vector fill colors inside the client's official
// Illustrator icon export ("Serie iconen GETH.pdf"), and (2) pixel-sampled
// colors from the client's approved target mockup (Lovable) screenshots.
//
// These are NOT guesses — the brand colors below (purple/gold/teal/green)
// are the literal fill values used in the client's own vector artwork.
// The mockup-only colors (indigo background, radar lavender, etc.) are
// sampled from the reference screenshots and should be treated as a close
// starting point — confirm against the graphic designer's file if one
// exists, since the docx notes say "all visuals will be designed by
// Graphic Designers and adjusted when ready."
// ============================================================================

import 'package:flutter/material.dart';

class GethColors {
  GethColors._();

  // ---- BRAND CORE (from official vector icon set — exact) ----------------
  static const Color brandPurple      = Color(0xFF3C233D); // shield fill
  static const Color brandGold        = Color(0xFFB69F57); // milestone accent gold
  static const Color brandTeal        = Color(0xFF03A2D4); // "verbindend" leaf
  static const Color brandGreen       = Color(0xFF6AB32D); // "groeiend" leaf
  static const Color white            = Color(0xFFFFFFFF);

  // ---- TARGET DIRECTION (sampled from client's approved Lovable mockup) --
  // This is the look the client wants to move TOWARD. Cooler / deeper /
  // more indigo than the current build, with glow and gradient use.
  static const Color heroBgIndigo       = Color(0xFF220F2F); // hero/insight card bg
  static const Color heroBgIndigoAlt    = Color(0xFF231438); // secondary panel bg
  static const Color ctaPurple          = Color(0xFF63387D); // "Meer over jouw inzichten" button
  static const Color radarFillLavender  = Color(0xFFB39CC1); // spider-chart fill
  static const Color goldGlowLight      = Color(0xFFDDBF6F); // glow/highlight gold
  static const Color goldGlowWarm       = Color(0xFFD4AF6A); // constellation star gold
  static const Color pageBgLight        = Color(0xFFFCFCFC); // light-mode page bg
  static const Color textDarkOnLight    = Color(0xFF1E1033); // near-black indigo text

  // ---- CURRENT BUILD (what's live today — for reference / diffing only) --
  static const Color currentBgTop     = Color(0xFF231525);
  static const Color currentBgCard    = Color(0xFF301F32);

  // ---- SEMANTIC ROLES ------------------------------------------------------
  static const Color scaffoldBackground = heroBgIndigo;      // was currentBgTop
  static const Color cardBackground     = heroBgIndigoAlt;   // was currentBgCard
  static const Color primaryAccent      = brandGold;
  static const Color secondaryAccent    = ctaPurple;
  static const Color success            = brandGreen;
  static const Color info               = brandTeal;
}

class GethGradients {
  GethGradients._();

  /// Hero card gradient — deep indigo to near-black, matches target mockup
  static const LinearGradient heroCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2A1640), Color(0xFF190B26)],
  );

  /// Gold glow used behind constellation / milestone artwork
  static const RadialGradient starGlow = RadialGradient(
    colors: [Color(0xFFFFE9B8), Color(0xFFD4AF6A), Color(0x00B69F57)],
    stops: [0.0, 0.45, 1.0],
  );
}

class GethRadii {
  GethRadii._();
  static const double card = 24.0;
  static const double pill = 999.0;
  static const double chip = 16.0;
}

class GethSpacing {
  GethSpacing._();
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
}

// ============================================================================
// TYPOGRAPHY
// Body/heading font observed in vector PDF: "Stolzl" (Stolzl-Book / Stolzl-Medium)
// This is a licensed geometric sans (Stolzl by Milieu Grotesque). Confirm the
// client has a license + font files before bundling; fall back to a similar
// geometric sans (e.g. "General Sans", "Sora", or "Manrope" from Google Fonts)
// if Stolzl isn't licensed for the app.
// ============================================================================
class GethTypography {
  GethTypography._();
  static const String fontFamilyPrimary = 'Stolzl'; // confirm license
  static const String fontFamilyFallback = 'Manrope'; // free geometric-sans alternative
}
