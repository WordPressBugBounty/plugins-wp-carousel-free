import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { toastErrorMsg } from '../functions';

const wpcpf = typeof window !== 'undefined' ? window.wpcpfDashboard : null;

export default function useDashboardData() {
	const [options, setOptions] = useState(wpcpf?.getOptions || {});
	const [modifiedData, setModifiedData] = useState({});

	const saveOptions = useCallback(
		(data) => {
			if (!wpcpf?.ajaxUrl || !wpcpf?.nonce) {
				return Promise.reject(new Error('Missing config'));
			}
			const form = new FormData();
			form.append('action', 'wpcp_dashboard_save_options');
			form.append('nonce', wpcpf.nonce);
			form.append('data', JSON.stringify(data || modifiedData));
			return fetch(wpcpf.ajaxUrl, {
				method: 'POST',
				body: form,
				credentials: 'same-origin',
			})
				.then((r) => r.json())
				.then((json) => {
					if (json.success && json.data?.getOptions) {
						setOptions(json.data.getOptions);
						if (wpcpf) {
							wpcpf.getOptions = json.data.getOptions;
						}
						setModifiedData({});
					} else {
						toastErrorMsg(__('Something went wrong', 'wp-carousel-free'));
					}
					return json;
				})
				.catch(() => {
					toastErrorMsg(__('Something went wrong', 'wp-carousel-free'));
					throw new Error('Save failed');
				});
		},
		[modifiedData]
	);

	useEffect(() => {
		if (wpcpf?.getOptions) {
			setOptions(wpcpf.getOptions);
		}
	}, []);

	return {
		options,
		setModifiedData: (updater) => {
			setModifiedData((prev) =>
				typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
			);
		},
		saveOptions,
	};
}
