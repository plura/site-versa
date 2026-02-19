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
	// Selectors (site-specific)
	//--------------------------------------------------------------
	const GRID_VIDEOS_SELECTOR = '.project-card .project-card-video > video';
	const HERO_VIDEOS_SELECTOR = 'article.single-project > :is(.project-hero, .project-video-player--mobile) video';



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
	 * Video poster helpers (feature-specific)
	 * --------------------------------------------------------------------------
	 */

	/**
	 * Main API: capture a frame from a video and set it as the poster attribute.
	 * On iOS Safari, tries muted autoplay first to force frame decoding.
	 *
	 * @param {{ video: HTMLVideoElement, time?: number, log?: boolean|number|HTMLElement }} params
	 * @returns {Promise<string|undefined>}
	 */
	function setVideoPosterFromFrame({ video, time = 0, log = false }) {
		if (!(video instanceof HTMLVideoElement)) {
			log && logMessage('setVideoPosterFromFrame: provided video is not a HTMLVideoElement', log);
			return Promise.resolve(undefined);
		}

		const targetTime = time;

		if (isIOSSafari()) {
			log && logMessage('setVideoPosterFromFrame: detected iOS Safari, running videoMutedAutoplay first', log);

			return videoMutedAutoplay(video, targetTime, log).then(function () {
				const effectiveTime = video.currentTime || targetTime;
				return videoPosterCoreSet(video, effectiveTime, log);
			});
		}

		return videoPosterCoreSet(video, targetTime, log);
	}

	/**
	 * Core logic for capturing and applying the poster.
	 *
	 * @param {HTMLVideoElement} video
	 * @param {number} time
	 * @param {boolean|number|HTMLElement} log
	 * @returns {Promise<string|undefined>}
	 */
	function videoPosterCoreSet(video, time, log) {
		function captureFrame() {
			if (!video.videoWidth || !video.videoHeight) {
				log && logMessage('setVideoPosterFromFrame: no valid video dimensions', log);
				return undefined;
			}

			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				log && logMessage('setVideoPosterFromFrame: could not get 2D context', log);
				return undefined;
			}

			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
			video.poster = dataUrl;

			log && logMessage('setVideoPosterFromFrame: poster captured and applied', log);
			return dataUrl;
		}

		return new Promise(function (resolve) {
			function onReady() {
				log && logMessage('setVideoPosterFromFrame: video ready, time=' + time, log);

				if (typeof time === 'number' && Math.abs(video.currentTime - time) > 0.05) {
					log && logMessage('setVideoPosterFromFrame: seeking to time ' + time, log);

					videoSeekTo(video, time, log)
						.then(function () {
							resolve(captureFrame());
						})
						.catch(function (err) {
							log && logMessage('setVideoPosterFromFrame: seek error: ' + err, log);
							resolve(undefined);
						});
				} else {
					resolve(captureFrame());
				}
			}

			if (
				video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
				video.videoWidth &&
				video.videoHeight
			) {
				log && logMessage(
					'setVideoPosterFromFrame: video already has data (readyState=' + video.readyState + ')',
					log
				);
				onReady();
				return;
			}

			log && logMessage('setVideoPosterFromFrame: waiting for loadeddata/loadedmetadata', log);

			const onLoaded = function (evt) {
				video.removeEventListener('loadeddata', onLoaded);
				video.removeEventListener('loadedmetadata', onLoaded);

				log && logMessage('setVideoPosterFromFrame: ' + evt.type + ' fired', log);
				onReady();
			};

			video.addEventListener('loadeddata', onLoaded, { once: true });
			video.addEventListener('loadedmetadata', onLoaded, { once: true });
		});
	}

	/**
	 * Seek a video to a given time. Includes a timeout to avoid hanging.
	 *
	 * @param {HTMLVideoElement} video
	 * @param {number} time
	 * @param {boolean|number|HTMLElement} log
	 * @returns {Promise<void>}
	 */
	function videoSeekTo(video, time, log = false) {
		return new Promise(function (resolve, reject) {
			log && logMessage('videoSeekTo: starting seek to ' + time, log);
			log && logMessage(
				'videoSeekTo: before set currentTime, readyState=' + video.readyState + ', currentTime=' + video.currentTime,
				log
			);

			let timeoutId = null;

			function clearAll() {
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = null;
				}
				video.removeEventListener('seeked', onSeeked);
				video.removeEventListener('error', onError);
			}

			const onSeeked = function () {
				clearAll();
				log && logMessage('videoSeekTo: seeked event fired (currentTime=' + video.currentTime + ')', log);
				resolve();
			};

			const onError = function () {
				clearAll();
				log && logMessage('videoSeekTo: error event fired', log);
				reject(new Error('Error seeking video'));
			};

			timeoutId = setTimeout(function () {
				log && logMessage(
					'videoSeekTo: timeout waiting for seeked, continuing anyway (currentTime=' +
					video.currentTime +
					', readyState=' +
					video.readyState +
					')',
					log
				);
				clearAll();
				resolve();
			}, 2000);

			video.addEventListener('seeked', onSeeked, { once: true });
			video.addEventListener('error', onError, { once: true });

			try {
				video.currentTime = time;
				log && logMessage('videoSeekTo: after set currentTime, currentTime=' + video.currentTime, log);
			} catch (e) {
				clearAll();
				log && logMessage('videoSeekTo: exception while setting currentTime: ' + e, log);
				reject(e);
			}
		});
	}

	/**
	 * Try muted autoplay to force iOS Safari to decode frames.
	 * Resolves when currentTime reaches targetTime or after a timeout.
	 *
	 * @param {HTMLVideoElement} target
	 * @param {number} targetTime
	 * @param {boolean|number|HTMLElement} log
	 * @returns {Promise<void>}
	 */
	function videoMutedAutoplay(target, targetTime, log) {
		return new Promise(function (resolve) {
			if (!target) {
				resolve();
				return;
			}

			target.muted = true;

			const playPromise = target.play();

			if (!playPromise || typeof playPromise.then !== 'function') {
				log && logMessage('autoplay: target.play() did not return a promise', log);
				resolve();
				return;
			}

			playPromise.then(function () {
				log && logMessage('autoplay: target.play() resolved', log);

				let timeoutId = null;

				function cleanup() {
					if (timeoutId) {
						clearTimeout(timeoutId);
						timeoutId = null;
					}
					target.removeEventListener('timeupdate', onTimeUpdate);
				}

				function onTimeUpdate() {
					if (target.currentTime >= targetTime) {
						cleanup();
						log && logMessage(
							'autoplay: currentTime >= ' + targetTime + ', pausing before capture',
							log
						);
						target.pause();
						resolve();
					}
				}

				target.addEventListener('timeupdate', onTimeUpdate);

				timeoutId = setTimeout(function () {
					cleanup();
					log && logMessage(
						'autoplay: timeout before reaching ' +
						targetTime +
						's, pausing at ' +
						target.currentTime,
						log
					);
					target.pause();
					resolve();
				}, 3000);
			}).catch(function (err) {
				log && logMessage('autoplay: target.play() rejected: ' + err, log);
				resolve();
			});
		});
	}


	/**
	 * Force/restore autoplay for Works grid videos on Safari (macOS/iOS).
	 *
	 * Why:
	 * - Safari (especially after bfcache restore) often loses autoplay state.
	 * - iOS Safari requires autoplay + muted + playsinline to be enforced to
	 *   allow inline playback without user interaction.
	 *
	 * What it does:
	 * - Accepts a list of <video> elements (typically from GRID_VIDEOS()).
	 * - Enforces Safari-friendly properties/attributes on each one.
	 * - Calls play() unconditionally (rejections are ignored).
	 *
	 * @param {NodeListOf<HTMLVideoElement>|HTMLVideoElement[]|null|undefined} videos
	 * @returns {void}
	 */
	function restartAutoplayVideos(videos) {

		if (!videos || !videos.length) return;

		console.log('[Plura • SafariFix] Forcing autoplay on grid videos:', videos.length);

		videos.forEach(video => {

			setVideoProps(video);

			/* // Ensure Safari requires for autoplay
			video.muted = true;
			video.autoplay = true;
			video.playsInline = true;
			video.loop = true;
			video.controls = false;

			// Also add HTML attributes (Safari cares)
			video.setAttribute('muted', '');
			video.setAttribute('autoplay', '');
			video.setAttribute('playsinline', '');
			video.setAttribute('loop', ''); */

			// Kick playback unconditionally
			video.play().catch(() => {
				// Safari will sometimes reject play() silently; safe to ignore
			});
		});
	}



	// Ensure hero video has the right properties/attributes for autoplay
	function setVideoProps(video, { muted = true, autoplay = true, playsInline = true, loop = true, controls = false } = {}) {
		video.muted = muted;
		video.autoplay = autoplay;
		video.playsInline = playsInline;
		video.loop = loop;
		video.controls = controls;
		console.log('[Plura • SafariFix] Setting hero video props:', { muted, autoplay, playsInline, loop, controls });
		Object.entries({ muted, autoplay, playsinline: playsInline, loop, controls }).forEach(([key, value]) => {
			if (value) {
				video.setAttribute(key, '');
			} else {
				video.removeAttribute(key);
			}
		});
	}


	/**
	 * Keep the hero banner video playing on desktop/laptop Safari (non-iOS).
	 *
	 * Problem:
	 * - On Safari, the hero video may autoplay on entry, but get paused during
	 *   scroll/visibility changes (often due to theme JS or Safari quirks) and
	 *   fail to resume when the user scrolls back up.
	 *
	 * Approach (band-aid override):
	 * - Never pauses the hero video.
	 * - Re-applies autoplay-safe properties/attributes before each play() attempt.
	 * - Triggers play():
	 *   - immediately on init
	 *   - when the hero becomes visible (IntersectionObserver)
	 *   - when scrolling back near the top (fallback)
	 *   - when the tab becomes visible again (visibilitychange)
	 *
	 * Note:
	 * - Intended for non-iOS Safari only. On iOS Safari, we use the poster-capture
	 *   strategy (setVideoPosterFromFrame) instead of forcing autoplay.
	 *
	 * @param {HTMLVideoElement|null|undefined} video The hero <video> element (typically from HERO_VIDEO()).
	 * @returns {void}
	 */
	function setupHeroVideoAutoplay(video) {

		if (!video) return;

		console.log('[Plura • SafariFix] Initialising hero video autoplay…');

		function tryPlayHero() {
			setVideoProps(video); // unmute for hero
			video.play().catch(() => {
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

			observer.observe(video);
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
				if (scrollTop < video.clientHeight * 1.5) {
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


	/**
	 * Toggle play/pause by clicking the video.
	 *
	 * @param {HTMLVideoElement} video
	 * @returns {void}
	 */
	function setVideoToggleOnPlayPause(video) {
		if (!(video instanceof HTMLVideoElement)) return;

		// Avoid duplicates
		if (video.dataset.pluraOverridesTogglePlayPauseInit === '1') return;
		video.dataset.pluraOverridesTogglePlayPauseInit = '1';

		video.addEventListener('click', function (e) {
			e.preventDefault();

			if (video.paused) {
				const p = video.play();

				if (!p || typeof p.then !== 'function') {
					video.classList.add('is-playing');
					return;
				}

				p.then(function () {
					video.classList.add('is-playing');
				}).catch(function () {
					// keep state if play fails
				});

				return;
			}

			try { video.pause(); } catch (e) { }
			video.classList.remove('is-playing');

		}, { passive: false });
	}


	/**
	 * Simple click-to-play overlay for non-iOS videos.
	 *
	 * @param {HTMLVideoElement} video
	 * @param {{ volume?: number, toggle?: boolean }} opts
	 * @returns {void}
	 */
	function setupClickToPlayVideo(video, { volume = 0.4, toggle = true } = {}) {
		if (!(video instanceof HTMLVideoElement)) return;

		try { video.pause(); } catch (e) { }
		try { video.currentTime = 0; } catch (e) { }

		video.muted = false;

		// Clamp to 0.0–1.0
		const v = Math.max(0, Math.min(1, Number(volume)));
		if (!Number.isNaN(v)) video.volume = v;

		// Avoid duplicates
		if (video.parentElement && video.parentElement.querySelector('.plura-overrides-video-overlay-play')) {
			return;
		}

		const overlay = document.createElement('button');
		overlay.type = 'button';
		overlay.className = 'plura-overrides-video-overlay-play';

		video.insertAdjacentElement('afterend', overlay);

		const init = function () {
			video.classList.add('is-playing');
			overlay.remove();

			if (toggle) {
				setVideoToggleOnPlayPause(video);
			}
		};

		overlay.addEventListener('click', function (e) {
			e.preventDefault();

			const p = video.play();

			if (!p || typeof p.then !== 'function') {
				init();
				return;
			}

			p.then(function () {
				init();
			}).catch(function () {
				// keep overlay if play fails
			});
		}, { passive: false, once: true });
	}






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

})();
