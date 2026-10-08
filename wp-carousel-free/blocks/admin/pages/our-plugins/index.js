import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import toast from 'react-hot-toast';
import './style.scss';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

// Core's wp_star_rating() for a 0–100 rating: five stars in half-star steps.
function StarRating({ rating, count }) {
	const stars = Math.round(rating / 10) / 2;
	const full = Math.floor(stars);
	const half = Math.ceil(stars - full);
	const empty = 5 - full - half;

	return (
		<div className="star-rating">
			<span className="screen-reader-text">
				{sprintf(
					/* translators: 1: rating out of 5, 2: number of ratings */
					_n(
						'%1$s rating based on %2$s rating',
						'%1$s rating based on %2$s ratings',
						count,
						'wp-carousel-free'
					),
					stars.toFixed(1),
					count.toLocaleString()
				)}
			</span>
			{[...Array(full)].map((_, index) => (
				<div key={`full-${index}`} className="star star-full" aria-hidden="true" />
			))}
			{[...Array(half)].map((_, index) => (
				<div key={`half-${index}`} className="star star-half" aria-hidden="true" />
			))}
			{[...Array(empty)].map((_, index) => (
				<div key={`empty-${index}`} className="star star-empty" aria-hidden="true" />
			))}
		</div>
	);
}

function PluginAction({ plugin, busy, onStart }) {
	if ('active' === plugin.status) {
		return (
			<button type="button" className="button button-disabled" disabled>
				{__('Active', 'wp-carousel-free')}
			</button>
		);
	}

	if (!plugin.actionUrl) {
		return (
			<a className="button" href={plugin.link} target="_blank" rel="noopener noreferrer">
				{__('View on WordPress.org', 'wp-carousel-free')}
			</a>
		);
	}

	const installed = 'installed' === plugin.status;
	let label = installed ? __('Activate', 'wp-carousel-free') : __('Install Now', 'wp-carousel-free');
	if (busy) {
		label = installed ? __('Activating…', 'wp-carousel-free') : __('Installing…', 'wp-carousel-free');
	}

	return (
		<a
			className={`button ${installed ? 'button-primary activate-now' : 'install-now'}${
				busy ? ' updating-message' : ''
			}`}
			href={plugin.actionUrl}
			onClick={(event) => {
				// A second click would start a second install; a new-tab click leaves this tab.
				if (busy) {
					event.preventDefault();
				} else if (!(event.metaKey || event.ctrlKey || event.shiftKey)) {
					onStart();
				}
			}}
			aria-disabled={busy}
		>
			{label}
		</a>
	);
}

export default function OurPlugins() {
	const plugins = wpcpf?.recommendedPlugins || [];
	const [busySlug, setBusySlug] = useState('');

	// Back-forward cache can restore the page mid-"Installing…".
	useEffect(() => {
		const reset = () => setBusySlug('');
		window.addEventListener('pageshow', reset);
		return () => window.removeEventListener('pageshow', reset);
	}, []);

	// Set by the activation handler when it could not activate the plugin.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get('wpcpf_activate_failed')) {
			toast.error(__('The plugin could not be activated.', 'wp-carousel-free'));
			params.delete('wpcpf_activate_failed');
			const query = params.toString();
			window.history.replaceState(
				null,
				'',
				`${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
			);
		}
	}, []);

	return (
		<section id="our-plugins-tab" className="wpcpf-recommended-plugins-wrapper">
			<h2 className="wpcpf-section-title">
				{__(
					'Supercharge Your Website with Our Free Plugins — Trusted by 402,050+ Users',
					'wp-carousel-free'
				)}
			</h2>

			{0 === plugins.length ? (
				<p className="wpcpf-our-plugins-empty">
					{__('The plugin list could not be loaded right now.', 'wp-carousel-free')}
					<a href="https://shapedplugin.com/plugins/" target="_blank" rel="noopener noreferrer">
						{__('Browse all plugins on shapedplugin.com', 'wp-carousel-free')}
					</a>
				</p>
			) : (
				<div className="wp-list-table plugin-install-php">
					<div className="wpcpf-recommended-plugins" id="the-list">
						{plugins.map((plugin) => {
							return (
								<div key={plugin.slug} className={`plugin-card ${plugin.slug}`} id={plugin.slug}>
									<div className="plugin-card-top">
										<div className="name column-name">
											<h3>
												<a href={plugin.link} target="_blank" rel="noopener noreferrer" title={plugin.name}>
													{plugin.name}
													{plugin.icon && <img src={plugin.icon} className="plugin-icon" alt="" />}
												</a>
											</h3>
										</div>
										<div className="action-links">
											<ul className="plugin-action-buttons">
												<li>
													<PluginAction
														plugin={plugin}
														busy={busySlug === plugin.slug}
														onStart={() => setBusySlug(plugin.slug)}
													/>
												</li>
												<li>
													<a
														href={plugin.link}
														target="_blank"
														rel="noopener noreferrer"
														aria-label={sprintf(
															/* translators: %s: plugin name */
															__('More information about %s', 'wp-carousel-free'),
															plugin.name
														)}
														title={plugin.name}
													>
														{__('More Details', 'wp-carousel-free')}
													</a>
												</li>
											</ul>
										</div>
										<div className="desc column-description">
											<p>{plugin.description}</p>
										</div>
									</div>
									<div className="plugin-card-bottom">
										{plugin.numRatings > 0 && (
											<div className="vers column-rating">
												<StarRating rating={plugin.rating} count={plugin.numRatings} />
												<span className="num-ratings" aria-hidden="true">
													({plugin.numRatings.toLocaleString()})
												</span>
											</div>
										)}
										{plugin.version && (
											<div className="column-updated">
												<strong>{__('Version:', 'wp-carousel-free')}</strong> <span>{plugin.version}</span>
											</div>
										)}
										{plugin.activeInstalls > 0 && (
											<div className="column-downloaded">
												{plugin.activeInstalls.toLocaleString()}
												{__('+ Active Installations', 'wp-carousel-free')}
											</div>
										)}
										{plugin.lastUpdatedAgo && (
											<div className="column-compatibility">
												<strong>{__('Last Updated:', 'wp-carousel-free')}</strong>{' '}
												<span>
													{sprintf(
														/* translators: %s: time ago */
														__('%s ago', 'wp-carousel-free'),
														plugin.lastUpdatedAgo
													)}
												</span>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</section>
	);
}
