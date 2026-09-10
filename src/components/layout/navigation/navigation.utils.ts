import { IconName, type TIconName } from '@td/components/ui/icon/icon.types';
import { COMMUNITIES_ENABLED } from '@td/constants/feature-flags.constants';
import {
	ActionColors,
	NeutralColors,
	SurfaceColors,
	TextColors,
} from '@td/theme/colors';

import type { TNavigationTabConfig, TTabMeta } from './navigation.types';

export const BAR_BACKGROUND = SurfaceColors.Screen;
export const ACTIVE_COLOR = ActionColors.PrimaryBackground;
export const INACTIVE_COLOR = TextColors.Primary;
export const ACTIVE_ICON_COLOR = TextColors.Inverse;

export const OUTER_HORIZONTAL_PADDING = 0;
export const BAR_HEIGHT = 94;
export const BAR_CORNER_RADIUS = 26;

export const DOME_RISE = 45;
export const DOME_HALF_WIDTH = 90;
export const DOME_MIN_REACH = 70;
export const BEZIER_TANGENT_FACTOR = 0.5;

export const SVG_OVERHANG = 52;
export const SVG_TOTAL_HEIGHT = SVG_OVERHANG + BAR_HEIGHT;

export const CIRCLE_SIZE = 70;
export const CIRCLE_ICON_SIZE = 'Medium';
export const CIRCLE_CENTER_OFFSET_ABOVE_BAR_TOP = 0;
export const CIRCLE_ABSOLUTE_TOP =
	SVG_OVERHANG - CIRCLE_CENTER_OFFSET_ABOVE_BAR_TOP - CIRCLE_SIZE / 2;

export const INACTIVE_ICON_SIZE = 24;
export const INACTIVE_LABEL_FONT_SIZE = 13;

export const POSITION_SPRING = {
	damping: 15,
	stiffness: 300,
	mass: 0.8,
	overshootClamping: false,
	restDisplacementThreshold: 0.2,
	restSpeedThreshold: 0.2,
};

export const NAV_HIDE_SPRING = {
	duration: 250,
	dampingRatio: 0.6,
};

export const CIRCLE_TACTILE_PRESS_SCALE = 0.93;
export const CIRCLE_TACTILE_REBOUND_SCALE = 1.02;

export const CIRCLE_TACTILE_PRESS_DURATION = 75;
export const CIRCLE_TACTILE_REBOUND_DURATION = 140;
export const CIRCLE_TACTILE_SETTLE_DURATION = 90;

export const BAR_SHADOW = {
	shadowColor: NeutralColors.Black,
	shadowOffset: { height: 12 },
	shadowOpacity: 0.18,
	shadowRadius: 22,
	elevation: 16,
};

export const CIRCLE_SHADOW = {
	shadowColor: ACTIVE_COLOR,
	shadowOffset: { width: 0, height: 10 },
	shadowOpacity: 0.32,
	shadowRadius: 18,
	elevation: 14,
};

const FILLED_ICON_SUFFIX = 'Filled';

const ICON_NAME_VALUES = Object.values(IconName) as TIconName[];

export const resolveInactiveIconName = (iconName: TIconName): TIconName => {
	if (!iconName.endsWith(FILLED_ICON_SUFFIX)) {
		return iconName;
	}

	const inactiveIconName = iconName.slice(
		0,
		-FILLED_ICON_SUFFIX.length,
	) as TIconName;

	if (!ICON_NAME_VALUES.includes(inactiveIconName)) {
		return iconName;
	}

	return inactiveIconName;
};

export const APP_TABS: TNavigationTabConfig[] = [
	{ name: 'today', label: 'Today', icon: IconName.HomeFilled },
	{ name: '(journey)', label: 'Journey', icon: IconName.CalendarFilled },
	{
		name: 'communities',
		label: 'Communities',
		icon: IconName.UsersFilled,
		enabled: COMMUNITIES_ENABLED,
	},
	{ name: 'settings', label: 'Settings', icon: IconName.SettingsFilled },
];

export const getTabRouteNames = (tab: TNavigationTabConfig): string[] => {
	const routeNames = new Set<string>([tab.name]);

	if (tab.routeName) {
		routeNames.add(tab.routeName);
	} else if (!tab.name.endsWith('/index')) {
		routeNames.add(`${tab.name}/index`);
	}

	return [...routeNames];
};

export const findTabConfigByRouteName = (
	tabs: TNavigationTabConfig[],
	routeName: string,
): TNavigationTabConfig | undefined => {
	return tabs.find((tab) => getTabRouteNames(tab).includes(routeName));
};

export const resolveTabMeta = (
	tabs: TNavigationTabConfig[],
	routeName: string,
	explicitTitle?: string,
): TTabMeta => {
	const matchedTab = findTabConfigByRouteName(tabs, routeName);
	const fallback = {
		label: explicitTitle ?? routeName,
		icon: IconName.HomeFilled,
	};

	return {
		label: explicitTitle ?? matchedTab?.label ?? fallback.label,
		icon: matchedTab?.icon ?? fallback.icon,
	};
};

