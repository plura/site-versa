
	//--------------------------------------------------------------
	// Selectors (site-specific)
	//--------------------------------------------------------------
	const GRID_VIDEOS_SELECTOR = '.project-card .project-card-video > video';
	const HERO_VIDEOS_SELECTOR = 'article.single-project > :is(.project-hero, .project-video-player--mobile) video';


const GRID_VIDEOS = () => document.querySelectorAll(GRID_VIDEOS_SELECTOR);
const HERO_VIDEOS = () => document.querySelectorAll(HERO_VIDEOS_SELECTOR);

//--------------------------------------------------------------
// HTML classes
//--------------------------------------------------------------
// Added in every browser despite the name: the gallery rules in fix.css,
// layout.css and masonry.css depend on it, so gating it to Safari would
// drop them elsewhere.
document.documentElement.classList.add('is-safari');

// Add a class to <html> so plura-overrides.css can target iOS Safari only
if (isIOSSafari()) {
	document.documentElement.classList.add('is-ios-safari');
}


//--------------------------------------------------------------
// Initialisation
//--------------------------------------------------------------
function init() {

	const grid_videos = GRID_VIDEOS(), hero_videos = HERO_VIDEOS();

	if (grid_videos.length > 0) {
		// Fix grid videos
		restartAutoplayVideos(grid_videos);
	}

	hero_videos.forEach(hero_video => {

		if (!isIOS()) {
			setupClickToPlayVideo(hero_video);
		} else {

			if (hero_video) {
				setVideoPosterFromFrame({
					video: hero_video,
					time: 0.5
				}).catch(() => {}); // no poster on failure
			}
		}

	});

	// Inline the logo so layout.css can style its paths (blend mode, white fill)
	replaceImgWithInlineSVG('header img[src*="logo.svg"]').catch(() => {}); // keeps the <img> on failure

	const grid = document.querySelector(".project-gallery .gallery");
	if (grid) initMasonry(grid);

}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}


//--------------------------------------------------------------
// Back/forward cache restore (Safari)
//--------------------------------------------------------------
// pageshow also fires on normal loads, so this retries autoplay once the
// page has fully loaded too.
window.addEventListener('pageshow', (event) => {

	const grid_videos = GRID_VIDEOS();

	if (grid_videos.length > 0) {
		restartAutoplayVideos(grid_videos);
		setTimeout(() => restartAutoplayVideos(GRID_VIDEOS()), 50);
	}

});
