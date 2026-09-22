import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { getArrowIcon } from '../../navigationIconHelper';

/**
 * @param {Object}                    props
 * @param {import('react').RefObject} props.navPrevRef
 * @param {import('react').RefObject} props.navNextRef
 * @param {Object}                    props.navigationOptions
 */
export default function PanoramaNavArrows({ navPrevRef, navNextRef, navigationOptions = {} }) {
	const ArrowIcon = getArrowIcon(navigationOptions.arrowStyle);
	const showOnHover = navigationOptions.showOnHover === true;

	return (
		<div
			className={classNames(
				'wpcp-nav-arrows',
				'wpcp-navigation',
				showOnHover && 'wpcp-navigation--show-on-hover'
			)}
		>
			<button
				type="button"
				ref={navPrevRef}
				className="wpcp-nav wpcp-nav-prev"
				aria-label={__('Previous', 'wp-carousel-free')}
			>
				<ArrowIcon />
			</button>
			<button
				type="button"
				ref={navNextRef}
				className="wpcp-nav wpcp-nav-next"
				aria-label={__('Next', 'wp-carousel-free')}
			>
				<ArrowIcon />
			</button>
		</div>
	);
}
