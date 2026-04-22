/**
 * Global helpers (shared / reusable)
 * --------------------------------------------------------------------------
 */

const ua = navigator.userAgent || '';

/**
 * Detect Safari (not Chrome/Firefox/Opera/Edge on iOS).
 *
 * @returns {boolean}
 */
const isSafari = () =>
	/Safari/i.test(ua) &&
	!/Chrome|Chromium|CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);


/**
 * Detect iOS device.
 *
 * @returns {boolean}
 */
const isIOS = () => /iP(hone|od|ad)/.test(ua);

/**
 * Detect iOS Safari.
 *
 * @returns {boolean}
 */
const isIOSSafari = () => isIOS() && isSafari();

/**
 * Log a message either to console (default) or append to a target element.
 *
 * - If `target` is an HTMLElement, appends a line to it.
 * - Otherwise, logs to console.
 *
 * @param {string} message
 * @param {boolean|number|HTMLElement|null} target
 * @returns {void}
 */
function logMessage(message, target = null) {
	if (target && !String(target).match(/^(true|1)$/i) && target instanceof HTMLElement) {
		const line = document.createElement('div');
		line.textContent = message;
		target.appendChild(line);
	} else {
		console.log(message);
	}
}


/**
 * Replaces an <img> element pointing to an SVG with the inline <svg>.
 *
 * @param {string|HTMLElement} img
 * CSS selector for an <img> element, or the <img> element itself.
 *
 * @returns {Promise<SVGElement|null>}
 * The inserted inline SVG element, or null if replacement failed.
 */
async function replaceImgWithInlineSVG(img) {
	const el = typeof img === 'string' ? document.querySelector(img) : img;

	if (!el || !(el instanceof HTMLElement)) return null;

	const src = el.getAttribute('src');
	if (!src) return null;

	const res = await fetch(src);
	if (!res.ok) throw new Error(`Failed to load SVG: ${src}`);

	const svgText = await res.text();
	const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
	const svg = doc.querySelector('svg');
	if (!svg) throw new Error(`No <svg> found in: ${src}`);

	const inlineSvg = document.importNode(svg, true);

	// copy id + class from original <img>
	const id = el.getAttribute('id');
	if (id) inlineSvg.setAttribute('id', id);

	const cls = el.getAttribute('class');
	if (cls) inlineSvg.setAttribute('class', cls);

	el.replaceWith(inlineSvg);

	return inlineSvg;
}


/**
 * Replaces (or creates) the page favicon.
 *
 * @param {string} href Path/URL to the favicon image (e.g. "/assets/favicon.svg" or "/favicon.ico").
 * @param {object} [options]
 * @param {string} [options.rel="icon"] Link rel attribute ("icon", "shortcut icon", "apple-touch-icon", etc.).
 * @param {string} [options.type] Optional MIME type (e.g. "image/svg+xml", "image/png", "image/x-icon").
 * @returns {HTMLLinkElement} The favicon <link> element.
 */
/* 	function replaceFavicon(href, options = {}) {
		const { rel = 'icon', type } = options;

		let link = document.querySelector(`link[rel="${rel}"]`);

		if (!link) {
			link = document.createElement('link');
			link.setAttribute('rel', rel);
			document.head.appendChild(link);
		}

		link.setAttribute('href', href);

		if (type) {
			link.setAttribute('type', type);
		} else {
			link.removeAttribute('type');
		}

		return link;
	} */