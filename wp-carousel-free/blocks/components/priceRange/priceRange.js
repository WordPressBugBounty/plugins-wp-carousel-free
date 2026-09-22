/**
 * Price Range Component
 * Dedicated component for managing min-max price ranges.
 */

import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import InputControl from '../inputControl/inputControl';
import ChildPanelBody from '../childPanelBody/childPanelBody';
import './editor.scss';

const PriceRange = ({
	attributes = {},
	setAttributes = () => {},
	attributesKey,
	/** Currency symbol used in the range row titles. Pass the store's symbol for non-USD shops. */
	currency = '$',
}) => {
	const ranges = attributesKey ? attributes[attributesKey] || [] : [];

	// Ensure we have at least one range if empty
	const currentRanges = ranges.length > 0 ? ranges : [{ min: '', max: '' }];

	const [openIndex, setOpenIndex] = useState(0);

	if (!attributesKey) {
		return null;
	}

	const updateRange = (index, key, value) => {
		const newRanges = [...currentRanges];
		newRanges[index] = { ...newRanges[index], [key]: value };
		setAttributes({ [attributesKey]: newRanges });
	};

	const addRange = () => {
		const newRanges = [...currentRanges, { min: '', max: '' }];
		setAttributes({
			[attributesKey]: newRanges,
		});
		setOpenIndex(newRanges.length - 1);
	};

	const removeRange = (index) => {
		const newRanges = currentRanges.filter((_, i) => i !== index);
		setAttributes({ [attributesKey]: newRanges });
		if (openIndex === index) {
			setOpenIndex(null);
		} else if (openIndex > index) {
			setOpenIndex(openIndex - 1);
		}
	};

	// Row title renders only the values that are actually set, so an
	// empty min does not read as "$0".
	const rangeTitle = (range) => {
		if (!range.min && !range.max) {
			return __('Add New Option', 'wp-carousel-free');
		}
		return `${currency}${range.min ?? ''} - ${currency}${range.max ?? ''}`;
	};

	return (
		<div className="wpcp-price-range-global-control">
			{currentRanges.map((range, index) => {
				const title = rangeTitle(range);

				return (
					<div key={index} className="wpcp-price-range-item-box">
						<ChildPanelBody
							title={title}
							resetIcon={true}
							resetButtonAction={() => removeRange(index)}
							opened={openIndex === index}
							onToggle={() => setOpenIndex(openIndex === index ? null : index)}
						>
							<div className="wpcp-price-range-content">
								<div className="wpcp-price-range-label">{__('Price Range', 'wp-carousel-free')}</div>
								<div className="wpcp-price-range-inputs-row">
									<InputControl
										placeholder={__('Min Price', 'wp-carousel-free')}
										attributes={range.min}
										onChange={(val) => updateRange(index, 'min', val)}
										flex={false}
									/>
									<InputControl
										placeholder={__('Max Price', 'wp-carousel-free')}
										attributes={range.max}
										onChange={(val) => updateRange(index, 'max', val)}
										flex={false}
									/>
								</div>
							</div>
						</ChildPanelBody>
					</div>
				);
			})}
			<Button isSecondary onClick={addRange} className="wpcp-add-range-button-global">
				{__('Add New Option', 'wp-carousel-free')}
			</Button>
		</div>
	);
};

export default PriceRange;
