/**
 * Ticker layout — horizontal CSS-keyframe duplicated-strip marquee (parity with
 * the frontend `TickerRenderer::render_ticker_horizontal`); vertical delegates to
 * `TickerVerticalMarquee`.
 *
 * The horizontal engine was unified onto the same CSS-keyframe duplicated-strip
 * model the front end and the vertical editor already use. It previously rendered
 * through `react-fast-marquee`, whose DOM/classes diverged from the frontend — a
 * standing editor↔frontend parity violation. It now emits
 * `wpcp-ticker-horizontal > __track > __strip × 2`, tags each item
 * `--fixed`/`--variable`, and drives `--wpcp-ticker-horizontal-duration` from the
 * measured strip width ÷ scroll speed exactly as `ticker.js` does on the front end,
 * so identical item counts yield identical scroll velocity.
 *
 * Control wiring (Marquee Layout panel): scroll speed → `sliderOptions.tickerSpeed`
 * (duration), direction → `--rtl` class, pause-on-hover → `--pause-hover` class.
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
import { resolveContentOrientation } from '../../inspector/fragments/contentOrientations';
import { ORIENTATION_CLASSES } from '../constants';
import { LAYOUT_RANGES } from '../../inspector/constants';
import { gapToPx, gapCssValue } from '../gapImageUtils';
import TickerVerticalMarquee from './TickerVerticalMarquee';

/**
 * @param {Object}   props
 * @param {object[]} props.items
 * @param {Object}   props.attributes
 * @param {boolean}  props.isEditor
 * @param {Function} [props.onItemEdit]
 * @param {Object}   props.gapNum
 * @param {Object}   props.gapUnit
 * @param {Object}   props.columns
 * @param {boolean}  props.isVertical     Ticker + vertical display style.
 * @param {string}   props.activeDevice   Active editor preview device.
 * @param {Object}   [props.socialIcons]  Parent-owned social icon lookup.
 * @param {Object}   [props.containerRef] Preview root the editor lightbox opener binds to.
 */
