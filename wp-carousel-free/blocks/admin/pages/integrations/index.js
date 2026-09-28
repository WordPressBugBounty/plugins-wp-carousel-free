/**
 * Page Builder Integrations — Figma 7403-150035.
 *
 * Each card switches one builder's integration on or off. The switch writes
 * `wpcp_integrations_options` through the dashboard's own save helper, and
 * `Admin\PageBuilders\Manager` reads it back to decide whether to register that
 * builder's saved-template element. An integration with no stored value is on,
 * so a fresh install has every builder it has installed already working.
 */

import { __, sprintf } from '@wordpress/i18n';
import { useId, useMemo, useState } from '@wordpress/element';
import {
	ElementorIntegrationIcon,
	DiviIntegrationIcon,
	WPBakeryIntegrationIcon,
	BeaverIntegrationIcon,
	BricksIntegrationIcon,
	OxygenIntegrationIcon,
} from './icons';
import { DocsIcon } from '../common-icons';
import { toastSuccessMsg } from '../../functions';

const DOCS_URL = 'https://docs.wpcarousel.io/guide/page-builders';

// Each builder has its own guide page; only beaver's slug differs from its row key.
const DOCS_SLUGS = {
	beaver: 'beaver-builder',
};

/**
 * Docs URL for one builder's step-by-step guide.
 *
 * @param {string} builderKey Row key, e.g. 'oxygen'.
 * @return {string} Docs URL.
 */
function getDocsUrl(builderKey) {
	return `${DOCS_URL}/${DOCS_SLUGS[builderKey] || builderKey}`;
}

// Presentation only — which integrations exist, and in what order, is the
// server's call, so the grid renders what it sent and looks each row up here.
const PAGE_BUILDERS = {
	elementor: { label: 'Elementor', Icon: ElementorIntegrationIcon },
	divi: { label: 'Divi', Icon: DiviIntegrationIcon },
	wpbakery: { label: 'WPBakery', Icon: WPBakeryIntegrationIcon },
	oxygen: { label: 'Oxygen', Icon: OxygenIntegrationIcon },
	beaver: { label: 'Beaver Builder', Icon: BeaverIntegrationIcon },
	bricks: { label: 'Bricks', Icon: BricksIntegrationIcon },
};

/**
 * One integration card: 24px brand mark inline with the title, switch on the
 * right, description, then the Docs chip.
 *
 * @param {Object}   props
 * @param {Object}   props.item        Row from the server (key, is_active).
 * @param {Array}    props.allItems    Full list, sent back on every toggle.
 * @param {Function} props.saveOptions Dashboard save helper.
 */
function IntegrationCard({ item, allItems, saveOptions }) {
	const [saving, setSaving] = useState(false);
	const toggleInputId = useId();

	const builder = PAGE_BUILDERS[item.key];
	const label = builder?.label || item.key;
	const Icon = builder?.Icon;
	const isActive = !!item.is_active;

	const handleChange = () => {
		setSaving(true);

		const updated = allItems.map((row) =>
			row.key === item.key ? { ...row, is_active: !isActive } : row
		);

		// saveOptions reports its own failures, so only success is announced here.
		saveOptions({ integrations: updated })
			.then((json) => {
				if (!json?.success) {
					return;
				}
				toastSuccessMsg(
					isActive
						? /* translators: %s: page builder name, e.g. Elementor */
						  sprintf(__('%s integration disabled.', 'wp-carousel-free'), label)
						: /* translators: %s: page builder name, e.g. Elementor */
						  sprintf(__('%s integration enabled.', 'wp-carousel-free'), label)
				);
			})
			.catch(() => {})
			.finally(() => {
				setSaving(false);
			});
	};

	return (
		<div className="wpcpf-integration-card">
			<div className="wpcpf-integration-card-head">
				<div className="wpcpf-integration-card-title">
					{Icon && (
						<span className="wpcpf-integration-card-icon">
							<Icon />
						</span>
					)}
					<h4>{label}</h4>
				</div>
				<label
					className={`wpcpf-module-toggle${saving ? ' is-saving' : ''}`}
					htmlFor={toggleInputId}
					aria-label={
						/* translators: %s: page builder name, e.g. Elementor */
						sprintf(__('Toggle the %s integration', 'wp-carousel-free'), label)
					}
				>
					<input
						id={toggleInputId}
						type="checkbox"
						checked={isActive}
						onChange={handleChange}
						disabled={saving}
					/>
					<span className="wpcpf-module-toggle-slider" />
				</label>
			</div>

			<p className="wpcpf-integration-card-desc">
				{sprintf(
					/* translators: %s: page builder name, e.g. Elementor */
					__(
						'It allows using WP Carousel Gutenberg blocks in %s via the Saved Template Addon.',
						'wp-carousel-free'
					),
					label
				)}
			</p>

			<div className="wpcpf-integration-card-links">
				<a
					className="wpcpf-module-link"
					href={getDocsUrl(item.key)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<DocsIcon />
					<span>{__('Docs', 'wp-carousel-free')}</span>
				</a>
			</div>
		</div>
	);
}

export default function Integrations({ integrations, saveOptions }) {
	const list = useMemo(() => integrations || [], [integrations]);

	return (
		<div className="wpcpf-integrations">
			<div className="wpcpf-integrations-header">
				<h2>{__('Manage Integrations', 'wp-carousel-free')}</h2>
				<p>
					{__(
						'Enable only the Integration you need to keep your site fast and optimized.',
						'wp-carousel-free'
					)}
				</p>
			</div>

			<div className="wpcpf-integrations-grid">
				{list.map((item) => (
					<IntegrationCard key={item.key} item={item} allItems={list} saveOptions={saveOptions} />
				))}
			</div>
		</div>
	);
}
