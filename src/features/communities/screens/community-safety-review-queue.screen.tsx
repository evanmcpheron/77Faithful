import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICommunitySafetyReportQueueItem } from '@td/types/community/community-moderation.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import {
	hasCommunitySafetyReviewerCapability,
	isSafetyReviewDenied,
	listCommunitySafetyReports,
} from '../community-safety-review.service';

const reasonLabels: Record<ICommunitySafetyReportQueueItem['reason'], string> =
	{
		Harassment: 'Harassment',
		CoerciveReligiousPressure: 'Coercive religious pressure',
		FinancialSolicitation: 'Financial solicitation',
		PrivacyViolation: 'Privacy violation',
		UnsafeMedicalClaims: 'Unsafe medical claims',
		AbuseOfSpiritualAuthority: 'Abuse of spiritual authority',
		Other: 'Other',
	};

export const CommunitySafetyReviewQueueScreen = () => {
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<CommunitySafetyReviewQueueContent
			key={userId ?? 'signed-out'}
			userId={userId}
		/>
	);
};

export const CommunitySafetyReviewQueueContent = ({
	userId,
}: {
	userId: string | null;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const [reports, setReports] = useState<ICommunitySafetyReportQueueItem[]>(
		[],
	);
	const [cursor, setCursor] = useState<string | null>(null);
	const [status, setStatus] = useState<'Loading' | 'Ready' | 'Error'>(
		'Loading',
	);
	const [message, setMessage] = useState<string | null>(null);
	const [busyMode, setBusyMode] = useState<
		'Initial' | 'Refresh' | 'More' | null
	>(null);
	const generation = useRef(0);
	const busy = useRef(false);
	const currentCursor = useRef<string | null>(null);

	const load = useCallback(
		async (mode: 'Initial' | 'Refresh' | 'More') => {
			if (
				!userId ||
				busy.current ||
				(mode === 'More' && !currentCursor.current)
			)
				return;
			busy.current = true;
			const currentGeneration = generation.current;
			const pageCursor = mode === 'More' ? currentCursor.current : null;
			setBusyMode(mode);
			setMessage(null);
			if (mode === 'Initial') {
				setStatus('Loading');
				setReports([]);
				setCursor(null);
				currentCursor.current = null;
			}
			try {
				if (!(await hasCommunitySafetyReviewerCapability(userId))) {
					if (generation.current === currentGeneration) {
						setReports([]);
						setCursor(null);
						currentCursor.current = null;
						router.replace('/settings');
					}
					return;
				}
				const result = await listCommunitySafetyReports({
					pageSize: 20,
					...(pageCursor ? { cursor: pageCursor } : {}),
				});
				if (generation.current !== currentGeneration) return;
				setReports((current) =>
					mode === 'More'
						? [
								...current,
								...result.reports.filter(
									(report) =>
										!current.some(
											(existing) =>
												existing.reportId ===
												report.reportId,
										),
								),
							]
						: result.reports,
				);
				currentCursor.current = result.nextCursor;
				setCursor(result.nextCursor);
				setStatus('Ready');
			} catch (error: unknown) {
				if (generation.current !== currentGeneration) return;
				if (isSafetyReviewDenied(error)) {
					setReports([]);
					setCursor(null);
					currentCursor.current = null;
					router.replace('/settings');
				} else if (mode === 'Initial') setStatus('Error');
				else
					setMessage(
						mode === 'More'
							? 'Could not load more reports. Try again.'
							: 'Could not refresh reports. Try again.',
					);
			} finally {
				if (generation.current === currentGeneration) {
					busy.current = false;
					setBusyMode(null);
				}
			}
		},
		[userId, router],
	);

	useFocusEffect(
		useCallback(() => {
			generation.current += 1;
			busy.current = false;
			void load('Initial');
			return () => {
				generation.current += 1;
				busy.current = false;
				setReports([]);
				setCursor(null);
				currentCursor.current = null;
			};
		}, [load]),
	);

	const header = (
		<View
			style={{
				paddingTop: headerHeight,
				paddingBottom: Spacing.Large,
				gap: Spacing.Small,
			}}
		>
			<View accessibilityRole='header'>
				<Typography size='H1'>Safety reports</Typography>
			</View>
			<Typography tone='Secondary'>
				Restricted platform review queue. Report details and submitted
				evidence are available only in the review workflow.
			</Typography>
			{status === 'Ready' ? (
				<TurndownButton
					variant='Outline'
					disabled={busyMode !== null}
					loading={busyMode === 'Refresh'}
					onPress={() => void load('Refresh')}
					testID='refresh-safety-reports'
				>
					Refresh
				</TurndownButton>
			) : null}
			{message ? (
				<View accessibilityLiveRegion='polite'>
					<Typography>{message}</Typography>
				</View>
			) : null}
			{status === 'Loading' ? (
				<Typography>Loading reports…</Typography>
			) : null}
			{status === 'Error' ? (
				<>
					<Typography>Could not load safety reports.</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => void load('Initial')}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{status === 'Ready' && reports.length === 0 ? (
				<Typography>No reports are waiting for review.</Typography>
			) : null}
		</View>
	);

	return (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			data={reports}
			keyExtractor={(report) => report.reportId}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => (
				<View style={{ height: Spacing.Small }} />
			)}
			renderItem={({ item }) => (
				<Card testID={`safety-report-${item.reportId}`}>
					<View style={{ gap: Spacing.XSmall }}>
						<Typography size='H3'>
							{item.target.targetType} report
						</Typography>
						<Typography>
							Reason: {reasonLabels[item.reason]}
						</Typography>
						<Typography>
							Status:{' '}
							{item.status === 'UnderReview'
								? 'Under review'
								: 'Submitted'}
						</Typography>
						<Typography tone='Secondary'>
							Reported{' '}
							{new Date(
								item.createdAt.seconds * 1000,
							).toLocaleString()}
						</Typography>
					</View>
				</Card>
			)}
			ListFooterComponent={
				status === 'Ready' && cursor ? (
					<TurndownButton
						variant='Outline'
						disabled={busyMode !== null}
						loading={busyMode === 'More'}
						onPress={() => void load('More')}
						testID='load-more-safety-reports'
					>
						Load more
					</TurndownButton>
				) : null
			}
			testID='safety-review-queue-screen'
		/>
	);
};
