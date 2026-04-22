
	//--------------------------------------------------------------
	// Selectors (site-specific)
	//--------------------------------------------------------------
	const GRID_VIDEOS_SELECTOR = '.project-card .project-card-video > video';
	const HERO_VIDEOS_SELECTOR = 'article.single-project > :is(.project-hero, .project-video-player--mobile) video';


const GRID_VIDEOS = () => document.querySelectorAll(GRID_VIDEOS_SELECTOR);
const HERO_VIDEOS = () => document.querySelectorAll(HERO_VIDEOS_SELECTOR);

//--------------------------------------------------------------
// Safari gating + HTML classes
//--------------------------------------------------------------
/* if (!isSafari()) {
	console.log('[Plura • SafariFix] Not Safari — skipping');
	return;
} else { */
document.documentElement.classList.add('is-safari');
/* } */

// Add a class to <html> so plura-overrides.css can target iOS Safari only
if (isIOSSafari()) {
	document.documentElement.classList.add('is-ios-safari');
	console.log('[Plura • SafariFix] is-ios-safari class added to <html>');
}

console.log('[Plura • SafariFix] Safari detected — enabling fixes');


//--------------------------------------------------------------
// Initialisation
//--------------------------------------------------------------
function init() {

	console.log('[Plura • SafariFix] Initialising video fixes…');

	const grid_videos = GRID_VIDEOS(), hero_videos = HERO_VIDEOS();

	if (grid_videos.length > 0) {
		// Fix grid videos
		restartAutoplayVideos(grid_videos);
	}

	hero_videos.forEach(hero_video => {

		if (!isIOS()) {
			console.log('NOT iOS Safari');
			setupClickToPlayVideo(hero_video);
			//setupHeroVideoAutoplay(hero_video); // desktop/laptop Safari
		} else {

			if (hero_video) {
				setVideoPosterFromFrame({
					video: hero_video,
					time: 0.5,
					log: true
				});
			}
		}

	});

	//replace logo with inline SVG for better control
	replaceImgWithInlineSVG('header img[src*="logo.svg"]');

	console.log(document.querySelectorAll('header img[src*="logo.svg"]'));

	// usage
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
window.addEventListener('pageshow', (event) => {

	const grid_videos = GRID_VIDEOS();

	if (grid_videos.length > 0) {
		console.log('[Plura • SafariFix] pageshow → re-running grid autoplay fix');

		restartAutoplayVideos(grid_videos);
		setTimeout(() => restartAutoplayVideos(GRID_VIDEOS()), 50);
	}

});


//replace favicon
/* 	replaceFavicon('/themes/custom/versa/logo-plus.svg', {
		type: 'image/svg+xml'
	}); */
