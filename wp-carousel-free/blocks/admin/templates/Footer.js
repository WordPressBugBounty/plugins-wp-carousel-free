/**
 * Dashboard footer — Figma 7403-150117.
 *
 * Three columns: attribution, social links, review prompt. The brand glyphs are
 * the same Font Awesome paths the block layer's social-share icons use, so the
 * marks stay identical across the plugin.
 */

import { __ } from '@wordpress/i18n';

const REVIEW_URL =
	'https://wordpress.org/support/plugin/wp-carousel-free/reviews/?filter=5#new-post';

const SOCIAL_LINKS = [
	{
		label: __('LinkedIn', 'wp-carousel-free'),
		url: 'https://www.linkedin.com/company/shapedplugin',
		viewBox: '0 0 448 512',
		path:
			'M416 0H31.9C14.3 0 0 14.5 0 32.3V415.7C0 433.5 14.3 448 31.9 448H416C433.6 448 448 433.5 448 415.7V32.3C448 14.5 433.6 0 416 0ZM135.4 384H69V170.2H135.5V384H135.4ZM102.2 64C112.411 64 122.203 68.0562 129.424 75.2764C136.644 82.4965 140.7 92.2892 140.7 102.5C140.7 112.711 136.644 122.503 129.424 129.724C122.203 136.944 112.411 141 102.2 141C91.9892 141 82.1965 136.944 74.9764 129.724C67.7562 122.503 63.7 112.711 63.7 102.5C63.7 92.2892 67.7562 82.4965 74.9764 75.2764C82.1965 68.0562 91.9892 64 102.2 64ZM384.3 384H317.9V280C317.9 255.2 317.4 223.3 283.4 223.3C248.8 223.3 243.5 250.3 243.5 278.2V384H177.1V170.2H240.8V199.4H241.7C250.6 182.6 272.3 164.9 304.6 164.9C371.8 164.9 384.3 209.2 384.3 266.8V384Z',
	},
	{
		label: __('X (Twitter)', 'wp-carousel-free'),
		url: 'https://twitter.com/shapedplugin',
		viewBox: '0 0 512 512',
		path:
			'M362.4 0H433L278.8 176.2L460.2 416H318.2L206.9 270.6L79.7 416H9L173.9 227.5L0 0H145.6L246.1 132.9L362.4 0ZM337.6 373.8H376.7L124.3 40H82.3L337.6 373.8Z',
	},
	{
		label: __('WordPress', 'wp-carousel-free'),
		url: 'https://profiles.wordpress.org/shapedplugin/',
		viewBox: '0 0 16 16',
		path:
			'M16 8c0-4.408-3.592-8-8-8-4.416 0-8 3.592-8 8 0 4.416 3.584 8 8 8 4.408 0 8-3.584 8-8m-9.776 4.296-2.728-7.32c.44-.016.936-.064.936-.064.4-.048.352-.904-.048-.888 0 0-1.16.088-1.896.088-.144 0-.296 0-.464-.008A7.1 7.1 0 0 1 8 .888c1.864 0 3.56.696 4.84 1.872-.544-.088-1.32.312-1.32 1.264 0 .592.36 1.088.72 1.68.28.488.44 1.088.44 1.968 0 1.192-1.12 4-1.12 4L9.136 4.976c.432-.016.656-.136.656-.136.4-.04.352-1-.048-.976 0 0-1.152.096-1.904.096-.696 0-1.864-.096-1.864-.096-.4-.024-.448.96-.048.976l.736.064 1.008 2.728zM13.928 8c.192-.512.592-1.496.344-3.4q.84 1.55.84 3.4c0 2.632-1.384 4.992-3.52 6.224.776-2.072 1.552-4.16 2.336-6.224M4.88 14.472C2.496 13.32.888 10.824.888 8c0-1.04.184-1.984.576-2.872C2.6 8.24 3.736 11.36 4.88 14.472m3.224-5.304 2.064 5.584a6.7 6.7 0 0 1-2.168.36 6.3 6.3 0 0 1-1.832-.264c.648-1.904 1.296-3.792 1.936-5.68',
	},
	{
		label: __('Facebook', 'wp-carousel-free'),
		url: 'https://www.facebook.com/shapedplugin',
		viewBox: '0 0 512 512',
		path:
			'M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.98V256h68.85l-11 71.69h-57.85V501C413.31 482.38 504 379.78 504 256z',
	},
	{
		label: __('YouTube', 'wp-carousel-free'),
		url: 'https://www.youtube.com/watch?v=8AXDkQCiU9c&list=PLoUb-7uG-5jNgTTcnUflIiytxgTWaBEzm',
		viewBox: '0 0 576 512',
		path:
			'M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.071l142.739 81.205-142.739 81.215z',
	},
];

