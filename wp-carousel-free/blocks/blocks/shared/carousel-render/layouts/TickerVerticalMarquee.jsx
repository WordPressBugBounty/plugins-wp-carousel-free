/**
 * Vertical ticker: duplicated column + CSS animation, variable row heights.
 */

import {
	useRef,
	useState,
	useCallback,
	useMemo,
	useLayoutEffect,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import CarouselItem from '../CarouselItem';
import { gapToPx } from '../gapImageUtils';
import { tickerVerticalViewportPx } from './tickerVerticalViewportPx';

/**
 * @param {Object}   props
 * @param {object[]} props.items
 * @param {Object}   props.attributes
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {Object}   props.gapNum        `{ Desktop, Tablet, Mobile }` gap values.
 * @param {Object}   props.gapUnit       Gap units per breakpoint.
 * @param {Object}   props.columns       `{ Desktop, … }` column counts.
 * @param {number}   props.marqueeSpeed  Pixels per second (matches horizontal ticker scaling).
 * @param {string}   props.activeDevice  Active editor preview device.
 * @param {Object}   [props.socialIcons] Parent-owned social icon lookup.
 */
export default function TickerVerticalMarquee({
	items,
	attributes,
	isEditor,
	onItemEdit,
	gapNum,
	gapUnit,
	columns,
	marqueeSpeed,
	activeDevice = 'Desktop',
	socialIcons,
}) {
	const { sliderOptions = {}, layoutOptions = {} } = attributes;
	const pauseHover = sliderOptions.pauseOnHover !== false;
	const pauseFocus = sliderOptions.pauseOnFocus === true;
	const showPlayPause = sliderOptions.showPlayPause === true;
	const isRtl = sliderOptions.direction === 'rtl';
	const showGradient = layoutOptions.tickerGradient === true;
	const gradientWidth = Number(layoutOptions.tickerGradientWidth ?? 100);
	const gradientColor = layoutOptions.tickerGradientColor ?? '';

	const heightKeys = {
		Desktop: 'tickerVerticalHeight',
		Tablet: 'tickerVerticalHeightTablet',
		Mobile: 'tickerVerticalHeightMobile',
	};
	const unitKeys = {
		Desktop: 'tickerVerticalHeightUnit',
		Tablet: 'tickerVerticalHeightTabletUnit',
		Mobile: 'tickerVerticalHeightMobileUnit',
	};
	const deviceKey = heightKeys[activeDevice] ? activeDevice : 'Desktop';
	const userHeight = layoutOptions[heightKeys[deviceKey]] ?? layoutOptions.tickerVerticalHeight;
	const userHeightUnit =
		layoutOptions[unitKeys[deviceKey]] ?? layoutOptions.tickerVerticalHeightUnit ?? 'px';
	const hasUserHeight = Number(userHeight) > 0;

	const viewportRef = useRef(null);
	const stripARef = useRef(null);
	const [gapPx, setGapPx] = useState(0);
	const [stripHeightPx, setStripHeightPx] = useState(0);
	const [viewportPx, setViewportPx] = useState(
		hasUserHeight && userHeightUnit === 'px' ? Number(userHeight) : 280
	);
	const [durationSec, setDurationSec] = useState(12);
	const [paused, setPaused] = useState(false);
	// Strips per half of the track (see `TickerCarousel` / `fillTrackStrips`).
	const [halfCount, setHalfCount] = useState(1);

	// Row count and gap follow the previewed device — see `TickerCarousel`.
	const rowCount = columns?.[activeDevice] ?? columns?.Desktop ?? 3;
	const activeGapNum = gapNum[activeDevice] ?? gapNum.Desktop;
	const activeGapUnit = gapUnit[activeDevice] ?? gapUnit.Desktop;
	const itemsKey = useMemo(
		() => `${items.length}:${items.map((it, idx) => it.id ?? idx).join(',')}`,
		[items]
	);

	const remeasure = useCallback(() => {
		const vEl = viewportRef.current;
		const stripEl = stripARef.current;
		if (!vEl || !stripEl) {
			return;
		}
		const g = gapToPx(activeGapNum, activeGapUnit, vEl);
		const sh = Math.ceil(stripEl.scrollHeight);
		let vh;
		if (hasUserHeight && userHeightUnit === 'px') {
			vh = Number(userHeight);
		} else {
			vh = tickerVerticalViewportPx(stripEl, rowCount, g);
		}
		const stripStepPx = sh + Math.max(0, g);
		// Repeat the column until each half spans the viewport (seamless -50% loop).
		const half = Math.max(1, Math.ceil((vh || 0) / Math.max(1, stripStepPx)));
		const dur = sh > 0 && marqueeSpeed > 0 ? (half * stripStepPx) / marqueeSpeed : 12;

		setGapPx((prev) => (Math.abs(prev - g) < 0.5 ? prev : g));
		setStripHeightPx((prev) => (Math.abs(prev - sh) < 2 && prev > 0 ? prev : sh));
		setViewportPx((prev) => (Math.abs(prev - vh) < 2 && prev > 0 ? prev : vh));
		setHalfCount((prev) => (prev === half ? prev : half));
		setDurationSec((prev) => (Math.abs(prev - dur) < 0.02 && prev > 0 ? prev : dur));
	}, [
		activeGapNum,
		activeGapUnit,
		rowCount,
		marqueeSpeed,
		hasUserHeight,
		userHeight,
		userHeightUnit,
	]);

	useLayoutEffect(() => {
		const vEl = viewportRef.current;
		if (!vEl) {
			return;
		}
		const ro = new ResizeObserver(() => {
			requestAnimationFrame(remeasure);
		});
		ro.observe(vEl);
		const sEl = stripARef.current;
		if (sEl) {
			ro.observe(sEl);
		}
		return () => ro.disconnect();
	}, [remeasure, itemsKey]);

	useLayoutEffect(() => {
		requestAnimationFrame(remeasure);
	}, [remeasure, itemsKey]);

	useEffect(() => {
		const vEl = viewportRef.current;
		if (!vEl) {
			return;
		}
		const imgs = vEl.querySelectorAll('.wpcp-item-img');
		const arr = Array.from(imgs);
		let cancelled = false;

		const finish = () => {
			if (!cancelled) {
				requestAnimationFrame(remeasure);
			}
		};

		if (arr.length === 0) {
			finish();
			return () => {
				cancelled = true;
			};
		}

		const allLoaded = () => arr.every((img) => img.complete && img.naturalHeight !== 0);

		if (allLoaded()) {
			finish();
		} else {
			const start = Date.now();
			const poll = () => {
				if (cancelled) {
					return;
				}
				if (allLoaded() || Date.now() - start > 4000) {
					finish();
				} else {
					requestAnimationFrame(poll);
				}
			};
			poll();
		}

		return () => {
			cancelled = true;
		};
	}, [itemsKey, remeasure]);

	// Strip 0 is the real, announced column; strips 1+ are decorative fill for the
	// seamless loop — hidden from assistive tech, removed from tab order, and kept
	// out of the lightbox gallery so their clones do not duplicate its slides.
	const renderStrip = (idx) => (
		<div
			key={`strip-${idx}`}
			ref={idx === 0 ? stripARef : undefined}
			className="wpcp-ticker-vertical__strip"
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: gapPx > 0 ? `${gapPx}px` : undefined,
				width: '100%',
			}}
			{...(idx === 0 ? {} : { 'aria-hidden': 'true', inert: 'true', 'data-lightbox-ignore': 'true' })}
		>
			{items.map((item, i) => (
				<div
					key={`${idx}-${item.id ?? i}`}
					className="wpcp-item wpcp-ticker-item wpcp-ticker-vertical__cell"
					style={{ width: '100%', flexShrink: 0 }}
				>
					<CarouselItem
						item={item}
						attributes={attributes}
						itemIndex={i}
						isEditor={isEditor}
						onItemEdit={onItemEdit}
						socialIcons={socialIcons}
					/>
				</div>
			))}
		</div>
	);

	if (!items.length) {
		return (
			<div
				ref={viewportRef}
				className="wpcp-ticker-vertical"
				style={{
					minHeight: hasUserHeight ? undefined : 120,
					...(hasUserHeight && { height: `${userHeight}${userHeightUnit}` }),
				}}
			/>
		);
	}

	return (
		<div
			ref={viewportRef}
			className={classNames(
				'wpcp-ticker-vertical',
				pauseHover && 'wpcp-ticker-vertical--pause-hover',
				pauseFocus && 'wpcp-ticker-vertical--pause-focus',
				showGradient && 'wpcp-ticker-vertical--gradient',
				isRtl && 'wpcp-ticker-vertical--rtl',
				paused && 'wpcp-ticker-paused'
			)}
			style={{
				height: hasUserHeight ? `${userHeight}${userHeightUnit}` : `${viewportPx}px`,
				'--wpcp-ticker-vertical-duration': `${durationSec}s`,
				'--wpcp-ticker-vertical-track-gap': gapPx > 0 ? `${gapPx}px` : '0px',
				'--wpcp-ticker-vertical-half-gap': gapPx > 0 ? `${gapPx / 2}px` : '0px',
				'--wpcp-ticker-gradient-width': `${gradientWidth}px`,
				...(gradientColor ? { '--wpcp-ticker-gradient-color': gradientColor } : {}),
			}}
			role="region"
			aria-label={__('Scrolling content', 'wp-carousel-free')}
		>
			{showPlayPause && (
				<button
					type="button"
					className="wpcp-ticker-playpause"
					aria-pressed={paused ? 'true' : 'false'}
					aria-label={paused ? __('Play', 'wp-carousel-free') : __('Pause', 'wp-carousel-free')}
					onClick={() => setPaused((prev) => !prev)}
				>
					<svg
						className="wpcp-ticker-playpause__pause"
						viewBox="0 0 24 24"
						aria-hidden="true"
						focusable="false"
					>
						<rect x="6" y="5" width="4" height="14" />
						<rect x="14" y="5" width="4" height="14" />
					</svg>
					<svg
						className="wpcp-ticker-playpause__play"
						viewBox="0 0 24 24"
						aria-hidden="true"
						focusable="false"
					>
						<path d="M8 5v14l11-7z" />
					</svg>
				</button>
			)}
			<div
				key={`vt-${Math.round(stripHeightPx)}-${durationSec.toFixed(2)}-${halfCount}-${itemsKey}`}
				className="wpcp-ticker-vertical__track"
			>
				{Array.from({ length: halfCount * 2 }, (_, idx) => renderStrip(idx))}
			</div>
		</div>
	);
}
