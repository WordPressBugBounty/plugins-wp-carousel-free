import { createRoot } from '@wordpress/element';
import Render from './Render';
import './style.scss';

window.addEventListener('DOMContentLoaded', () => {
	const el = document.getElementById('wpcpf-admin-dashboard-wrapper');
	if (el) {
		createRoot(el).render(<Render />);
	}
});
