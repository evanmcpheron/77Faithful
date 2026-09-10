import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated } from 'react-native';

import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

import { IconStrokeWidths } from '@td/theme/icon-sizes';
import {
	TypographySize,
	TypographyTone,
	TypographyWeight,
} from '@td/theme/typography';
import { Months } from '@td/types/date.types';
import { ComponentTone, TextAlign } from '@td/types/ui.types';
import {
	addWeeks,
	getWeekDays,
	startOfWeek,
	subtractWeeks,
} from '@td/utils/object/date.util';

import { Card } from '../../card/card.component';
import { IconButton } from '../../icon-button/icon-button.component';
import { IconButtonVariant } from '../../icon-button/icon-button.types';
import { IconName } from '../../icon/icon.types';
import { Typography } from '../../typography/typography.component';
import {
	StyledDateCell,
	StyledDayCell,
	StyledDayPressable,
	StyledDaysRow,
	StyledHeaderRow,
} from './calendar-week.styles';
import type {
	ICalendarWeekDayProps,
	ICalendarWeekProps,
} from './calendar-week.types';

dayjs.extend(weekOfYear);

const PressedAnimationValue = 1;
const RestingAnimationValue = 0;
const SelectedAnimationValue = 1;

const PressInSpringConfig = {
	toValue: PressedAnimationValue,
	useNativeDriver: true,
	stiffness: 420,
	damping: 28,
	mass: 0.7,
};

const PressOutSpringConfig = {
	toValue: RestingAnimationValue,
	useNativeDriver: true,
	stiffness: 520,
	damping: 14,
	mass: 0.55,
};

const SelectedSpringConfig = {
	useNativeDriver: true,
	stiffness: 380,
	damping: 18,
	mass: 0.75,
};

const runTactilePressAnimation = (pressAnimation: Animated.Value) => {
	pressAnimation.stopAnimation();

	Animated.sequence([
		Animated.spring(pressAnimation, PressInSpringConfig),
		Animated.spring(pressAnimation, PressOutSpringConfig),
	]).start();
};

const CalendarWeekDay = ({
	day,
	isSelected,
	onSelect,
}: ICalendarWeekDayProps) => {
	const [pressAnimation] = useState(
		() => new Animated.Value(RestingAnimationValue),
	);
	const [selectedAnimation] = useState(
		() =>
			new Animated.Value(
				isSelected ? SelectedAnimationValue : RestingAnimationValue,
			),
	);

	useEffect(() => {
		const selectedSpring = Animated.spring(selectedAnimation, {
			...SelectedSpringConfig,
			toValue: isSelected
				? SelectedAnimationValue
				: RestingAnimationValue,
		});

		selectedSpring.start();

		return () => selectedSpring.stop();
	}, [isSelected, selectedAnimation]);

	const handlePressIn = useCallback(() => {
		pressAnimation.stopAnimation();
		Animated.spring(pressAnimation, PressInSpringConfig).start();
	}, [pressAnimation]);

	const handlePressOut = useCallback(() => {
		pressAnimation.stopAnimation();
		Animated.spring(pressAnimation, PressOutSpringConfig).start();
	}, [pressAnimation]);

	const handlePress = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onSelect(day);
	}, [day, onSelect]);

	const dayAnimatedStyle = useMemo(
		() => ({
			transform: [
				{
					scale: selectedAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							SelectedAnimationValue,
						],
						outputRange: [1, 1.035],
					}),
				},
				{
					scale: pressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [1, 0.94],
					}),
				},
				{
					translateY: pressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [0, 2],
					}),
				},
			],
		}),
		[pressAnimation, selectedAnimation],
	);

	console.log(isSelected);
	return (
		<StyledDayPressable
			accessibilityLabel={`Select ${dayjs(day).format('dddd, MMMM D')}`}
			accessibilityRole='button'
			accessibilityState={{ selected: isSelected }}
			onPress={handlePress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
		>
			<Animated.View style={dayAnimatedStyle}>
				<StyledDayCell selected={isSelected}>
					<Typography
						size={TypographySize.Body2}
						{...(isSelected && {
							tone: TypographyTone.Inverse,
						})}
						align={TextAlign.Center}
						weight={
							isSelected
								? TypographyWeight.Bold
								: TypographyWeight.Semibold
						}
					>
						{dayjs(day).format('dd')}
					</Typography>
					<StyledDateCell selected={isSelected}>
						<Typography
							size={TypographySize.Body2}
							{...(isSelected && {
								variant: TypographyTone.Brand,
							})}
							align={TextAlign.Center}
							weight={TypographyWeight.Bold}
						>
							{day.getDate()}
						</Typography>
					</StyledDateCell>
				</StyledDayCell>
			</Animated.View>
		</StyledDayPressable>
	);
};

