import { __ } from '@wordpress/i18n';
import { BlockCard } from './template-parts';
import { upcomingBlocks } from './block-data';

export default function Blocks({ blockVisibility, saveOptions }) {
	// Free and Pro share one grid; a Pro row is told apart by its badge, not by
	// which section it sits in. Order is the server's call.
	const list = blockVisibility || [];

	// Client-side only: the server never sends these, so they carry no saved
	// state and their toggle is inert.
	const upcomingItems = upcomingBlocks.map((name) => ({ name, show: false, coming_soon: true }));

	return (
		<div className="wpcpf-dashboard-blocks">
			<div className="wpcpf-page-header">
				<h2 className="wpcpf-page-title">{__('Control Blocks', 'wp-carousel-free')}</h2>
				<p className="wpcpf-page-desc">
					{__('Turn blocks on or off as needed to improve performance.', 'wp-carousel-free')}
				</p>
			</div>

			{list.length > 0 && (
				<div className="wpcpf-blocks-grid">
					{list.map((item) => (
						<BlockCard
							key={item.name}
							item={item}
							saveOptions={saveOptions}
							blockVisibility={list}
						/>
					))}
				</div>
			)}

			{upcomingItems.length > 0 && (
				<>
					<h3 className="wpcpf-blocks-section-title">{__('Upcoming Blocks', 'wp-carousel-free')}</h3>
					<div className="wpcpf-blocks-grid">
						{upcomingItems.map((item) => (
							<BlockCard
								key={item.name}
								item={item}
								saveOptions={saveOptions}
								blockVisibility={list}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
