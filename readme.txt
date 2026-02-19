README_OVERRIDES
================

Purpose
-------
This file documents where and how to wire custom override CSS/JS files into
the "versa" Drupal theme.

Use it when:
- adding new override files
- renaming existing override files
- renaming the override library itself


Theme Location
--------------
Theme root:

  httpdocs/web/themes/custom/versa

Key files:

  httpdocs/web/themes/custom/versa/versa.info.yml
  httpdocs/web/themes/custom/versa/versa.libraries.yml

Override assets:

  httpdocs/web/themes/custom/versa/css/plura-overrides.css
  httpdocs/web/themes/custom/versa/js/plura-overrides.js


1. Adding or Renaming the OVERRIDE FILES
----------------------------------------

Current override files:

  CSS: css/plura-overrides.css
  JS : js/plura-overrides.js

They are registered in `versa.libraries.yml` under a library key.

Example (library key may be "plura_overrides" or "safari_fixes"):

  plura_overrides:
    css:
      theme:
        css/plura-overrides.css: {}
    js:
      js/plura-overrides.js: {}

If you:

- RENAME plura-overrides.css → some-other-name.css
- RENAME plura-overrides.js → some-other-name.js

then you MUST update the paths under that library in:

  versa.libraries.yml

Example after rename:

  plura_overrides:
    css:
      theme:
        css/some-other-name.css: {}
    js:
      js/some-other-name.js: {}

Paths are always RELATIVE to the theme root.


2. Renaming the OVERRIDE LIBRARY
--------------------------------

The override library key is the name on the left in `versa.libraries.yml`, e.g.:

  plura_overrides:
    css:
      ...
    js:
      ...

This key is referenced in `versa.info.yml` under `libraries:`.

Example:

  libraries:
    - versa/global
    - versa/plura_overrides

If you change the library key in `versa.libraries.yml`, for example:

  safari_fixes:  →  plura_overrides:

you MUST also update `versa.info.yml` so the name after `versa/` matches.

Example change in `versa.info.yml`:

  libraries:
    - versa/global
    - versa/plura_overrides    ← must match the key in versa.libraries.yml

If there are any Twig templates that call:

  {{ attach_library('versa/OLD_NAME') }}

they must also be updated to:

  {{ attach_library('versa/NEW_NAME') }}


3. Adding NEW OVERRIDE FILES
----------------------------

To add more override CSS/JS files:

1) Place them in the theme, e.g.:

     css/plura-extra.css
     js/plura-extra.js

2) Register them under the same override library in `versa.libraries.yml`:

   plura_overrides:
     css:
       theme:
         css/plura-overrides.css: {}
         css/plura-extra.css: {}
     js:
       js/plura-overrides.js: {}
       js/plura-extra.js: {}

(Keep paths relative to the theme root.)

No change is needed in `versa.info.yml` as long as you keep using the same
library key (e.g. plura_overrides).


4. Making Drupal Pick Up Changes
--------------------------------

Whenever you:

- edit `versa.info.yml`
- edit `versa.libraries.yml`
- add/rename CSS or JS files

you MUST clear caches on the server:

  cd /var/www/vhosts/versa-plus.com/httpdocs
  vendor/bin/drush cr

Then hard-refresh the browser (Ctrl+Shift+R / Cmd+Shift+R).


5. Quick Checklist Before and After Changes
-------------------------------------------

Before:
- Confirm theme path: httpdocs/web/themes/custom/versa
- Decide whether you are:
  - only changing file names/paths, or
  - also renaming the library key.

During:
- Update paths in versa.libraries.yml.
- If library key name changes, update versa.info.yml (and any attach_library()).

After:
- Run: vendor/bin/drush cr
- Check in DevTools → Network that the expected CSS/JS files are loading.
- Test Safari-specific behaviour and layout.

END OF FILE
