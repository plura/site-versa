# site-versa

Version-controlled CSS and JavaScript overrides for the Versa Drupal theme on versa-plus.com. Maintains a clean history, enables safe updates, and supports easy rollback.

## Repository Structure

- **`overrides/`** — CSS and JavaScript override files
- **`assets/`** — Supporting assets (SVGs, etc.)
- **`test-video/`** — Standalone video test page, uploaded via SFTP to Catarina's host (intermediary for this project). Copy `.vscode/sftp.json.example` to `sftp.json` and fill in credentials.

## Drupal Theme Integration

### File Locations

Theme root: `httpdocs/web/themes/custom/versa`

Key theme files:
- `versa.info.yml`
- `versa.libraries.yml`
- `css/plura-overrides.css` (loaded via library)
- `js/plura-overrides.js` (loaded via library)

### Library Registration

**In `versa.libraries.yml`:**

```yml
plura_overrides:
  css:
    theme:
      css/plura-overrides.css: {}
  js:
    js/plura-overrides.js: {}
```

**In `versa.info.yml`:**

```yml
libraries:
  - versa/global
  - versa/plura_overrides
```

**Note:** Paths in `versa.libraries.yml` are relative to the theme root.

### Adding Override Files

1. Create the file in the theme directory
2. Register in `versa.libraries.yml` under the same library
3. No changes needed to `versa.info.yml` unless you rename the library key

Example of adding a new CSS file to the library:

```yml
plura_overrides:
  css:
    theme:
      css/plura-overrides.css: {}
      css/plura-extra.css: {}
  js:
    js/plura-overrides.js: {}
```

**When renaming files or library keys:** Update all references in `versa.libraries.yml`, `versa.info.yml`, and any Twig templates using `attach_library()`.

## Deployment

### 1. Update Override Files

Upload to the theme directory (server: `versapm@82.208.20.190`):
```bash
scp overrides/plura-overrides.css versapm@82.208.20.190:/var/www/vhosts/versa-plus.com/httpdocs/web/themes/custom/versa/css/
scp overrides/plura-overrides.js  versapm@82.208.20.190:/var/www/vhosts/versa-plus.com/httpdocs/web/themes/custom/versa/js/
```

### 2. Clear Drupal Cache

Required after modifying `versa.info.yml`, `versa.libraries.yml`, or override files — Drupal serves aggregated copies from `sites/default/files/{css,js}/`, which stay stale until rebuilt.

Log in interactively, then run:

```bash
ssh versapm@82.208.20.190
cd /var/www/vhosts/versa-plus.com/httpdocs
vendor/bin/drush cr
```

**Don't** use the one-liner `ssh versapm@… "… drush cr"`: non-interactive shells get the system PHP 8.1, and Composer requires ≥ 8.3 (fatal `platform_check.php` error). The interactive login shell picks up the right PHP.

Then hard refresh your browser.

### 3. Verify

- Check DevTools → Network tab for CSS/JS loading
- Test layout and functionality
- Re-test browser-specific behavior if applicable

## Security

Never commit:
- Server credentials
- SSH/SFTP configuration  
- Production URLs containing secrets

Keep access credentials in local, git-ignored configuration files.
