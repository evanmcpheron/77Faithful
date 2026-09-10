import { Platform } from 'react-native';

import { BorderColors, NeutralColors } from './colors';

const createShadow = (
	color: string,
	offsetHeight: number,
	opacity: number,
	radius: number,
	elevation: number,
) => {
	if (Platform.OS === 'web') {
		const r = parseInt(color.slice(1, 3), 16);
		const g = parseInt(color.slice(3, 5), 16);
		const b = parseInt(color.slice(5, 7), 16);

		return {
			boxShadow: `0px ${offsetHeight}px ${radius}px rgba(${r}, ${g}, ${b}, ${opacity})`,
		};
	}

	return {
		shadowColor: color,
		shadowOffset: `0px ${offsetHeight}px`,
		shadowOpacity: `${opacity}`,
		shadowRadius: `${radius}px`,
		elevation: `${elevation}`,
	};
};

export const Shadows = {
	Card: createShadow(BorderColors.Default, 8, 0.26, 15, 6),
	Subtle: createShadow(NeutralColors.Black, 4, 0.08, 12, 3),
};
