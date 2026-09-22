/**
 * Curated showcase art for the Pro editor-preview blocks.
 *
 * Marquee and Panorama have no Source step and never persist `items`, so their
 * canvas renders this fixed set instead. Bundled and deterministic on purpose:
 * the preview is an upsell surface, so it must not depend on the quality or the
 * count of whatever the site happens to have uploaded.
 *
 * The photographs are food shots from the company's own media library, the same
 * subject the Pro layout mockups use, so the editor preview reads as a finished
 * gallery rather than as filler.
 *
 * The eight aspect ratios are deliberately mixed (16:9, 3:2, 4:3, 1:1, 4:5, 2:3)
 * so Marquee's Variable Width mode has something to demonstrate — that mode
 * sizes each slide from the image's own aspect at a fixed row height, so a
 * uniform set would render identically to fixed width. Eight items keeps
 * Panorama looping up to six columns (it needs `items.length > columns + 1`);
 * above that the preview simply stops wrapping.
 *
 * Pixel dimensions vary because the whole set is held to a byte budget: the
 * smooth photographs sit on the large canvases and the detail-heavy ones on the
 * small, and each file is encoded down until it fits. Only the aspect ratio
 * matters to the layout engines, never the absolute size.
 *
 * Files live in `src/Blocks/img/block-previews/`, not under `blocks/` — that
 * directory ships under neither packaging list, so an asset there would 404 in
 * every release build. Licensing and provenance are in that directory's
 * CREDITS.txt.
 *
 * Editor-only: both blocks render nothing on the front end, so these URLs are
 * never requested by a visitor. Negative ids so nothing can collide with a real
 * attachment.
 *
 * Titles and alt text are untranslated on purpose: they are sample content
 * standing in for the user's own captions, not editor chrome.
 */

import getPluginUrl from '../utils/pluginUrl';

const IMAGE_DIR = 'src/Blocks/img/block-previews/';

const DEMO_ITEMS = [
	{
		id: -1,
		file: 'showcase-01.webp',
		width: 760,
		height: 760,
		title: 'Rainbow Buddha Bowl',
		alt: 'Salmon and vegetable buddha bowl photographed from above',
		gradient: ['%2322c55e', '%23f97316'],
	},
	{
		id: -2,
		file: 'showcase-02.webp',
		width: 608,
		height: 760,
		title: 'Banana Pancake Stack',
		alt: 'Maple syrup poured over a tall stack of banana pancakes',
		gradient: ['%23f59e0b', '%23b45309'],
	},
	{
		id: -3,
		file: 'showcase-03.webp',
		width: 560,
		height: 420,
		title: 'BBQ Chicken Flatbread',
		alt: 'Sliced barbecue chicken flatbread pizza on a wooden board',
		gradient: ['%23ea580c', '%23dc2626'],
	},
	{
		id: -4,
		file: 'showcase-04.webp',
		width: 520,
		height: 347,
		title: 'Latte Break',
		alt: 'Three hands raising latte cups over a cafe table',
		gradient: ['%23a16207', '%23fbbf24'],
	},
	{
		id: -5,
		file: 'showcase-05.webp',
		width: 520,
		height: 292,
		title: 'Crispy Chicken Burger',
		alt: 'A crispy chicken burger beside a basket of fries',
		gradient: ['%23b45309', '%2378350f'],
	},
	{
		id: -6,
		file: 'showcase-06.webp',
		width: 560,
		height: 560,
		title: 'Shrimp Ramen',
		alt: 'A shrimp ramen bowl with a soft-boiled egg and chopsticks',
		gradient: ['%23f97316', '%2316a34a'],
	},
	{
		id: -7,
		file: 'showcase-07.webp',
		width: 460,
		height: 690,
		title: 'Winter Citrus Salad',
		alt: 'Garden salad on a dark plate beside a glass of orange juice',
		gradient: ['%2384cc16', '%23f59e0b'],
	},
	{
		id: -8,
		file: 'showcase-08.webp',
		width: 480,
		height: 600,
		title: 'Caramel Brownie Sundae',
		alt: 'Caramel sauce poured over a brownie sundae',
		gradient: ['%23d97706', '%2378350f'],
	},
];

/**
 * Gradient stand-in, used only when the plugin URL is unavailable.
 *
 * Without it an empty base would build a relative URL that resolves against
 * `/wp-admin/post.php` and fill the upsell canvas with broken-image icons.
 *
 * @param {Object} item  Demo item.
 * @param {number} index Position, for a unique gradient id.
 * @return {string} Inline SVG data URI.
 */
function buildFallbackUrl(item, index) {
	const [from, to] = item.gradient;
	const { width, height } = item;
	return (
		`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>` +
		`<defs><linearGradient id='g${index}' x1='0' y1='0' x2='1' y2='1'>` +
		`<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
		'</linearGradient></defs>' +
		`<rect width='${width}' height='${height}' fill='url(%23g${index})'/>`
	);
}

let cachedItems = null;

/**
 * The curated preview set, in the shape `CarouselRender` consumes.
 *
 * Memoized at module scope so the array identity is stable across renders — a
 * fresh array would remount the Swiper instance on every inspector keystroke.
 *
 * @return {object[]} Frozen preview items.
 */
export default function getPreviewDemoItems() {
	if (cachedItems) {
		return cachedItems;
	}

	const base = getPluginUrl();

	cachedItems = Object.freeze(
		DEMO_ITEMS.map((item, index) =>
			Object.freeze({
				id: item.id,
				image_url: base ? `${base}${IMAGE_DIR}${item.file}` : buildFallbackUrl(item, index),
				image_alt: item.alt,
				title: item.title,
				description: '',
				caption: '',
				url: '',
				// Left empty so a demo item is never a link — only `customUrl`
				// makes an image clickable in the renderer.
				customUrl: '',
				extra: Object.freeze({
					intrinsicWidth: item.width,
					intrinsicHeight: item.height,
				}),
			})
		)
	);

	return cachedItems;
}
