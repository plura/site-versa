# Compiling the overrides

From `core/` in Git Bash:

```bash
sh compile.sh
```

This rebuilds both files in `overrides/` from `assets/`, always overwriting them. Commit the sources and the rebuilt files together, then deploy (see [README → Deployment](README.md#deployment)).

## Build order

**CSS** (`assets/css/` → `overrides/plura-overrides.css`):
1. `base.css` — colour variables
2. `fix.css` — Safari/iOS and theme bug fixes
3. `layout.css` — client-requested design and colour overrides
4. `masonry.css` — Masonry gallery layout (must follow `fix.css` to override its column layout)

**JavaScript** (`assets/js/` → `overrides/plura-overrides.js`), wrapped in one IIFE:
1. `global.js` — shared helpers (browser detection, logging, SVG inlining)
2. `masonry.js` — Masonry gallery
3. `video.js` — grid and hero video fixes
4. `init.js` — **last**: sets HTML classes and runs everything

A new source file must be added to the list in `compile.sh` and here.
