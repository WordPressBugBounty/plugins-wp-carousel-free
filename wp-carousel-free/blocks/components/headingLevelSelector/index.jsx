/**
 * Heading Level Selector Component
 *
 * Reusable component for selecting heading levels (H1-H6)
 */

export default function HeadingLevelSelector({ value = 2, onChange }) {
	const levels = [1, 2, 3, 4, 5, 6];
	return (
		<div style={{ display: 'flex', gap: 4 }}>
			{levels.map((level) => (
				<button
					key={level}
					onClick={() => onChange(level)}
					className={`components-button is-button is-default ${value === level ? 'is-primary' : ''}`}
					style={{ minWidth: 'auto', padding: '4px 8px' }}
				>
					H{level}
				</button>
			))}
		</div>
	);
}
