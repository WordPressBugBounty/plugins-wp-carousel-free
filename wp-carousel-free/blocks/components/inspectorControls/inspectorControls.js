import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import './editor.scss';
import { blockDocLink } from '../../controls/constants';

const InspectorControl = ({
	Inspector,
	attributes,
	setAttributes,
	isSelected = false,
	children,
}) => {
	const { blockName } = attributes;
	const docHref = blockDocLink[blockName];
	// Patterns CTA moved to ReadyPatternsPanel inspector panel - no header button needed.

	return (
		<InspectorControls>
			<div className="wpcp-tab-panel">
				{docHref && (
					<div className="wpcp-tab-panel-doc-link-wrapper">
						<div className="wpcp-block-doc-link">
							<a href={docHref} target="_blank" rel="noreferrer">
								{__('Documentation', 'wp-carousel-free')}
							</a>
						</div>
					</div>
				)}

				{children ||
					(Inspector && (
						<Inspector attributes={attributes} setAttributes={setAttributes} isSelected={isSelected} />
					))}
			</div>
		</InspectorControls>
	);
};

export default InspectorControl;
