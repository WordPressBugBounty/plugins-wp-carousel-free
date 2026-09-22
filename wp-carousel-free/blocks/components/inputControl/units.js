import { Button } from '@wordpress/components';

const Units = ({ units, onChange, activeUnit }) => {
	return (
		<div className="wpcp-units">
			<div className="wpcp-units-btn">
				{units?.map((item, i) => (
					<Button
						className={activeUnit === item.toLowerCase() ? 'active' : ''}
						key={i}
						value={item}
						onClick={(e) => onChange(e.target.value.toLowerCase())}
					>
						{' '}
						{item}{' '}
					</Button>
				))}
			</div>
		</div>
	);
};

export default Units;