const clamp01 = (value: number): number => {
	'worklet';
	return Math.max(0, Math.min(1, value));
};

const mix = (from: number, to: number, progress: number): number => {
	'worklet';
	return from + (to - from) * progress;
};

/**
 * Builds the full closed path for the bar surface as a single string.
 *
 * The shape is one continuous outline: two cubic Beziers form the dome
 * (rise + fall) joined at the peak with a horizontal tangent, flanked by
 * flat top edges and four rounded corners. All tangents at bezier entries,
 * bezier exits, and corner transitions are horizontal, so there are no
 * visible kinks regardless of peak position.
 *
 * When the peak approaches an edge, the top corner radius on that side
 * shrinks continuously (clamped by DOME_MIN_REACH), which keeps the dome's
 * runway stable and avoids the surface folding into a vertical notch.
 */
export const buildBarPath = (
	barWidth: number,
	peakX: number,
	slotWidth: number,
): string => {
	'worklet';

	const barTopY = SVG_OVERHANG;
	const barBottomY = SVG_OVERHANG + BAR_HEIGHT;
	const domePeakY = barTopY - DOME_RISE;

	const baseCornerRadius = BAR_CORNER_RADIUS;
	const minReach = DOME_MIN_REACH;
	const halfWidth = DOME_HALF_WIDTH;
	const tangent = BEZIER_TANGENT_FACTOR;

	const distanceFromLeft = peakX;
	const distanceFromRight = barWidth - peakX;

	const topLeftRadius = Math.max(
		0,
		Math.min(baseCornerRadius, distanceFromLeft - minReach),
	);
	const topRightRadius = Math.max(
		0,
		Math.min(baseCornerRadius, distanceFromRight - minReach),
	);

	const leftReach = Math.max(
		0,
		Math.min(halfWidth, distanceFromLeft - topLeftRadius),
	);
	const rightReach = Math.max(
		0,
		Math.min(halfWidth, distanceFromRight - topRightRadius),
	);

	const freeDomeStartX = peakX - leftReach;
	const freeDomeEndX = peakX + rightReach;

	const freeRiseControl1X = freeDomeStartX + leftReach * tangent;
	const freeRiseControl2X = peakX - leftReach * tangent;

	const freeFallControl1X = peakX + rightReach * tangent;
	const freeFallControl2X = freeDomeEndX - rightReach * tangent;

	const edgeBlendDistance = slotWidth * 0.8;

	const leftEdgeProgress = clamp01(
		(slotWidth * 1.25 - peakX) / edgeBlendDistance,
	);

	const rightEdgeProgress = clamp01(
		(peakX - (barWidth - slotWidth * 1.25)) / edgeBlendDistance,
	);

	const domeStartX = mix(freeDomeStartX, 0, leftEdgeProgress);
	const domeEndX = mix(freeDomeEndX, barWidth, rightEdgeProgress);

	const riseControl1X = mix(freeRiseControl1X, 0, leftEdgeProgress);
	const riseControl2X = mix(freeRiseControl2X, 0, leftEdgeProgress);

	const fallControl1X = mix(freeFallControl1X, barWidth, rightEdgeProgress);
	const fallControl2X = mix(freeFallControl2X, barWidth, rightEdgeProgress);

	let path = `M ${topLeftRadius} ${barTopY}`;

	if (domeStartX > topLeftRadius + 0.01) {
		path += ` L ${domeStartX} ${barTopY}`;
	}

	path += ` C ${riseControl1X} ${barTopY}, ${riseControl2X} ${domePeakY}, ${peakX} ${domePeakY}`;
	path += ` C ${fallControl1X} ${domePeakY}, ${fallControl2X} ${barTopY}, ${domeEndX} ${barTopY}`;

	if (domeEndX < barWidth - topRightRadius - 0.01) {
		path += ` L ${barWidth - topRightRadius} ${barTopY}`;
	}

	if (topRightRadius > 0) {
		path +=
			` A ${topRightRadius} ${topRightRadius} 0 0 1` +
			` ${barWidth} ${barTopY + topRightRadius}`;
	}

	path += ` L ${barWidth} ${barBottomY - baseCornerRadius}`;
	path +=
		` A ${baseCornerRadius} ${baseCornerRadius} 0 0 1` +
		` ${barWidth - baseCornerRadius} ${barBottomY}`;

	path += ` L ${baseCornerRadius} ${barBottomY}`;
	path +=
		` A ${baseCornerRadius} ${baseCornerRadius} 0 0 1` +
		` 0 ${barBottomY - baseCornerRadius}`;

	path += ` L 0 ${barTopY + topLeftRadius}`;

	if (topLeftRadius > 0) {
		path +=
			` A ${topLeftRadius} ${topLeftRadius} 0 0 1` +
			` ${topLeftRadius} ${barTopY}`;
	}

	path += ' Z';

	return path;
};
