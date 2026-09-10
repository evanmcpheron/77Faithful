import { Image, type ImageSource } from 'expo-image';
import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { NeutralColors, SurfaceColors } from '@td/theme/colors';

const HEADER_PHOTOS: readonly (ImageSource | number)[] = [
	require('@td/assets/images/headers/header-1.jpg'),
	require('@td/assets/images/headers/header-2.jpg'),
	require('@td/assets/images/headers/header-3.jpg'),
	require('@td/assets/images/headers/header-4.jpg'),
	require('@td/assets/images/headers/header-5.jpg'),
];

// Select once for this app session, so navigation and remounts keep the same photo.
const sessionPhoto =
	HEADER_PHOTOS[Math.floor(Math.random() * HEADER_PHOTOS.length)];

// The selection never changes during a session, so no update subscription is needed.
const subscribeToSessionPhoto = () => () => {};

export const AuthHeaderBackground = () => {
	const [hasImageError, setHasImageError] = useState(false);
	// Use the solid-color fallback during static web rendering and hydration.
	const photo = useSyncExternalStore(
		subscribeToSessionPhoto,
		() => sessionPhoto ?? null,
		() => null,
	);

	return (
		<View
			style={styles.background}
			pointerEvents='none'
			accessible={false}
			accessibilityElementsHidden
			importantForAccessibility='no-hide-descendants'
		>
			{!hasImageError && photo !== null && (
				<Image
					source={photo}
					style={StyleSheet.absoluteFill}
					contentFit='cover'
					contentPosition='center'
					accessible={false}
					onError={() => setHasImageError(true)}
				/>
			)}
			<View style={styles.overlay} />
		</View>
	);
};

const styles = StyleSheet.create({
	background: {
		...StyleSheet.absoluteFill,
		backgroundColor: SurfaceColors.Header,
	},
	overlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: NeutralColors.Black,
		opacity: 0.62,
	},
});
