function setVideoPosterFromFrame({ video, time = 0, log = false }) {
	//const logTarget = resolveLogTarget(log);

	if (!(video instanceof HTMLVideoElement)) {
		log && logMessage('setVideoPosterFromFrame: provided video is not a HTMLVideoElement', log);
		return Promise.resolve(undefined);
	}

	const targetTime = time;

	// On iOS Safari, first try muted autoplay to force actual frame decoding.
	if (isIOSSafari()) {
		log && logMessage('setVideoPosterFromFrame: detected iOS Safari, running mutedAutoplay first', log);

		return mutedAutoplay(video, targetTime, log).then(function () {
			// After mutedAutoplay, we have some currentTime and decoded frames.
			// Use the currentTime (or targetTime if you prefer) for the poster capture.
			const effectiveTime = video.currentTime || targetTime;
			return coreSetPoster(video, effectiveTime, log);
		});
	}

	// Non-iOS Safari: go straight to the normal logic.
	return coreSetPoster(video, targetTime, log);
}

/**
 * Core logic for capturing and applying the poster.
 * Separated so we can reuse it after mutedAutoplay on iOS.
 */
function coreSetPoster(video, time, log) {
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

				seekVideo(video, time, log)
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

function seekVideo(video, time, log = false/* , logTarget = null */) {
	return new Promise(function (resolve, reject) {
		log && logMessage('seekVideo: starting seek to ' + time, log);
		log && logMessage(
			'seekVideo: before set currentTime, readyState=' + video.readyState + ', currentTime=' + video.currentTime,
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
			log && logMessage('seekVideo: seeked event fired (currentTime=' + video.currentTime + ')', log);
			resolve();
		};

		const onError = function () {
			clearAll();
			log && logMessage('seekVideo: error event fired', log);
			reject(new Error('Error seeking video'));
		};

		timeoutId = setTimeout(function () {
			log && logMessage(
				'seekVideo: timeout waiting for seeked, continuing anyway (currentTime=' +
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
			log && logMessage('seekVideo: after set currentTime, currentTime=' + video.currentTime, log);
		} catch (e) {
			clearAll();
			log && logMessage('seekVideo: exception while setting currentTime: ' + e, log);
			reject(e);
		}
	});
}

/**
 * Try muted autoplay to force iOS Safari to actually decode frames.
 * Resolves when either:
 *  - currentTime >= targetTime, or
 *  - a timeout fires, or
 *  - play() fails (we just resolve and let the caller decide).
 */
function mutedAutoplay(target, targetTime, log) {
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

function isIOSSafari() { return true;
/* 	const ua = navigator.userAgent || '';
	const isIOS = /iP(hone|od|ad)/.test(ua);
	const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
	return isIOS && isSafari; */
}

function logMessage(message, target = null) {

	if (target && !String(target).match(/^(true|1)$/i) && target instanceof HTMLElement) {
		const line = document.createElement('div');
		line.textContent = message;
		target.appendChild(line);
	} else {
		console.log(message);
	}

}

/* function resolveLogTarget(log) {
	if (log && !String(log).match(/^(true|1)$/i) && log instanceof HTMLElement) {
		return log;
	}
	return null;
} */

window.setVideoPosterFromFrame = setVideoPosterFromFrame;
