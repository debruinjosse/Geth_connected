GETH CONNECTED — DESIGN REVAMP PACKAGE
========================================

Everything needed to hand this to Claude Code and get the Flutter app's
visual design aligned with what the client actually approved.

FOLDER GUIDE
------------
01_design_analysis/
    DESIGN_ANALYSIS.md          <- Start here. Full breakdown: colors,
                                    typography, layout/component diff between
                                    current build and client's target mockup,
                                    plus the client's own notes reproduced
                                    and interpreted.
    client_notes_original.docx  <- The original file the client sent.

02_assets/
    icons/svg/                  <- Real vector icons, extracted directly
                                    from the client's Illustrator file
                                    (not redrawn). Production-ready for
                                    flutter_svg.
    icons/png/                  <- High-res raster fallback of the same
                                    icons, transparent background.
    icons/geth_icon_series_SOURCE_illustrator_export.pdf
                                 <- The original vector source, kept for
                                    provenance / re-export if needed.
    logo/                       <- The 4 supplied gold "constellation bird"
                                    hero-art images (raster, designer-made).
    reference_screens/client_target_mockup/
                                 <- Screenshots of the client-approved
                                    Lovable mockup (what they want).
    reference_screens/current_build/
                                 <- Screenshots of the current Flutter app
                                    (what's live now).

03_flutter_ready/
    geth_design_tokens.dart     <- Drop-in Dart file: exact hex colors,
                                    gradients, spacing, radii, typography
                                    notes. Ready to import into the project.

04_claude_code_brief/
    CLAUDE_CODE_BRIEF.md        <- The actual step-by-step task list for
                                    Claude Code. Point it at this file.

COMBINED_PACKAGE_SUMMARY.txt (in this root folder)
                                 <- Single plain-text file with everything
                                    above concatenated, for tools/contexts
                                    that only accept one text file.

HOW TO USE THIS WITH CLAUDE CODE
---------------------------------
1. Unzip this package inside (or next to) the Flutter project repo.
2. Point Claude Code at 04_claude_code_brief/CLAUDE_CODE_BRIEF.md and ask
   it to execute the steps in order.
3. Claude Code should read 01_design_analysis/DESIGN_ANALYSIS.md first for
   context, then use 02_assets/ and 03_flutter_ready/ as source material.
