import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
	runOnJS,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { Typography } from '@td/components/ui/typography/typography.component';

import {
	StyledNotificationCard,
	StyledNotificationCloseButton,
	StyledNotificationRow,
	StyledNotificationTextContainer,
	StyledNotificationWrapper,
} from './notification.styles';
import type { INotificationProps } from './notification.types';
import {
	NOTIFICATION_IN_DURATION,
	NOTIFICATION_OUT_DURATION,
	NOTIFICATION_SCREEN,
} from './notification.types';

export const Notification = ({
	visible,
	title = 'Notice',
	message = '',
	onClose,
	duration = 4000,
	type = 'Info',
}: INotificationProps) => {
	const [mounted, setMounted] = useState(visible);
	const [previousVisible, setPreviousVisible] = useState(visible);
	if (previousVisible !== visible) {
		setPreviousVisible(visible);
		if (visible) {
			setMounted(true);
		}
	}

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const baseOffset = useSharedValue(-60);
	const dragOffset = useSharedValue(0);

	const dismiss = useCallback(
		(animate = true) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}

			const done = () => {
				setMounted(false);
				onClose?.();
			};

			dragOffset.set(0);

			if (animate) {
				baseOffset.set(
					withTiming(
						-80,
						{ duration: NOTIFICATION_OUT_DURATION },
						() => runOnJS(done)(),
					),
				);
			} else {
				baseOffset.set(-80);
				done();
			}
		},
		[baseOffset, dragOffset, onClose],
	);

	useEffect(() => {
		if (visible) {
			dragOffset.set(0);
			baseOffset.set(-60);
			baseOffset.set(
				withTiming(0, {
					duration: NOTIFICATION_IN_DURATION,
				}),
			);

			if (duration > 0) {
				if (timerRef.current) clearTimeout(timerRef.current);
				timerRef.current = setTimeout(() => dismiss(), duration);
			}
		} else if (mounted) {
			dismiss(true);
		}

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [visible]);

	const translateY = useDerivedValue(
		() => baseOffset.value + dragOffset.value,
	);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
		opacity: 1 - Math.min(Math.abs(dragOffset.value) / 120, 0.3),
	}));

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			if (e.translationY < 0) {
				dragOffset.set(e.translationY);
			} else {
				dragOffset.set(0);
			}
		})
		// Gesture Handler invokes this callback after render on the UI thread.
		// eslint-disable-next-line react-hooks/refs -- runOnJS defers dismiss and its timer-ref access to the JS thread.
		.onEnd((e) => {
			const THRESHOLD = -60;
			const FAST_VELOCITY = -900;

			if (e.translationY < THRESHOLD || e.velocityY < FAST_VELOCITY) {
				dragOffset.set(
					withTiming(
						-NOTIFICATION_SCREEN.height,
						{ duration: 160 },
						() => runOnJS(dismiss)(false),
					),
				);
			} else {
				dragOffset.set(
					withSpring(0, {
						damping: 18,
						stiffness: 180,
					}),
				);
			}
		});

	if (!mounted) return null;

	return (
		<StyledNotificationWrapper
			pointerEvents='box-none'
			style={StyleSheet.absoluteFill}
		>
			<GestureDetector gesture={pan}>
				<StyledNotificationCard
					type={type}
					style={animatedStyle}
				>
					<StyledNotificationRow>
						<StyledNotificationTextContainer>
							{title ? (
								<Typography
									tone='Inverse'
									weight='Bold'
								>
									{title}
								</Typography>
							) : null}
							{message ? (
								<Typography tone='Inverse'>
									{message}
								</Typography>
							) : null}
						</StyledNotificationTextContainer>
						<StyledNotificationCloseButton
							accessibilityRole='button'
							accessibilityLabel='Dismiss notification'
							onPress={() => dismiss()}
						>
							×
						</StyledNotificationCloseButton>
					</StyledNotificationRow>
				</StyledNotificationCard>
			</GestureDetector>
		</StyledNotificationWrapper>
	);
};