export default function TickerCarousel({
	items,
	attributes,
	isEditor,
	onItemEdit,
	gapNum,
	gapUnit,
	columns,
	isVertical,
	activeDevice = 'Desktop',
	socialIcons,
	containerRef,
}) {
	const { sliderOptions = {}, layoutOptions = {}, sourceType = 'image' } = attributes;

	const pauseHover = sliderOptions.pauseOnHover !== false;
	const pauseFocus = sliderOptions.pauseOnFocus === true;
	const showPlayPause = sliderOptions.showPlayPause === true;
	const isRtl = sliderOptions.direction === 'rtl';
	const contentOrientation = resolveContentOrientation(
		sourceType,
		layoutOptions.contentOrientation,
		{ blockName: attributes?.blockName }
	);
	const orientationClass = ORIENTATION_CLASSES[contentOrientation] || '';

	// Falls back to the control's own default, never to `sliderOptions.speed` —
	// that is Swiper's slide-transition duration (500ms) and using it here made an
	// unconfigured marquee scroll ten times too fast.
	const { min: speedMin, max: speedMax, default: speedDefault } = LAYOUT_RANGES.tickerSpeed;
	const rawTickerSpeed = Number(sliderOptions.tickerSpeed ?? speedDefault);
	const tickerSpeed = Math.min(
		speedMax,
		Math.max(speedMin, Number.isFinite(rawTickerSpeed) ? rawTickerSpeed : speedDefault)
	);
	// Pixels-per-second, identical to `ticker.js` `tickerMarqueeSpeedPx` so the
	// editor preview and the front end scroll at the same velocity.
	const marqueeSpeed = tickerSpeed > 0 ? Math.round((1000 * 250) / tickerSpeed) : 50;

	const showGradient = layoutOptions.tickerGradient === true;
	const gradientWidth = Number(layoutOptions.tickerGradientWidth ?? 100);
	const gradientColor = layoutOptions.tickerGradientColor ?? '';
	const variableWidth = !!layoutOptions.variableWidth && !isVertical;

	// Column count and gap follow the previewed device, the same way every other
	// layout resolves them. The ticker writes both as inline styles, so a media
	// query cannot correct a desktop-only value further down.
	const activeColumns = columns?.[activeDevice] ?? columns?.Desktop ?? 3;
	const activeGapNum = gapNum[activeDevice] ?? gapNum.Desktop;
	const activeGapUnit = gapUnit[activeDevice] ?? gapUnit.Desktop;

	const viewportRef = useRef(null);
	const stripARef = useRef(null);
	const [itemWidthPx, setItemWidthPx] = useState(0);
	const [durationSec, setDurationSec] = useState(40);
	const [paused, setPaused] = useState(false);
	// Strips per half of the track. The track renders `2 × halfCount` strips so
	// the `-50%` loop stays seamless even when the items are narrower than the
	// viewport (parity with `ticker.js` `fillTrackStrips`).
	const [halfCount, setHalfCount] = useState(1);

	const itemsKey = useMemo(
		() => `${items.length}:${items.map((it, idx) => it.id ?? idx).join(',')}`,
		[items]
	);

	const imageSizingKey = useMemo(() => {
		const imageOptions = attributes?.imageOptions || {};
		return JSON.stringify({
			variableWidth: !!layoutOptions.variableWidth,
			mode: imageOptions.variableWidthImageHeightMode,
			height: imageOptions.variableWidthImageHeight,
		});
	}, [attributes?.imageOptions, layoutOptions.variableWidth]);

	// Measure fixed-item width (parity with `ticker.js initTickerHorizontal`) and
	// the strip scroll width → animation duration. Epsilon-guarded setState so the
	// ResizeObserver remeasure cascade converges instead of looping.
	const remeasure = useCallback(() => {
		const viewportEl = viewportRef.current;
		const stripEl = stripARef.current;
		if (!viewportEl || !stripEl) {
			return;
		}
		// Item-width column math tolerates an 800px fallback before first layout.
		const containerWidth = viewportEl.clientWidth || 800;
		if (!variableWidth) {
			const gapPx = gapToPx(activeGapNum, activeGapUnit, viewportEl);
			const cols = Math.max(1, Math.ceil(Number(activeColumns)));
			const width = Math.floor((containerWidth - gapPx * (cols - 1)) / cols);
			if (width > 0) {
				setItemWidthPx((prev) => (Math.abs(prev - width) >= 1 ? width : prev));
			}
		}
		const scrollWidth = Math.ceil(stripEl.scrollWidth);
		if (scrollWidth <= 0) {
			return;
		}
		// Strip-fill count must use the REAL viewport width — NOT the 800 fallback —
		// to match `ticker.js fillTrackStrips`. When an ancestor is `display:none`
		// (a Hide-on-Device toggle), clientWidth is 0, so defer until visible.
		const viewportExtent = viewportEl.clientWidth || 0;
		if (viewportExtent <= 0) {
			return;
		}
		const half = Math.max(1, Math.ceil(viewportExtent / scrollWidth));
		setHalfCount((prev) => (prev === half ? prev : half));
		const duration = scrollWidth > 0 && marqueeSpeed > 0 ? (half * scrollWidth) / marqueeSpeed : 40;
		setDurationSec((prev) => (Math.abs(prev - duration) < 0.02 && prev > 0 ? prev : duration));
	}, [activeGapNum, activeGapUnit, activeColumns, variableWidth, marqueeSpeed]);

	useLayoutEffect(() => {
		if (isVertical) {
			return undefined;
		}
		const viewportEl = viewportRef.current;
		if (!viewportEl) {
			return undefined;
		}
		const ro = new ResizeObserver(() => {
			requestAnimationFrame(remeasure);
		});
		ro.observe(viewportEl);
		const stripEl = stripARef.current;
		if (stripEl) {
			ro.observe(stripEl);
		}
		return () => ro.disconnect();
	}, [remeasure, itemsKey, isVertical, imageSizingKey]);

	useLayoutEffect(() => {
		if (isVertical) {
			return;
		}
		requestAnimationFrame(remeasure);
	}, [remeasure, itemsKey, isVertical, imageSizingKey]);

	// Re-measure once images decode (their loaded width feeds the strip scrollWidth).
	useEffect(() => {
		if (isVertical) {
			return undefined;
		}
		const viewportEl = viewportRef.current;
		if (!viewportEl) {
			return undefined;
		}
		const imgs = Array.from(viewportEl.querySelectorAll('.wpcp-item-img'));
		let cancelled = false;
		const finish = () => {
			if (!cancelled) {
				requestAnimationFrame(remeasure);
			}
		};
		if (imgs.length === 0) {
			finish();
			return () => {
				cancelled = true;
			};
		}
		const allLoaded = () => imgs.every((img) => img.complete && img.naturalWidth !== 0);
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
	}, [itemsKey, remeasure, isVertical, imageSizingKey, variableWidth]);

	// Variable-width image heights apply via CSS custom properties after paint;
	// poll strip scrollWidth briefly so sparse marquees fill the viewport.
	useEffect(() => {
		if (isVertical || !variableWidth) {
			return undefined;
		}
		let cancelled = false;
		let lastScrollWidth = 0;
		const started = Date.now();
		const poll = () => {
			if (cancelled) {
				return;
			}
			const stripEl = stripARef.current;
			if (stripEl) {
				const nextWidth = Math.ceil(stripEl.scrollWidth);
				if (nextWidth > 0 && nextWidth !== lastScrollWidth) {
					lastScrollWidth = nextWidth;
					remeasure();
				}
			}
			if (Date.now() - started < 4000) {
				requestAnimationFrame(poll);
			}
		};
		requestAnimationFrame(poll);
		return () => {
			cancelled = true;
		};
	}, [itemsKey, remeasure, isVertical, imageSizingKey, variableWidth]);

	if (isVertical) {
		return (
			<div
				ref={containerRef}
				className={classNames('wpcp-carousel-render wpcp-style-ticker wpcp-vertical', orientationClass)}
			>
				<TickerVerticalMarquee
					items={items}
					attributes={attributes}
					isEditor={isEditor}
					onItemEdit={onItemEdit}
					gapNum={gapNum}
					gapUnit={gapUnit}
					columns={columns}
					marqueeSpeed={marqueeSpeed}
					activeDevice={activeDevice}
					socialIcons={socialIcons}
				/>
			</div>
		);
	}

	// The first half of the track is the real, announced content; the second half
	// is decorative fill for the seamless loop and must stay non-interactive —
	// `inert` + `data-lightbox-ignore` keep its clones out of the lightbox gallery
	// and out of Fancybox's close-time focus-back scroll.
	const renderStrip = (idx) => (
		<div
			key={`strip-${idx}`}
			ref={idx === 0 ? stripARef : undefined}
			className={`wpcp-ticker-horizontal__strip wpcp-ticker-align-${layoutOptions.alignItems}`}
			{...(idx >= halfCount
				? { 'aria-hidden': 'true', inert: 'true', 'data-lightbox-ignore': 'true' }
				: {})}
		>
			{items.map((item, i) => (
				<div
					key={`${idx}-${item.id ?? i}`}
					className={classNames(
						'wpcp-item',
						'wpcp-ticker-item',
						variableWidth ? 'wpcp-ticker-item--variable' : 'wpcp-ticker-item--fixed'
					)}
					style={{
						flexShrink: 0,
						marginRight: gapCssValue(activeGapNum, activeGapUnit),
						...(variableWidth
							? { width: 'auto', minWidth: 'min-content', maxWidth: '100%' }
							: { width: itemWidthPx > 0 ? `${itemWidthPx}px` : 'auto' }),
					}}
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

	return (
		<div
			ref={containerRef}
			className={classNames('wpcp-carousel-render wpcp-style-ticker', orientationClass)}
		>
			<div
				ref={viewportRef}
				className={classNames(
					'wpcp-ticker-horizontal',
					pauseHover && 'wpcp-ticker-horizontal--pause-hover',
					pauseFocus && 'wpcp-ticker-horizontal--pause-focus',
					showGradient && 'wpcp-ticker-horizontal--gradient',
					isRtl && 'wpcp-ticker-horizontal--rtl',
					paused && 'wpcp-ticker-paused'
				)}
				style={{
					'--wpcp-ticker-gradient-width': `${gradientWidth}px`,
					...(gradientColor ? { '--wpcp-ticker-gradient-color': gradientColor } : {}),
					'--wpcp-ticker-horizontal-duration': `${durationSec}s`,
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
					key={`ht-${Math.round(itemWidthPx)}-${durationSec.toFixed(2)}-${halfCount}-${itemsKey}`}
					className="wpcp-ticker-horizontal__track"
				>
					{Array.from({ length: halfCount * 2 }, (_, idx) => renderStrip(idx))}
				</div>
			</div>
		</div>
	);
}
