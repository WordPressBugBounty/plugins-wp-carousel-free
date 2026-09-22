/**
 * Single floating fly-content bubble for the editor preview. Mounted at
 * `.wpcp-block-inner` scope (outside the Swiper `overflow:hidden` viewport) so
 * the cursor-following tooltip is never clipped. Owns its own state and
 * registers a merging updater into the shared ref, so only this component
 * re-renders as the pointer moves over fly-content items. Editor-only — the
 * two Pro preview blocks are the only place Fly Content can be selected.
 *
 * @param {Object} props           Component props.
 * @param {Object} props.reportRef Shared ref CarouselEdit forwards pointer reports through (`.current` is the state updater).
 */

import { useState, useEffect } from '@wordpress/element';
import classNames from 'classnames';

export default function FlyContentBubble({ reportRef }) {
	const [state, setState] = useState({
		visible: false,
		x: 0,
		y: 0,
		content: null,
		align: 'left',
		width: '',
	});

	useEffect(() => {
		reportRef.current = (partial) => setState((prev) => ({ ...prev, ...partial }));
		return () => {
			reportRef.current = null;
		};
	}, [reportRef]);

	return (
		<div
			className={classNames('wpcp-fly-content', 'wpcp-fly-floating', 'wpcp-item-content', {
				[`wpcp-content-align--${state.align}`]: !!state.align,
				'wpcp-fly-visible': state.visible,
			})}
			style={{ left: state.x, top: state.y, width: state.width || undefined }}
			aria-hidden="true"
		>
			{state.content}
		</div>
	);
}
