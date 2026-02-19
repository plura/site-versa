/**
 * Safari-specific fixes for:
 *
 * 1) Grid videos not autoplaying after returning via back-navigation (bfcache)
 * 2) Hero video logic (kept as-is for now; further work later)
 *
 * Grid Fix Summary:
 * - Safari/iOS requires autoplay + muted + playsinline attributes
 * - When the page is restored from bfcache, autoplay state is often lost
 * - Solution: on load + on pageshow, forcibly reapply attributes & call play()
 *
 * NOTE: Only Safari (macOS + iOS). Chrome/Firefox/etc remain untouched.
 */

(function () {

	//--------------------------------------------------------------
	// 0. Detect Safari (desktop & iOS), exclude Chrome/Android/etc
	//--------------------------------------------------------------
	const ua = navigator.userAgent;
	const isSafari = true;///^((?!chrome|chromium|android|crios|fxios).)*safari/i.test(ua);

	// Extra: specifically detect iOS Safari for CSS hooks
	const isIOSSafari =
		/iP(hone|od|ad)/.test(ua) && // iPhone/iPad/iPod
		/Safari/i.test(ua);          // Safari UA token present

	if (!isSafari) {
		console.log('[Plura • SafariFix] Not Safari — skipping');
		return;
	} else {
		document.documentElement.classList.add('is-safari');
	}

	// Add a class to <html> so safari-fix.css can target iOS Safari only
	if (isIOSSafari) {
		document.documentElement.classList.add('is-ios-safari');
		console.log('[Plura • SafariFix] is-ios-safari class added to <html>');
	}

	console.log('[Plura • SafariFix] Safari detected — enabling fixes');


	//--------------------------------------------------------------
	// 1. SELECTORS (your updated ones)
	//--------------------------------------------------------------
	const GRID_VIDEO_SELECTOR = '.project-card .project-card-video > video';
	const HERO_VIDEO_SELECTOR = '.project-hero > .project-hero-video > video';


	//--------------------------------------------------------------
	// 2. Strong autoplay fix for grid videos
	//--------------------------------------------------------------
	function restartAutoplayVideos() {
		const videos = document.querySelectorAll(GRID_VIDEO_SELECTOR);

		console.log('[Plura • SafariFix] Forcing autoplay on grid videos:', videos.length);

		videos.forEach(video => {

			// Ensure Safari requires for autoplay
			video.muted = true;
			video.autoplay = true;
			video.playsInline = true;
			video.loop = true;
			video.controls = false;

			// Also add HTML attributes (Safari cares)
			video.setAttribute('muted', '');
			video.setAttribute('autoplay', '');
			video.setAttribute('playsinline', '');
			video.setAttribute('loop', '');

			// Kick playback unconditionally
			video.play().catch(() => {
				// Safari will sometimes reject play() silently; safe to ignore
			});
		});
	}


	//--------------------------------------------------------------
	// 3. Hero video logic – band-aid to keep it playing
	//--------------------------------------------------------------
	function setupHeroVideoAutoplay() {
		const heroVideo = document.querySelector(HERO_VIDEO_SELECTOR);
		if (!heroVideo) return;

		console.log('[Plura • SafariFix] Initialising hero video autoplay…');

		// Ensure hero video has the right properties/attributes for autoplay
		function ensureHeroVideoProps() {
			heroVideo.muted = true;
			heroVideo.autoplay = true;
			heroVideo.playsInline = true;
			heroVideo.loop = true;
			heroVideo.controls = false;

			heroVideo.setAttribute('muted', '');
			heroVideo.setAttribute('autoplay', '');
			heroVideo.setAttribute('playsinline', '');
			heroVideo.setAttribute('loop', '');
		}

		function tryPlayHero() {
			ensureHeroVideoProps();
			heroVideo.play().catch(() => {
				// Ignore autoplay errors – other scripts / browser may block
			});
		}

		// Play once on load
		tryPlayHero();

		// Prefer IntersectionObserver: only ever PLAY when visible,
		// never pause here (band-aid: prevent it from "sticking" paused).
		if ('IntersectionObserver' in window) {
			const observer = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						console.log('[Plura • SafariFix] Hero in view → play()');
						tryPlayHero();
					}
				});
			}, {
				threshold: 0.0 // trigger as soon as any part is visible
			});

			observer.observe(heroVideo);
		} else {
			// Fallback: on scroll, if we are near the top, try to play again
			function getScrollTop() {
				return window.scrollY ||
					window.pageYOffset ||
					document.documentElement.scrollTop ||
					document.body.scrollTop ||
					0;
			}

			window.addEventListener('scroll', () => {
				const scrollTop = getScrollTop();
				// Heuristic: when user scrolls back near the top, play hero
				if (scrollTop < heroVideo.clientHeight * 1.5) {
					console.log('[Plura • SafariFix] Scroll near top → play hero');
					tryPlayHero();
				}
			}, { passive: true });
		}

		// When tab/window becomes visible again, try to resume hero playback
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) {
				console.log('[Plura • SafariFix] Page visible → ensure hero playing');
				tryPlayHero();
			}
		});
	}


	//--------------------------------------------------------------
	// 4. INIT
	//--------------------------------------------------------------
	function init() {
		console.log('[Plura • SafariFix] Initialising video fixes…');

		restartAutoplayVideos();     // grid fix
		setupHeroVideoAutoplay();    // leave unchanged for now
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}


	//--------------------------------------------------------------
	// 5. bfcache restore (critical for Safari)
	//--------------------------------------------------------------
	window.addEventListener('pageshow', (event) => {
		console.log('[Plura • SafariFix] pageshow → re-running grid autoplay fix');

		// Replay immediately
		restartAutoplayVideos();

		// Optional: iOS sometimes needs a small delay
		setTimeout(restartAutoplayVideos, 50);
	});

})();
