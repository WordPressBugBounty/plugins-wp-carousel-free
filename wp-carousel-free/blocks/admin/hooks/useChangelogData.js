import { useEffect, useState } from '@wordpress/element';

// Fetches the changelog the first time the drawer opens, then keeps it.
export default function useChangelogData(open) {
	const [status, setStatus] = useState('idle');
	const [changelog, setChangelog] = useState('');

	useEffect(() => {
		if (!open || status !== 'idle') {
			return;
		}

		const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;
		if (!wpcpf?.ajaxUrl || !wpcpf?.nonce) {
			setStatus('error');
			return;
		}

		setStatus('loading');
		fetch(wpcpf.ajaxUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				action: 'wpcpf_changelog_data',
				nonce: wpcpf.nonce,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data?.success && data?.data?.changelog) {
					setChangelog(data.data.changelog);
					setStatus('success');
				} else {
					setStatus('error');
				}
			})
			.catch(() => setStatus('error'));
	}, [open, status]);

	return { status, changelog };
}
