import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Spacing } from '@td/theme/spacing';
import type { ICommunitySummary } from '@td/types/community/community.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { getCommunity } from '../community-reader.service';
import { createCommunityStyles as styles } from './create-community.styles';

export const CommunityScreen = () => {
	const { communityId } = useLocalSearchParams<{ communityId: string }>();
	const { account } = useAuth();
	return (
		<CommunityDetails
			key={`${account?.userId}:${communityId}`}
			communityId={communityId}
		/>
	);
};
const CommunityDetails = ({ communityId }: { communityId: string }) => {
	const router = useRouter();
	const [community, setCommunity] = useState<ICommunitySummary | null>(null);
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	useFocusEffect(
		useCallback(() => {
			let active = true;
			setFailed(false);
			setCommunity(null);
			void getCommunity(communityId).then(
				(result) => {
					if (active) setCommunity(result);
				},
				() => {
					if (active) setFailed(true);
				},
			);
			return () => {
				active = false;
			};
			// Retry changes intentionally rerun this focused-screen load.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [communityId, attempt]),
	);
	return (
		<TurndownScrollScreen contentPadding={Spacing.Medium}>
			<View style={styles.content}>
				{community ? (
					<>
						<View accessibilityRole='header'>
							<Typography
								size='Display'
								weight='Regular'
								style={styles.title}
							>
								{community.name}
							</Typography>
						</View>
						{community.purpose ? (
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{community.purpose}
							</Typography>
						) : null}
						<Card>
							<Typography weight='Semibold'>
								Invite only
							</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{community.organizer.displayName
									? `Organized by ${community.organizer.displayName}`
									: 'Only people you invite can join.'}
							</Typography>
						</Card>
					</>
				) : (
					<View accessibilityLiveRegion='polite'>
						<Typography>
							{failed
								? 'We couldn’t open this community. It may be unavailable, or your access may have changed.'
								: 'Loading your community…'}
						</Typography>
					</View>
				)}
				{failed && (
					<TurndownButton
						onPress={() => setAttempt((value) => value + 1)}
					>
						Try again
					</TurndownButton>
				)}
				<TurndownButton
					variant='Outline'
					onPress={() => router.replace('/communities')}
				>
					Your communities
				</TurndownButton>
			</View>
		</TurndownScrollScreen>
	);
};
