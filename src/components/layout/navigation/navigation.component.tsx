import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { getFocusedRouteNameFromRoute } from 'expo-router/react-navigation';
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	interpolateColor,
	runOnJS,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import Svg, {
	Defs,
	FeBlend,
	FeColorMatrix,
	FeGaussianBlur,
	FeOffset,
	Filter,
	Path,
} from 'react-native-svg';

import { AppIcon } from '@td/components/ui/icon/icon.component';

import {
	StyledNavigationActiveCircle,
	StyledNavigationBarFrame,
	StyledNavigationOuterContainer,
	StyledNavigationShadowLayer,
	StyledNavigationTabButton,
	StyledNavigationTabIconArea,
	StyledNavigationTabLabel,
	StyledNavigationTabsRow,
	StyledNavigationVisualLayer,
} from './navigation.styles';
import type { ITabButtonProps, ITabsLayoutProps } from './navigation.types';
import {
	ACTIVE_COLOR,
	ACTIVE_ICON_COLOR,
	BAR_BACKGROUND,
	buildBarPath,
	CIRCLE_SHADOW,
	CIRCLE_SIZE,
	CIRCLE_TACTILE_PRESS_DURATION,
	CIRCLE_TACTILE_PRESS_SCALE,
	CIRCLE_TACTILE_REBOUND_DURATION,
	CIRCLE_TACTILE_REBOUND_SCALE,
	CIRCLE_TACTILE_SETTLE_DURATION,
	getTabRouteNames,
	INACTIVE_COLOR,
	INACTIVE_ICON_SIZE,
	NAV_HIDE_SPRING,
	OUTER_HORIZONTAL_PADDING,
	POSITION_SPRING,
	resolveInactiveIconName,
	resolveTabMeta,
	SVG_TOTAL_HEIGHT,
} from './navigation.utils';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type TNavigationAnimationState = 'visible' | 'hiding' | 'hidden' | 'showing';

const TabButton: FC<ITabButtonProps> = ({
	label,
	icon,
	focused,
	onPress,
	onLongPress,
	onPressIn,
	onPressOut,
}) => {
	const focusProgress = useSharedValue(focused ? 1 : 0);

	useEffect(() => {
		focusProgress.value = withTiming(focused ? 1 : 0, {
			duration: 220,
			easing: Easing.out(Easing.cubic),
		});
	}, [focused, focusProgress]);

	const iconStyle = useAnimatedStyle(() => {
		return {
			opacity: interpolate(focusProgress.value, [0, 1], [1, 0]),
			transform: [
				{
					translateY: interpolate(
						focusProgress.value,
						[0, 1],
						[0, 6],
					),
				},
				{ scale: interpolate(focusProgress.value, [0, 1], [1, 0.9]) },
			],
		};
	});

	const labelStyle = useAnimatedStyle(() => {
		return {
			color: interpolateColor(
				focusProgress.value,
				[0, 1],
				[INACTIVE_COLOR, ACTIVE_COLOR],
			),
			transform: [
				{
					translateY: interpolate(
						focusProgress.value,
						[0, 1],
						[0, -1],
					),
				},
			],
		};
	});

	const labelWeight = focused ? '700' : '600';

	return (
		<StyledNavigationTabButton
			onPress={onPress}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}
			android_ripple={{ color: 'transparent' }}
		>
			<StyledNavigationTabIconArea>
				<Animated.View style={iconStyle}>
					<AppIcon
						name={icon}
						size={INACTIVE_ICON_SIZE}
						color={INACTIVE_COLOR}
					/>
				</Animated.View>
			</StyledNavigationTabIconArea>

			<StyledNavigationTabLabel
				numberOfLines={1}
				style={[{ fontWeight: labelWeight }, labelStyle]}
			>
				{label}
			</StyledNavigationTabLabel>
		</StyledNavigationTabButton>
	);
};

