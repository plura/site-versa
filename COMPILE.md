# Asset Compilation Guide

## Overview
This document describes how to compile individual asset files into the final override files for Drupal deployment.

## Compilation Process

### What Gets Combined

**CSS** (`assets/css/` → `overrides/plura-overrides.css`):
- `base.css` — CSS variables and base styles
- `fix.css` — Safari and iOS browser fixes
- `layout.css` — Layout overrides
- `masonry.css` — Masonry gallery styles

**JavaScript** (`assets/js/` → `overrides/plura-overrides.js`):
- `global.js` — Global helper functions
- `masonry.js` — Masonry initialization
- `video.js` — Video handling and Safari fixes
- `init.js` — **Last** (initialization and event listeners)

### Output Requirements

**CSS File:**
- Single file: `overrides/plura-overrides.css`
- Section headers showing which asset file each block came from

**JavaScript File:**
- Single file: `overrides/plura-overrides.js`
- Wrapped in IIFE: `(function () { /* all code here */ })()`
- `init.js` loaded/executed last

## How to Trigger Compilation

Simply ask:
```
"Compile assets into override files"
```

The agent will automatically:
1. Read all CSS files from `assets/css/`
2. Read all JS files from `assets/js/` 
3. Combine them in the correct order
4. Wrap JS in IIFE
5. Write `overrides/plura-overrides.css` and `overrides/plura-overrides.js`
6. Commit and push changes

## Deployment

After compilation, copy the files to your Drupal theme:
```bash
cp overrides/plura-overrides.css httpdocs/web/themes/custom/versa/css/
cp overrides/plura-overrides.js httpdocs/web/themes/custom/versa/js/
```

Then clear Drupal cache:
```bash
drush cr
```

Hard refresh your browser to verify changes.
