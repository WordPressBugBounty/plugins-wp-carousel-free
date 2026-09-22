import './editor.scss';

const Divider = ({ position = '', color = '' }) => {
	return (
		<span
			className={`wpcp-divider ${position} ${color}`.trim()}
			style={{
				...(color && { borderBottom: `2px solid ${color}` }),
			}}
		></span>
	);
};

export default Divider;
