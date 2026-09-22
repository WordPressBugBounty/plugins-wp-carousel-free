import { __, sprintf } from '@wordpress/i18n';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;
const img = (file) => `${wpcpf?.pluginUrl || ''}src/Admin/img/testimonial/${file}`;

// Ratings and reviews are quoted verbatim from WordPress.org and Trustpilot,
// so only the surrounding chrome is translatable.
const RATINGS = [
	{ logo: 'wordpress-mark.svg', logoWidth: 20, stars: 'wordpress', score: '4.7', count: '428+' },
	{ logo: 'trustpilot-logo.svg', logoWidth: 21, stars: 'trustpilot', score: '4.9', count: '119+' },
];

const REVIEWS = [
	{
		name: 'Jim Longo',
		role: 'Web Developer',
		avatar: 'avatar-1.png',
		source: 'wordpress',
		text:
			'I’ve come to expect great products and support from ShapedPlugins, and WP Carousel is no exception. Easy to use, with lots of configurability. Wanted to use it in a bit of a different way, and support was willing to work with me to get the results I needed',
	},
	{
		name: 'Rehan Ahmed',
		role: 'Freelancer from U.A.E.',
		avatar: 'avatar-2.png',
		source: 'trustpilot',
		text:
			'I’ve had an excellent experience using ShapedPlugin’s online support and their wide range of WordPress plugins. Their tools are well-designed, user-friendly, and integrate seamlessly into my projects...',
	},
	{
		name: 'Cw Sherman',
		role: 'Content Writer',
		avatar: 'avatar-3.png',
		source: 'wordpress',
		text:
			'I set up a few carousels on a blogpost with the intention of adding a more polished presentation as well as eliminating the Gallery sprawl that can take over the post. Very easy to set up and in my case the default template fit my needs.',
	},
];

/**
 * Five-star strip. WordPress ratings are one exported sprite; Trustpilot's are
 * five white glyphs on their own green tiles, as in the brand's own widget.
 *
 * @param {Object} props
 * @param {string} props.source 'wordpress' or 'trustpilot'.
 * @return {JSX.Element} Rendered stars.
 */
const Stars = ({ source }) => {
	if ('trustpilot' === source) {
		return (
			<span className="wpcpf-testimonial-stars wpcpf-testimonial-stars--trustpilot">
				{[1, 2, 3, 4, 5].map((star) => (
					<span key={star} className="wpcpf-testimonial-star">
						<img src={img('trustpilot-star.svg')} alt="" />
					</span>
				))}
			</span>
		);
	}

	return (
		<img
			className="wpcpf-testimonial-stars wpcpf-testimonial-stars--wordpress"
			src={img('stars-wordpress-card.svg')}
			alt=""
		/>
	);
};

export default function Testimonial() {
	return (
		<div className="wpcpf-testimonial-section">
			<div className="wpcpf-testimonial-header">
				<div className="wpcpf-testimonial-ratings">
					{RATINGS.map((rating) => (
						<div key={rating.logo} className="wpcpf-testimonial-rating">
							<img src={img(rating.logo)} width={rating.logoWidth} height={20} alt="" />
							{'trustpilot' === rating.stars ? (
								<Stars source="trustpilot" />
							) : (
								<img
									className="wpcpf-testimonial-stars wpcpf-testimonial-stars--wordpress"
									src={img('stars-wordpress.svg')}
									alt=""
								/>
							)}
							<strong>{rating.score}</strong>
							<span>
								{sprintf(
									/* translators: %s: review count, e.g. 428+. */
									__('%s Reviews', 'wp-carousel-free'),
									rating.count
								)}
							</span>
						</div>
					))}
				</div>
				<h2>{__('Don’t Just Take Our Word for It — See What Users Say!', 'wp-carousel-free')}</h2>
			</div>

			<div className="wpcpf-testimonial-row">
				{REVIEWS.map((review) => (
					<div key={review.name} className="wpcpf-testimonial-card">
						<div className="wpcpf-testimonial-reviewer">
							<span className="wpcpf-testimonial-avatar">
								<img src={img(review.avatar)} alt="" />
								<span className="wpcpf-testimonial-source">
									<img
										src={img('wordpress' === review.source ? 'badge-wordpress.svg' : 'badge-trustpilot.svg')}
										alt=""
									/>
								</span>
							</span>
							<span className="wpcpf-testimonial-reviewer-info">
								<strong>{review.name}</strong>
								<span>{review.role}</span>
							</span>
						</div>
						<Stars source={review.source} />
						<p>{review.text}</p>
					</div>
				))}
			</div>
		</div>
	);
}
