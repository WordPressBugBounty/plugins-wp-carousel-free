// Checkbox icons
export const CheckboxIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="1" y="1" width="18" height="18" rx="3" fill="white" stroke="#ddd" strokeWidth="1.5" />
	</svg>
);

export const CheckboxCheckedIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect
			x="1"
			y="1"
			width="18"
			height="18"
			rx="3"
			fill="#19949e"
			stroke="#19949e"
			strokeWidth="1.5"
		/>
		<path
			d="M6 10L8.5 12.5L14 7"
			stroke="white"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

// Dropdown arrow icon
export const DropdownArrowIcon = () => (
	<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M2.5 4.5L6 8L9.5 4.5"
			stroke="#666"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

// Add/Plus icon
export const AddIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" />
	</svg>
);

// Edit/Pencil icon
export const EditPencilIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
		<path
			d="M10.1421 3.98828L11.0765 3.05377C11.5927 2.53766 12.4295 2.53766 12.9456 3.05377C13.4617 3.56989 13.4617 4.40667 12.9456 4.92279L12.0111 5.85729M10.1421 3.98828L4.65284 9.47755C3.95597 10.1744 3.60752 10.5228 3.37026 10.9474C3.133 11.372 2.89428 12.3746 2.66602 13.3334C3.62474 13.1051 4.62734 12.8664 5.05194 12.6291C5.47654 12.3918 5.82498 12.0434 6.52185 11.3466L12.0111 5.85729M10.1421 3.98828L12.0111 5.85729"
			stroke="#757575"
			strokeWidth={1.25}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path d="M7.33398 13.3333H11.334" stroke="#757575" strokeWidth={1.25} strokeLinecap="round" />
	</svg>
);

// Copy icon
export const CopyIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
		<g clipPath="url(#clip0_copy_icon)">
			<path
				d="M6 10C6 8.1144 6 7.1716 6.58579 6.58579C7.1716 6 8.1144 6 10 6H10.6667C12.5523 6 13.4951 6 14.0809 6.58579C14.6667 7.1716 14.6667 8.1144 14.6667 10V10.6667C14.6667 12.5523 14.6667 13.4951 14.0809 14.0809C13.4951 14.6667 12.5523 14.6667 10.6667 14.6667H10C8.1144 14.6667 7.1716 14.6667 6.58579 14.0809C6 13.4951 6 12.5523 6 10.6667V10Z"
				stroke="#757575"
				strokeWidth={1.25}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M11.3339 5.99998C11.3323 4.02859 11.3025 3.00745 10.7286 2.30827C10.6178 2.17324 10.494 2.04943 10.359 1.93862C9.62145 1.33331 8.52565 1.33331 6.33398 1.33331C4.14233 1.33331 3.0465 1.33331 2.30894 1.93862C2.17391 2.04943 2.0501 2.17324 1.93929 2.30827C1.33398 3.04583 1.33398 4.14166 1.33398 6.33331C1.33398 8.52498 1.33398 9.62078 1.93929 10.3584C2.0501 10.4934 2.17391 10.6172 2.30894 10.728C3.00812 11.3018 4.02926 11.3316 6.00065 11.3332"
				stroke="#757575"
				strokeWidth={1.25}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
		<defs>
			<clipPath id="clip0_copy_icon">
				<rect width={16} height={16} fill="white" />
			</clipPath>
		</defs>
	</svg>
);

// Delete icon
export const DeleteIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
		<path
			d="M13 3.66669L12.5869 10.3501C12.4813 12.0576 12.4285 12.9114 12.0005 13.5253C11.7889 13.8288 11.5165 14.0849 11.2005 14.2774C10.5614 14.6667 9.706 14.6667 7.99513 14.6667C6.28208 14.6667 5.42553 14.6667 4.78603 14.2766C4.46987 14.0838 4.19733 13.8272 3.98579 13.5232C3.55792 12.9084 3.5063 12.0534 3.40307 10.3435L3 3.66669"
			stroke="#757575"
			strokeWidth={1.25}
			strokeLinecap="round"
		/>
		<path
			d="M2 3.66665H14M10.7038 3.66665L10.2487 2.7278C9.9464 2.10415 9.7952 1.79233 9.53447 1.59785C9.47667 1.55471 9.4154 1.51634 9.35133 1.48311C9.0626 1.33331 8.71607 1.33331 8.023 1.33331C7.31253 1.33331 6.95733 1.33331 6.66379 1.48939C6.59873 1.52399 6.53665 1.56391 6.47819 1.60876C6.21443 1.81111 6.06709 2.13435 5.77241 2.78082L5.36861 3.66665"
			stroke="#757575"
			strokeWidth={1.25}
			strokeLinecap="round"
		/>
		<path d="M6.33398 11V7" stroke="#757575" strokeWidth={1.25} strokeLinecap="round" />
		<path d="M9.66602 11V7" stroke="#757575" strokeWidth={1.25} strokeLinecap="round" />
	</svg>
);

