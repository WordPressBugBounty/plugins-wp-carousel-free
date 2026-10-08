import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import './editor.scss';
import { blockDocLink } from '../../controls/constants';

const InspectorControl = ({
	Inspector,
	attributes,
	setAttributes,
	isSelected = false,
	onOpenReadyPatterns,
	children,
}) => {
	const { blockName } = attributes;
	const docHref = blockDocLink[blockName];

	return (
		<InspectorControls>
			<div className="wpcp-tab-panel">
				{(onOpenReadyPatterns || docHref) && (
					<div className="wpcp-tab-panel-header-actions">
						{onOpenReadyPatterns && (
							<button
								type="button"
								className="wpcp-header-action wpcp-header-action-patterns"
								onClick={onOpenReadyPatterns}
							>
								{__('Ready Patterns', 'wp-carousel-free')}
							</button>
						)}
						{docHref && (
							<a
								className="wpcp-header-action wpcp-header-action-docs"
								href={docHref}
								target="_blank"
								rel="noreferrer"
							>
								{__('Documentation', 'wp-carousel-free')}
							</a>
						)}
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
