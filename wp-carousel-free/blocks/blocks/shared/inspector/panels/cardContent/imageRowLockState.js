/**
 * Image-row lock state for the Card Content element sorter. The image position
 * is honored only by the Classic (image-top) orientation ("content runs"), so
 * the row is draggable exclusively there; everywhere else the image is the
 * card backdrop and stays pinned first. On the image source the image IS the
 * slide, so its visibility toggle stays locked on even when the row is
 * draggable.
 *
 * @param {string} resolvedOrientation resolveContentOrientation() output.
 * @param {string} sourceType          Sorter source key (externalPost remap is fine).
 * @return {{ isImageLocked: boolean, isImageToggleLocked: boolean }} Lock flags.
 */
export function getImageRowLockState(resolvedOrientation, sourceType) {
	const isClassicOrientation = resolvedOrientation === 'image-top';
	return {
		isImageLocked: !isClassicOrientation,
		isImageToggleLocked: sourceType === 'image',
	};
}