export const CalendarWeek = ({}: ICalendarWeekProps) => {
	const [previousWeekPressAnimation] = useState(
		() => new Animated.Value(RestingAnimationValue),
	);
	const [nextWeekPressAnimation] = useState(
		() => new Animated.Value(RestingAnimationValue),
	);
	const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const days = useMemo(() => getWeekDays(anchor), [anchor]);

	const handlePrevWeek = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		runTactilePressAnimation(previousWeekPressAnimation);
		setAnchor((currentAnchor) => subtractWeeks(currentAnchor, 1));
	}, [previousWeekPressAnimation]);

	const handleNextWeek = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		runTactilePressAnimation(nextWeekPressAnimation);
		setAnchor((currentAnchor) => addWeeks(currentAnchor, 1));
	}, [nextWeekPressAnimation]);

	const handleSelectDate = useCallback((day: Date) => {
		setSelectedDate(day);
	}, []);

	const previousWeekAnimatedStyle = useMemo(
		() => ({
			transform: [
				{
					scale: previousWeekPressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [1, 0.92],
					}),
				},
				{
					translateY: previousWeekPressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [0, 2],
					}),
				},
			],
		}),
		[previousWeekPressAnimation],
	);

	const nextWeekAnimatedStyle = useMemo(
		() => ({
			transform: [
				{
					scale: nextWeekPressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [1, 0.92],
					}),
				},
				{
					translateY: nextWeekPressAnimation.interpolate({
						inputRange: [
							RestingAnimationValue,
							PressedAnimationValue,
						],
						outputRange: [0, 2],
					}),
				},
			],
		}),
		[nextWeekPressAnimation],
	);

	const monthLabel = Months[dayjs(anchor).month()];

	return (
		<Card>
			<StyledHeaderRow>
				<Animated.View style={previousWeekAnimatedStyle}>
					<IconButton
						hasBackground
						accessibilityLabel='Go to previous week'
						name={IconName.ArrowLeft}
						onPress={handlePrevWeek}
						strokeWidth={IconStrokeWidths.Thin}
						variant={IconButtonVariant.Soft}
					/>
				</Animated.View>
				<Typography
					size={TypographySize.H1}
					weight={TypographyWeight.Bold}
				>
					{monthLabel}
				</Typography>
				<Animated.View style={nextWeekAnimatedStyle}>
					<IconButton
						hasBackground
						accessibilityLabel='Go to next week'
						name={IconName.ArrowRight}
						onPress={handleNextWeek}
						strokeWidth={IconStrokeWidths.Thin}
						tone={ComponentTone.Neutral}
					/>
				</Animated.View>
			</StyledHeaderRow>
			<StyledDaysRow>
				{days.map((day: Date) => {
					const isSelected = dayjs(day).isSame(selectedDate, 'day');

					return (
						<CalendarWeekDay
							key={day.toISOString()}
							day={day}
							isSelected={isSelected}
							onSelect={handleSelectDate}
						/>
					);
				})}
			</StyledDaysRow>
		</Card>
	);
};
