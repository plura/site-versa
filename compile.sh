#!/bin/sh
# Builds overrides/plura-overrides.{css,js} from assets/ (run: sh compile.sh).
# Always overwrites the outputs; file order below is significant.
set -e
cd "$(dirname "$0")"

bar='/* ==================================================================='
end=' * =================================================================== */'

# Header comment + file contents, adding a trailing newline if missing so files don't run together.
section() { printf '\n%s\n * %s\n%s\n' "$bar" "$1" "$end"; cat "$2"; tail -c1 "$2" | grep -q . && echo; true; }

{
	printf '%s\n * PLURA OVERRIDES — COMPILED CSS\n * Combined from assets/css/ directory\n%s\n' "$bar" "$end"
	for f in base fix layout masonry; do section "$(echo $f | tr a-z A-Z).CSS" assets/css/$f.css; done
} > overrides/plura-overrides.css

# Single IIFE keeps helpers out of the global scope; init.js must run last.
{
	printf '(function () {\n\n%s\n * PLURA OVERRIDES — COMPILED JAVASCRIPT\n * Combined from assets/js/ directory\n%s\n' "$bar" "$end"
	for f in global masonry video; do section "$(echo $f | tr a-z A-Z).JS" assets/js/$f.js; done
	section "INIT.JS (Runs Last)" assets/js/init.js
	printf '\n})();\n'
} > overrides/plura-overrides.js

echo "Built overrides/plura-overrides.css and overrides/plura-overrides.js"
