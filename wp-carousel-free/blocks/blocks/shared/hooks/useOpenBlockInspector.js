/**
 * Open the right-hand block settings sidebar (post editor, site editor, or widgets).
 */
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

export default function useOpenBlockInspector() {
	const editPost = useDispatch('core/edit-post');
	const editSite = useDispatch('core/edit-site');

	return useCallback(() => {
		if (editPost?.openGeneralSidebar) {
			editPost.openGeneralSidebar('edit-post/block');
			return;
		}
		if (editSite?.openGeneralSidebar) {
			editSite.openGeneralSidebar('edit-site/block-inspector');
		}
	}, [editPost, editSite]);
}