type TCustomTabBarProps = BottomTabBarProps & ITabsLayoutProps;

const CustomTabBar: FC<TCustomTabBarProps> = ({
	state,
	descriptors,
	navigation,
	tabs,
}) => {
	const { width: windowWidth } = useWindowDimensions();

	const fallbackBarWidth = Math.max(
		280,
		windowWidth - OUTER_HORIZONTAL_PADDING * 2,
	);

	const [measuredBarWidth, setMeasuredBarWidth] = useState(fallbackBarWidth);

	const orderedRoutes = useMemo(() => {
		return tabs
			.map((tab) => {
				return state.routes.find((route) => {
					return getTabRouteNames(tab).includes(route.name);
				});
			})
			.filter((route): route is (typeof state.routes)[number] =>
				Boolean(route),
			);
	}, [state.routes, tabs]);

	const orderedActiveIndex = useMemo(() => {
		const activeRoute = state.routes[state.index];
		const activeIndex = orderedRoutes.findIndex(
			(route) => route.key === activeRoute.key,
		);

		return Math.max(0, activeIndex);
	}, [orderedRoutes, state.index, state.routes]);

	const routeCount = orderedRoutes.length;
	const safeRouteCount = Math.max(routeCount, 1);
	const slotWidth = measuredBarWidth / safeRouteCount;

	const animatedIndex = useSharedValue(orderedActiveIndex);
	const circleSelectionScale = useSharedValue(1);
	const circlePressScale = useSharedValue(1);
	const barWidthShared = useSharedValue(fallbackBarWidth);
	const slotWidthShared = useSharedValue(fallbackBarWidth / safeRouteCount);

	const focusedTabRoute = state.routes[state.index];
	const focusedNestedRouteName = focusedTabRoute
		? getFocusedRouteNameFromRoute(focusedTabRoute)
		: undefined;

	const routeIsOnNestedScreen = Boolean(
		focusedNestedRouteName &&
		focusedNestedRouteName !== 'index' &&
		focusedNestedRouteName !==
			focusedTabRoute?.name.replace(/^\((.+)\)$/, '$1'),
	);

	const [styledIsOnNestedScreen, setStyledIsOnNestedScreen] = useState(
		routeIsOnNestedScreen,
	);

	const [navigationAnimationState, setNavigationAnimationState] =
		useState<TNavigationAnimationState>(
			routeIsOnNestedScreen ? 'hidden' : 'visible',
		);

	const hideProgress = useSharedValue(routeIsOnNestedScreen ? 1 : 0);
	const hasMountedRef = useRef(false);

	const completeHideAnimation = useCallback(() => {
		setNavigationAnimationState('hidden');
	}, []);

	const completeShowAnimation = useCallback(() => {
		setStyledIsOnNestedScreen(false);
		setNavigationAnimationState('visible');
	}, []);

	useEffect(() => {
		const target = routeIsOnNestedScreen ? 1 : 0;

		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			hideProgress.value = target;
			setStyledIsOnNestedScreen(routeIsOnNestedScreen);
			setNavigationAnimationState(
				routeIsOnNestedScreen ? 'hidden' : 'visible',
			);
			return;
		}

		cancelAnimation(hideProgress);

		if (routeIsOnNestedScreen) {
			setStyledIsOnNestedScreen(true);
			setNavigationAnimationState('hiding');
			return;
		}

		setNavigationAnimationState('showing');

		hideProgress.value = withSpring(0, NAV_HIDE_SPRING, (finished) => {
			if (!finished) {
				return;
			}

			runOnJS(completeShowAnimation)();
		});
	}, [completeShowAnimation, hideProgress, routeIsOnNestedScreen]);

	useEffect(() => {
		if (
			!routeIsOnNestedScreen ||
			!styledIsOnNestedScreen ||
			navigationAnimationState !== 'hiding'
		) {
			return;
		}

		hideProgress.value = withSpring(1, NAV_HIDE_SPRING, (finished) => {
			if (!finished) {
				return;
			}

			runOnJS(completeHideAnimation)();
		});
	}, [
		completeHideAnimation,
		hideProgress,
		navigationAnimationState,
		routeIsOnNestedScreen,
		styledIsOnNestedScreen,
	]);

	useEffect(() => {
		barWidthShared.value = measuredBarWidth;
		slotWidthShared.value = slotWidth;
	}, [barWidthShared, measuredBarWidth, slotWidth, slotWidthShared]);

	useEffect(() => {
		animatedIndex.value = withSpring(orderedActiveIndex, POSITION_SPRING);

		cancelAnimation(circleSelectionScale);
		circleSelectionScale.value = 1;
		circleSelectionScale.value = withSequence(
			withTiming(CIRCLE_TACTILE_PRESS_SCALE, {
				duration: CIRCLE_TACTILE_PRESS_DURATION,
				easing: Easing.out(Easing.quad),
			}),
			withTiming(CIRCLE_TACTILE_REBOUND_SCALE, {
				duration: CIRCLE_TACTILE_REBOUND_DURATION,
				easing: Easing.out(Easing.cubic),
			}),
			withTiming(1, {
				duration: CIRCLE_TACTILE_SETTLE_DURATION,
				easing: Easing.out(Easing.cubic),
			}),
		);
	}, [animatedIndex, circleSelectionScale, orderedActiveIndex]);

	const handleCirclePressIn = () => {
		cancelAnimation(circlePressScale);
		circlePressScale.value = withTiming(0.96, {
			duration: 65,
			easing: Easing.out(Easing.quad),
		});
	};

	const handleCirclePressOut = () => {
		cancelAnimation(circlePressScale);
		circlePressScale.value = withSequence(
			withTiming(1.01, {
				duration: 120,
				easing: Easing.out(Easing.cubic),
			}),
			withTiming(1, {
				duration: 90,
				easing: Easing.out(Easing.cubic),
			}),
		);
	};

	const activeTab = useMemo(() => {
		const activeRoute = orderedRoutes[orderedActiveIndex];
		const options = activeRoute
			? descriptors[activeRoute.key]?.options
			: undefined;

		const explicitTitle =
			typeof options?.tabBarLabel === 'string'
				? options.tabBarLabel
				: typeof options?.title === 'string'
					? options.title
					: undefined;

		return resolveTabMeta(tabs, activeRoute?.name ?? '', explicitTitle);
	}, [descriptors, orderedActiveIndex, orderedRoutes, tabs]);

	const peakX = useDerivedValue(() => {
		return (
			slotWidthShared.value * animatedIndex.value +
			slotWidthShared.value / 2
		);
	});

	const animatedPathProps = useAnimatedProps(() => {
		return {
			d: buildBarPath(
				barWidthShared.value,
				peakX.value,
				slotWidthShared.value,
			),
		};
	});

	const activeCircleStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateX: peakX.value - CIRCLE_SIZE / 2 },
				{ scale: circleSelectionScale.value * circlePressScale.value },
			],
		};
	});

	const outerContainerStyle = useAnimatedStyle(() => {
		const slideDistance = SVG_TOTAL_HEIGHT + 96;

		return {
			transform: [
				{
					translateY: interpolate(
						hideProgress.value,
						[0, 1],
						[0, slideDistance],
					),
				},
			],
		};
	});

	const handleBarLayout = (event: LayoutChangeEvent) => {
		const nextWidth = event.nativeEvent.layout.width;

		if (Math.abs(nextWidth - measuredBarWidth) > 0.5) {
			setMeasuredBarWidth(nextWidth);
		}
	};

	return (
		<StyledNavigationOuterContainer
			style={outerContainerStyle}
			isOnNestedScreen={styledIsOnNestedScreen}
			pointerEvents={styledIsOnNestedScreen ? 'none' : 'auto'}
		>
			<StyledNavigationBarFrame onLayout={handleBarLayout}>
				<StyledNavigationVisualLayer
					isOnNestedScreen={styledIsOnNestedScreen}
					pointerEvents='box-none'
				>
					<StyledNavigationShadowLayer pointerEvents='none'>
						<Svg
							width={measuredBarWidth}
							height={SVG_TOTAL_HEIGHT + 32}
							viewBox={`0 0 ${measuredBarWidth} ${SVG_TOTAL_HEIGHT + 32}`}
						>
							<Defs>
								<Filter
									id='barAndDomeShadow'
									x='-10%'
									y='-20%'
									width='120%'
									height='160%'
								>
									<FeOffset
										in='SourceAlpha'
										dx='0'
										dy='6'
										result='offset'
									/>
									<FeGaussianBlur
										in='offset'
										stdDeviation='6'
										result='blur'
									/>
									<FeColorMatrix
										in='blur'
										type='matrix'
										values={`
											0 0 0 0 0
											0 0 0 0 0
											0 0 0 0 0
											0 0 0 0.36 0
										`}
										result='shadow'
									/>
									<FeBlend
										in='SourceGraphic'
										in2='shadow'
										mode='normal'
									/>
								</Filter>
							</Defs>

							<AnimatedPath
								animatedProps={animatedPathProps}
								fill={BAR_BACKGROUND}
								filter='url(#barAndDomeShadow)'
							/>
						</Svg>
					</StyledNavigationShadowLayer>

					<StyledNavigationActiveCircle
						pointerEvents='none'
						style={[CIRCLE_SHADOW, activeCircleStyle]}
					>
						<AppIcon
							name={activeTab.icon}
							color={ACTIVE_ICON_COLOR}
						/>
					</StyledNavigationActiveCircle>

					<StyledNavigationTabsRow>
						{orderedRoutes.map((route, index) => {
							const isFocused = orderedActiveIndex === index;
							const options = descriptors[route.key]?.options;

							const explicitTitle =
								typeof options?.tabBarLabel === 'string'
									? options.tabBarLabel
									: typeof options?.title === 'string'
										? options.title
										: undefined;

							const meta = resolveTabMeta(
								tabs,
								route.name,
								explicitTitle,
							);

							const onPress = () => {
								const event = navigation.emit({
									type: 'tabPress',
									target: route.key,
									canPreventDefault: true,
								});

								if (event.defaultPrevented) {
									return;
								}

								if (isFocused) {
									void Haptics.selectionAsync().catch(
										() => undefined,
									);
									return;
								}

								void Haptics.impactAsync(
									Haptics.ImpactFeedbackStyle.Light,
								).catch(() => undefined);

								navigation.navigate(route.name as never);
							};

							const onLongPress = () => {
								navigation.emit({
									type: 'tabLongPress',
									target: route.key,
								});
							};

							return (
								<TabButton
									key={route.key}
									label={meta.label}
									icon={resolveInactiveIconName(meta.icon)}
									focused={isFocused}
									onPress={onPress}
									onLongPress={onLongPress}
									onPressIn={handleCirclePressIn}
									onPressOut={handleCirclePressOut}
								/>
							);
						})}
					</StyledNavigationTabsRow>
				</StyledNavigationVisualLayer>
			</StyledNavigationBarFrame>
		</StyledNavigationOuterContainer>
	);
};

export const TabsLayout: FC<ITabsLayoutProps> = ({ tabs }) => {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: 'transparent' },
			}}
			tabBar={(props) => (
				<CustomTabBar
					{...props}
					tabs={tabs}
				/>
			)}
		>
			{tabs.map((tab) => (
				<Tabs.Screen
					key={tab.name}
					name={tab.name}
					options={{
						title: tab.title ?? tab.label,
						...tab.options,
					}}
				/>
			))}
		</Tabs>
	);
};
