# site-versa

Overrides and custom changes for `versa-site` (tracked separately).

This repository exists to maintain a clean, versioned history of the override layer (CSS/JS and related assets) that is wired into the custom **Versa Drupal theme** used on versa-plus.com.

---

## Purpose

Instead of editing the theme blindly on the server, this repo tracks:

- CSS overrides
- JavaScript overrides
- Supporting assets (SVGs, etc.)
- Structural notes about how overrides are registered in Drupal

This ensures:

- Safe updates
- Clear version history
- Easier rollback if something breaks
- Clean separation from the base Versa theme

---

## Repository Structure

Typical folders:

- `overrides/`  
  Working versions of override CSS/JS files.

- `assets/`  
  SVGs or related override assets.

- Other test folders (if present) are for development only.

---

## Where Overrides Live in the Drupal Theme

Theme root on the server:

```

httpdocs/web/themes/custom/versa

```

Key files:

```

versa.info.yml
versa.libraries.yml

```

Override files loaded by Drupal:

```

css/plura-overrides.css
js/plura-overrides.js

````

Paths inside `versa.libraries.yml` are always relative to the theme root.

---

## How Overrides Are Registered in Drupal

### 1. Library definition (`versa.libraries.yml`)

Example:

```yml
plura_overrides:
  css:
    theme:
      css/plura-overrides.css: {}
  js:
    js/plura-overrides.js: {}
````

If you rename files, you must update the paths here.

---

### 2. Library attached in `versa.info.yml`

```yml
libraries:
  - versa/global
  - versa/plura_overrides
```

If you rename the library key in `versa.libraries.yml`,
you must also update:

* `versa.info.yml`
* Any Twig templates using `attach_library('versa/plura_overrides')`

---

### 3. Adding Additional Override Files

To add extra override files:

1. Create the file inside the theme:

```
css/plura-extra.css
js/plura-extra.js
```

2. Register them inside the same library:

```yml
plura_overrides:
  css:
    theme:
      css/plura-overrides.css: {}
      css/plura-extra.css: {}
  js:
    js/plura-overrides.js: {}
    js/plura-extra.js: {}
```

No changes are required in `versa.info.yml` if the library key remains the same.

---

## Deployment Steps

### 1. Update Override Files

Copy or update the override files in the live theme:

```
httpdocs/web/themes/custom/versa/css/plura-overrides.css
httpdocs/web/themes/custom/versa/js/plura-overrides.js
```

---

### 2. Clear Drupal Cache (Required)

After modifying:

* `versa.info.yml`
* `versa.libraries.yml`
* CSS/JS file additions or renames

Run:

```bash
cd /var/www/vhosts/versa-plus.com/httpdocs
vendor/bin/drush cr
```

Then hard refresh your browser.

---

## Verification Checklist

* Confirm CSS and JS files are loading in DevTools → Network
* Test layout changes
* Re-test Safari-specific behaviour if applicable

---

## Important

Never commit:

* Server credentials
* SSH/SFTP configuration
* Production URLs containing secrets

Keep access credentials in local, git-ignored configuration files.
