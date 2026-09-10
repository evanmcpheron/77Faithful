import React from 'react';
import {
	StyleProp,
	type ImageStyle,
	type TextStyle,
	type ViewStyle,
} from 'react-native';

export interface RNProperties {
	style?: StyleProp<ViewStyle | TextStyle | ImageStyle>;
	testID?: string;
}

// Props that are valid on RN's common primitives
// (View, Text, TextInput, Image, Pressable, TouchableOpacity, ScrollView).
// Keep this the single source of truth — add to it as new primitives are used.
const standardRNProps: Set<string> = new Set([
	// Core / layout
	'style',
	'testID',
	'nativeID',
	'children',
	'key',
	'ref',
	'pointerEvents',
	'hitSlop',
	'collapsable',
	'removeClippedSubviews',
	'needsOffscreenAlphaCompositing',
	'renderToHardwareTextureAndroid',
	'shouldRasterizeIOS',
	'onLayout',

	// Accessibility
	'accessible',
	'accessibilityLabel',
	'accessibilityHint',
	'accessibilityRole',
	'accessibilityState',
	'accessibilityValue',
	'accessibilityActions',
	'accessibilityLiveRegion',
	'accessibilityElementsHidden',
	'accessibilityViewIsModal',
	'accessibilityIgnoresInvertColors',
	'importantForAccessibility',
	'onAccessibilityTap',
	'onAccessibilityAction',
	'onAccessibilityEscape',
	'onMagicTap',
	'role',

	// Press / touch (Pressable & Touchable*)
	'onPress',
	'onPressIn',
	'onPressOut',
	'onLongPress',
	'onHoverIn',
	'onHoverOut',
	'disabled',
	'delayLongPress',
	'delayPressIn',
	'delayPressOut',
	'pressRetentionOffset',
	'android_ripple',
	'android_disableSound',
	'unstable_pressDelay',

	// Responder system
	'onStartShouldSetResponder',
	'onMoveShouldSetResponder',
	'onResponderGrant',
	'onResponderMove',
	'onResponderRelease',
	'onResponderTerminate',
	'onResponderTerminationRequest',
	'onResponderReject',
	'onResponderEnd',
	'onResponderStart',

	// Text
	'numberOfLines',
	'ellipsizeMode',
	'lineBreakMode',
	'selectable',
	'selectionColor',
	'suppressHighlighting',
	'adjustsFontSizeToFit',
	'minimumFontScale',
	'allowFontScaling',
	'maxFontSizeMultiplier',
	'dataDetectorType',

	// TextInput
	'value',
	'defaultValue',
	'placeholder',
	'placeholderTextColor',
	'keyboardType',
	'keyboardAppearance',
	'returnKeyType',
	'inputMode',
	'autoCapitalize',
	'autoCorrect',
	'autoComplete',
	'autoFocus',
	'secureTextEntry',
	'multiline',
	'maxLength',
	'editable',
	'selectTextOnFocus',
	'clearTextOnFocus',
	'clearButtonMode',
	'blurOnSubmit',
	'caretHidden',
	'contextMenuHidden',
	'enablesReturnKeyAutomatically',
	'textContentType',
	'passwordRules',
	'spellCheck',
	'selection',
	'onChange',
	'onChangeText',
	'onSubmitEditing',
	'onEndEditing',
	'onFocus',
	'onBlur',
	'onKeyPress',
	'onSelectionChange',
	'onContentSizeChange',

	// Image
	'source',
	'resizeMode',
	'resizeMethod',
	'fadeDuration',
	'progressiveRenderingEnabled',
	'blurRadius',
	'tintColor',
	'alt',
	'loadingIndicatorSource',
	'defaultSource',
	'onLoadStart',
	'onLoad',
	'onLoadEnd',
	'onError',
	'onProgress',
	'onPartialLoad',

	// Scroll
	'horizontal',
	'scrollEnabled',
	'contentContainerStyle',
	'showsHorizontalScrollIndicator',
	'showsVerticalScrollIndicator',
	'keyboardShouldPersistTaps',
	'keyboardDismissMode',
	'bounces',
	'alwaysBounceHorizontal',
	'alwaysBounceVertical',
	'pagingEnabled',
	'decelerationRate',
	'snapToInterval',
	'snapToAlignment',
	'refreshControl',
	'onScroll',
	'onScrollBeginDrag',
	'onScrollEndDrag',
	'onMomentumScrollBegin',
	'onMomentumScrollEnd',

	// Custom app props you want to keep forwarding
	'groupId',
	'active',
]);

type TFilteredPropName<TProps extends object> = Extract<keyof TProps, string>;

export const withFilteredProps = <
	TBaseProps extends object,
	TStyleProps extends object,
>(
	Component: React.ComponentType<TBaseProps>,
	filteredProps: readonly TFilteredPropName<TStyleProps>[],
) => {
	type TProps = TBaseProps & TStyleProps & { children?: React.ReactNode };

	const filteredPropSet = new Set<string>(filteredProps);

	const FilteredComponent = React.forwardRef<unknown, TProps>(
		({ children, ...props }, ref) => {
			const componentProps: Record<string, unknown> = {
				children,
				ref,
			};

			Object.entries(props).forEach(([propName, propValue]) => {
				if (!filteredPropSet.has(propName)) {
					componentProps[propName] = propValue;
				}
			});

			return React.createElement(
				Component as React.ComponentType<Record<string, unknown>>,
				componentProps,
			);
		},
	);

	FilteredComponent.displayName = `withFilteredProps(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return FilteredComponent;
};

/**
 * Builds a shouldForwardProp predicate for styled-components.
 *
 * A prop is forwarded when it's either a known RN prop (standardRNProps)
 * OR it isn't listed in `customProps` (i.e. it isn't a styling-only prop
 * the caller wants to strip).
 */
export const createShouldForwardProp = <P extends object>(
	customProps: (keyof P)[] | string[] = [],
) => {
	const customPropSet = new Set(customProps as string[]);
	return (prop: string) =>
		standardRNProps.has(prop) || !customPropSet.has(prop);
};

const normalizeHexColor = (hexColor: string): string => {
	const sanitizedHexColor = hexColor.replace('#', '').trim();

	if (![3, 6].includes(sanitizedHexColor.length)) {
		throw new Error(`Invalid hex color: "${hexColor}"`);
	}

	const expandedHexColor =
		sanitizedHexColor.length === 3
			? sanitizedHexColor
					.split('')
					.map((character) => `${character}${character}`)
					.join('')
			: sanitizedHexColor;

	if (!/^[0-9a-fA-F]{6}$/.test(expandedHexColor)) {
		throw new Error(`Invalid hex color: "${hexColor}"`);
	}

	return expandedHexColor;
};

const hexToRgbValues = (
	hexColor: string,
): { red: number; green: number; blue: number } => {
	const normalizedHexColor = normalizeHexColor(hexColor);

	return {
		red: parseInt(normalizedHexColor.slice(0, 2), 16),
		green: parseInt(normalizedHexColor.slice(2, 4), 16),
		blue: parseInt(normalizedHexColor.slice(4, 6), 16),
	};
};

export const hexToRgbString = (hexColor: string): string => {
	const { red, green, blue } = hexToRgbValues(hexColor);

	return `rgb(${red}, ${green}, ${blue})`;
};

export const hexToRgbaString = (hex: string, opacity: number): string => {
	if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
		throw new Error('Hex must be in #RRGGBB format');
	}

	const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
	const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();

	return `${hex}${alphaHex}`;
};