const HeartIcon = () => (
	<svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
		<path
			d="M11.7067 1.5C9.87333 1.11167 8.57667 2.105 8 2.69167C7.42333 2.10667 6.13493 1.11167 4.29333 1.5C3.12667 1.74333 2.10333 2.66667 1.53 3.99C0.9 5.44173 0.955 7.02173 1.67667 8.21827C3.04173 10.4816 7.54333 14.2083 7.73507 14.3665L8.00007 14.5865L8.26507 14.3682C8.45673 14.2099 12.9584 10.4831 14.3235 8.21993C15.0451 7.02327 15.1001 5.44327 14.4701 3.99167C13.8968 2.67667 12.8649 1.74507 11.7067 1.5ZM13.61 7.79C12.5 9.6284 9 12.6667 8 13.5C7 12.6667 3.5 9.62667 2.39 7.78667C1.80667 6.82 1.77167 5.52507 2.295 4.3216C2.76 3.2516 3.57167 2.5016 4.46167 2.3216C4.67249 2.27613 4.8876 2.25321 5.10333 2.25327C6.67827 2.25327 7.61333 3.51327 7.65827 3.5766L7.9916 4.04993L8.32493 3.57493C8.33827 3.55827 9.54493 1.90827 11.5216 2.3216C12.4149 2.50993 13.2267 3.25993 13.6883 4.3216C14.2283 5.52827 14.1933 6.82333 13.61 7.79Z"
			fill="#e57373"
		/>
		<path
			d="M13.61 7.79C12.5 9.6284 9 12.6667 8 13.5C7 12.6667 3.5 9.62667 2.39 7.78667C1.80667 6.82 1.77167 5.52507 2.295 4.3216C2.76 3.2516 3.57167 2.5016 4.46167 2.3216C4.67249 2.27613 4.8876 2.25321 5.10333 2.25327C6.67827 2.25327 7.61333 3.51327 7.65827 3.5766L7.9916 4.04993L8.32493 3.57493C8.33827 3.55827 9.54493 1.90827 11.5216 2.3216C12.4149 2.50993 13.2267 3.25993 13.6883 4.3216C14.2283 5.52827 14.1933 6.82333 13.61 7.79Z"
			fill="#e57373"
		/>
	</svg>
);

const STAR_OFFSETS = [7, 22.1, 37.2, 52.3, 67.4];

const StarsIcon = () => (
	<svg
		width="74.4"
		height="14"
		viewBox="0 0 74.4 14"
		fill="none"
		aria-hidden="true"
		focusable="false"
	>
		{STAR_OFFSETS.map((x) => (
			<path
				key={x}
				d={`M${x} 0L${x + 1.85152} 4.4516L${x + 6.6574} 4.83688L${x + 2.99583} 7.9734L${
					x + 4.1145
				} 12.6631L${x} 10.15L${x - 4.1145} 12.6631L${x - 2.99583} 7.9734L${x - 6.657396} 4.83688L${
					x - 1.85152
				} 4.4516L${x} 0Z`}
				fill="#2271b1"
			/>
		))}
	</svg>
);

export default function Footer() {
	return (
		<div className="wpcpf-admin-footer">
			<div className="wpcpf-footer-content">
				<div className="wpcpf-footer-left">
					<span>{__('Made with', 'wp-carousel-free')}</span>
					<HeartIcon />
					<span>{__('by the', 'wp-carousel-free')}</span>
					<a
						href="https://shapedplugin.com/about-us/"
						target="_blank"
						rel="noopener noreferrer"
						className="wpcpf-footer-link"
					>
						{__('ShapedPlugin LLC Team', 'wp-carousel-free')}
					</a>
				</div>

				<div className="wpcpf-footer-center">
					<span>{__('Get Connected with', 'wp-carousel-free')}</span>
					<div className="wpcpf-footer-socials">
						{SOCIAL_LINKS.map((social) => (
							<a
								key={social.label}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								className="wpcpf-footer-social"
								aria-label={social.label}
							>
								<svg
									width={16}
									height={16}
									viewBox={social.viewBox}
									fill="currentColor"
									aria-hidden="true"
									focusable="false"
								>
									<path d={social.path} />
								</svg>
							</a>
						))}
					</div>
				</div>

				<div className="wpcpf-footer-right">
					<span>
						{__('Enjoyed', 'wp-carousel-free')} <b>{__('WP Carousel', 'wp-carousel-free')}</b>
						{__('?', 'wp-carousel-free')}
					</span>
					<a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" className="wpcpf-footer-rate">
						<span className="wpcpf-footer-link">{__('Rate us!', 'wp-carousel-free')}</span>
						<StarsIcon />
					</a>
				</div>
			</div>
		</div>
	);
}
