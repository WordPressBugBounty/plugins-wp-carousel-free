import { __ } from '@wordpress/i18n';
import { BlockCard } from '../../pages/blocks/template-parts';

/**
 * Blocks step. Reuses the dashboard's own card, so a Pro block carries its PRO
 * badge and inert switch here for free and nothing new can be persisted.
 *
 * @param {Object}   props
 * @param {Array}    props.blockVisibility Registry rows from the server.
 * @param {Function} props.saveOptions     Dashboard save helper.
 */
export default function BlocksPage({ blockVisibility, saveOptions }) {
	// Only the blocks that exist: the dashboard's Blocks page is where upcoming
	// ones are advertised, the wizard is for switching on what ships today.
	const list = blockVisibility || [];

	return (
		<div className="wpcpf-sw-content-card wpcpf-sw-blocks-page">
			<div className="wpcpf-sw-blocks-header">
				<h2 className="wpcpf-sw-blocks-title">
					{__('Enable the Blocks You Need', 'wp-carousel-free')}
				</h2>
				<p className="wpcpf-sw-blocks-description">
					{__(
						'Turn on the blocks that match your workflow. You can update your selection anytime.',
						'wp-carousel-free'
					)}
				</p>
			</div>

			{list.length > 0 && (
				<div className="wpcpf-sw-blocks-section">
					<div className="wpcpf-sw-blocks-grid">
						{list.map((item) => (
							<BlockCard key={item.name} item={item} saveOptions={saveOptions} blockVisibility={list} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
