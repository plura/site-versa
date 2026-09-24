/**
 * Lay out the project gallery with Masonry (imagesLoaded + Masonry from unpkg).
 * Falls back to the CSS column layout in fix.css if either fails to load.
 *
 * @param {HTMLElement|null} grid The `.gallery` element.
 * @returns {void}
 */
function initMasonry(grid) {
	if (!grid) return;

	// prevent column layout from applying
	grid.classList.add("has-masonry");

	/**
	 * Append a script tag and settle when it loads or fails.
	 *
	 * @param {string} src
	 * @returns {Promise<Event>}
	 */
	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const s = document.createElement("script");
			s.src = src;
			s.async = true;
			s.onload = resolve;
			s.onerror = reject;
			document.head.appendChild(s);
		});
	}

	Promise.all([
		loadScript("https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"),
		loadScript("https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js")
	])
	.then(() => {
		imagesLoaded(grid, function () {
			new Masonry(grid, {
				itemSelector: ".gallery__item",
				columnWidth: ".gallery__item",
				percentPosition: true,
				gutter: 32
			});
		});
	})
	.catch((err) => {
		console.error("Masonry failed:", err);
		// fall back to the CSS column layout
		grid.classList.remove("has-masonry");
	});
}
