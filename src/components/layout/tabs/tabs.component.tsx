import type { FC, ReactElement } from 'react';
import {
	Children,
	isValidElement,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, Easing } from 'react-native';

import * as Haptics from 'expo-haptics';

import { Card } from '@td/components/ui/card/card.component';
import {
	StyledTabsActiveThumb,
	StyledTabsContainer,
	StyledTabsItemPressable,
	StyledTabsLabel,
	StyledTabsTrackContainer,
	tabsConstants,
} from './tabs.styles';
import type { ITabItemProps, ITabsProps } from './tabs.types';

type TTabsComponent = FC<ITabsProps> & {
	Item: FC<ITabItemProps>;
};

const TabsItem = ({ children }: ITabItemProps) => <>{children}</>;

const TabsRoot = ({ children, defaultIndex = 0, onPress }: ITabsProps) => {
	const tabs = useMemo(
		() =>
			Children.toArray(children).filter(
				(child): child is ReactElement<ITabItemProps> =>
					isValidElement<ITabItemProps>(child) &&
					child.type === TabsItem,
			),
		[children],
	);

	const safeDefaultIndex = Math.min(
		Math.max(defaultIndex, 0),
		Math.max(tabs.length - 1, 0),
	);

	const [selectedIndex, setSelectedIndex] =
		useState<number>(safeDefaultIndex);
	const [tabListWidth, setTabListWidth] = useState(0);

	const activeThumbTranslateX = useRef(new Animated.Value(0)).current;
	const activeThumbScale = useRef(new Animated.Value(1)).current;

	const tabCount = tabs.length;
	const availableWidth = Math.max(
		tabListWidth - tabsConstants.listPadding * 2,
		0,
	);
	const tabWidth = tabCount > 0 ? availableWidth / tabCount : 0;

	useEffect(() => {
		if (selectedIndex >= tabs.length) {
			setSelectedIndex(Math.max(tabs.length - 1, 0));
		}
	}, [selectedIndex, tabs.length]);

	useEffect(() => {
		if (tabWidth === 0) {
			return;
		}

		Animated.parallel([
			Animated.timing(activeThumbTranslateX, {
				toValue: selectedIndex * tabWidth,
				duration: 240,
				easing: Easing.bezier(0.22, 1, 0.36, 1),
				useNativeDriver: true,
			}),
			Animated.sequence([
				Animated.timing(activeThumbScale, {
					toValue: 0.985,
					duration: 70,
					useNativeDriver: true,
				}),
				Animated.spring(activeThumbScale, {
					toValue: 1,
					stiffness: 420,
					damping: 22,
					mass: 0.85,
					useNativeDriver: true,
				}),
			]),
		]).start();
	}, [activeThumbScale, activeThumbTranslateX, selectedIndex, tabWidth]);

	const handleTabListLayout = (event: LayoutChangeEvent) => {
		setTabListWidth(event.nativeEvent.layout.width);
	};

	const handleTabPress = async (index: number) => {
		const tab = tabs[index];

		if (!tab || index === selectedIndex) {
			return;
		}

		setSelectedIndex(index);
		onPress?.(index);
		tab.props.onPress?.(index);

		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch {
			// Ignore when haptics are unavailable.
		}
	};

	if (tabs.length === 0) {
		return null;
	}

	const activeTab = tabs[selectedIndex];

	return (
		<StyledTabsContainer>
			<StyledTabsTrackContainer onLayout={handleTabListLayout}>
				{tabWidth > 0 ? (
					<StyledTabsActiveThumb
						pointerEvents='none'
						style={{
							width: tabWidth,
							transform: [
								{ translateX: activeThumbTranslateX },
								{ scale: activeThumbScale },
							],
						}}
					/>
				) : null}

				{tabs.map((tab, index) => {
					const { label, disabled, testID } = tab.props;
					const isActive = index === selectedIndex;

					return (
						<StyledTabsItemPressable
							key={index}
							accessibilityRole='tab'
							accessibilityState={{
								selected: isActive,
								disabled,
							}}
							disabled={disabled}
							testID={testID}
							onPress={() => handleTabPress(index)}
						>
							<StyledTabsLabel isActive={isActive}>
								{label}
							</StyledTabsLabel>
						</StyledTabsItemPressable>
					);
				})}
			</StyledTabsTrackContainer>
			<Card>{activeTab.props.children}</Card>
		</StyledTabsContainer>
	);
};

TabsItem.displayName = 'Tabs.Item';

export const Tabs = Object.assign(TabsRoot, {
	Item: TabsItem,
}) as TTabsComponent;