// Search icon
export const SearchIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="7" cy="7" r="5" stroke="#999" strokeWidth="1.5" />
		<path d="M10.5 10.5L14 14" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);

// Pagination arrows
export const RightArrow = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={20} height={13} viewBox="0 0 5 9" fill="none">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M1.15403 0.865234L4.74524 4.81555L1.15403 8.76588L0.423828 8.10206L3.41156 4.81555L0.423829 1.52906L1.15403 0.865234Z"
			fill="#757575"
		/>
	</svg>
);

export const LeftArrow = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width={20} height={13} viewBox="0 0 5 9" fill="none">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.26589 0.865234L0.674678 4.81555L4.26589 8.76588L4.99609 8.10206L2.00836 4.81555L4.99609 1.52906L4.26589 0.865234Z"
			fill="#757575"
		/>
	</svg>
);

export const CheckIcon = () => (
	<svg width={15} height={15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M5.544 9.18a1.457 1.457 0 0 0 2.062 0l2.856-2.856a.53.53 0 1 0-.75-.75L6.856 8.428a.4.4 0 0 1-.561 0L5.289 7.423a.53.53 0 0 0-.75.75z"
			fill="#317d46"
		/>
		<path
			d="M7.5 14c3.584 0 6.5-2.916 6.5-6.5S11.084 1 7.5 1A6.507 6.507 0 0 0 1 7.5C1 11.084 3.916 14 7.5 14m0-11.939A5.445 5.445 0 0 1 12.939 7.5 5.445 5.445 0 0 1 7.5 12.939 5.445 5.445 0 0 1 2.061 7.5 5.445 5.445 0 0 1 7.5 2.061"
			fill="#317d46"
		/>
	</svg>
);

export const CopyToClipboardIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M1.35417 1.25H9.47917C9.53667 1.25 9.58333 1.29667 9.58333 1.35417V9.47917C9.58333 9.50679 9.57236 9.53329 9.55282 9.55282C9.53329 9.57236 9.50679 9.58333 9.47917 9.58333H1.35417C1.32654 9.58333 1.30004 9.57236 1.28051 9.55282C1.26097 9.53329 1.25 9.50679 1.25 9.47917V1.35417C1.25 1.29667 1.29667 1.25 1.35417 1.25ZM0 1.35417C0 0.606667 0.606667 0 1.35417 0H9.47917C10.2275 0 10.8333 0.606667 10.8333 1.35417V9.47917C10.8333 10.2275 10.2275 10.8333 9.47917 10.8333H1.35417C0.995019 10.8333 0.650582 10.6907 0.396626 10.4367C0.142671 10.1828 0 9.83831 0 9.47917V1.35417ZM12.0833 11.0675V3.5675H13.3333V11.0675C13.3333 12.3333 12.3083 13.3333 11.0425 13.3333H1.875V12.0833H11.0425C11.6175 12.0833 12.0833 11.6433 12.0833 11.0675Z"
			fill="#757575"
		/>
	</svg>
);

export const PlusIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M12.9581 11.0419V6H11.0419V11.0419H6V12.9581H11.0419V18H12.9581V12.9581H18V11.0419H12.9581Z"
			fill="currentColor"
		/>
	</svg>
);

export const EmptyStateFolderIcon = () => (
	<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M10.4062 21.0938H35.7188L39.375 14.625C40.0781 13.3594 41.3438 12.6562 42.75 12.6562H61.5938C63.9844 12.6562 65.8125 14.4844 65.8125 16.875V22.5H10.4062V21.0938Z"
			fill="#C2C9D2"
		/>
		<path
			d="M8.4375 21.0938H63.5625C65.9531 21.0938 67.7812 22.9219 67.7812 25.3125V59.3438C67.7812 61.7344 65.9531 63.5625 63.5625 63.5625H8.4375C6.04688 63.5625 4.21875 61.7344 4.21875 59.3438V25.3125C4.21875 22.9219 6.04688 21.0938 8.4375 21.0938Z"
			fill="#E0E4EA"
		/>
		<path
			d="M28.125 47.5312H18.8438C17.7564 47.5312 16.875 48.4127 16.875 49.5V52.0312C16.875 53.1186 17.7564 54 18.8438 54H28.125C29.2123 54 30.0938 53.1186 30.0938 52.0312V49.5C30.0938 48.4127 29.2123 47.5312 28.125 47.5312Z"
			fill="#C2C9D2"
		/>
		<path
			d="M55.9688 49.7812C60.784 49.7812 64.6875 45.8777 64.6875 41.0625C64.6875 36.2473 60.784 32.3438 55.9688 32.3438C51.1535 32.3438 47.25 36.2473 47.25 41.0625C47.25 45.8777 51.1535 49.7812 55.9688 49.7812Z"
			stroke="#B3BCC7"
			strokeWidth="3.375"
		/>
		<path
			d="M62.2969 47.3906L70.3125 55.4062"
			stroke="#B3BCC7"
			strokeWidth="3.375"
			strokeLinecap="round"
		/>
	</svg>
);
