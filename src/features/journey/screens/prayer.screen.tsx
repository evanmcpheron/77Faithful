import ChevronIcon from '@td/assets/icons/prayer/chevron.svg';
import HeartIcon from '@td/assets/icons/prayer/heart.svg';
import LeafIcon from '@td/assets/icons/prayer/leaf.svg';
import RestIcon from '@td/assets/icons/prayer/rest.svg';
import XIcon from '@td/assets/icons/prayer/x.svg';
import UsersIcon from '@td/assets/icons/regular/users.svg';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { StyledActionRow } from '@td/components/ui/action-row/action-row.styles';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { StyledIconButton } from '@td/components/ui/icon-button/icon-button.styles';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors, TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import { FoundationalPracticeId } from '@td/types/formation/practice.types';
import { PracticeCompletionStatus } from '@td/types/journey/journey-day.types';
import { useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { Modal } from 'react-native';
import { parsePracticeRoute } from '../journey-practice-route';
import { useJourneyPractice } from '../use-journey-practice.hook';
import { prayerPrompts } from './prayer-prompts';
import {
	IconCircle,
	ModalBackdrop,
	ModalBody,
	ModalCard,
	ModalHeader,
	ModalRoot,
	PrayerBanner,
	prayerBodyStyle,
	PrayerColumn,
	PrayerIntro,
	prayerTitleStyle,
	PromptList,
	PromptText,
	promptTitleStyle,
} from './prayer.styles';

// Metro resolves bundled images through a static require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const prayerBanner: number = require('@td/assets/images/prayer-olive-branch.png');
const promptIcons = [HeartIcon, LeafIcon, UsersIcon, RestIcon];

const PrayerPrompts = () => {
	const [selected, setSelected] = useState<
		(typeof prayerPrompts)[number] | null
	>(null);
	const close = () => setSelected(null);
	return (
		<>
			<PromptList>
				{prayerPrompts.map((prompt, index) => {
					const Icon = promptIcons[index];
					return (
						<StyledActionRow
							key={prompt.title}
							variant='Muted'
							tone='Brand'
							disabled={false}
							accessibilityRole='button'
							accessibilityLabel={`${prompt.title}. ${prompt.subtitle}`}
							accessibilityHint='Opens a prayer prompt and prayer'
							onPress={() => setSelected(prompt)}
						>
							<IconCircle>
								{Icon && (
									<Icon
										width={IconSizes.Large}
										height={IconSizes.Large}
										color={TextColors.Brand}
									/>
								)}
							</IconCircle>
							<PromptText>
								<Typography style={promptTitleStyle}>
									{prompt.title}
								</Typography>
								<Typography tone='Secondary'>
									{prompt.subtitle}
								</Typography>
							</PromptText>
							<ChevronIcon
								width={IconSizes.Small}
								height={IconSizes.Small}
								color={TextColors.Brand}
							/>
						</StyledActionRow>
					);
				})}
			</PromptList>
			{selected && (
				<Modal
					transparent
					animationType='fade'
					visible
					onRequestClose={close}
				>
					<ModalRoot>
						<ModalBackdrop
							onPress={close}
							accessible={false}
						/>
						<ModalCard
							accessibilityViewIsModal
							onAccessibilityEscape={close}
						>
							<ModalHeader>
								<PromptText
									accessible
									accessibilityRole='header'
								>
									<Typography
										size='H1'
										style={promptTitleStyle}
									>
										{selected.title}
									</Typography>
								</PromptText>
								<StyledIconButton
									disabled={false}
									variant='Ghost'
									tone='Brand'
									size='Large'
									hasBackground={false}
									accessibilityRole='button'
									accessibilityLabel='Close prayer'
									onPress={close}
								>
									<XIcon
										width={IconSizes.Medium}
										height={IconSizes.Medium}
										color={TextColors.Primary}
									/>
								</StyledIconButton>
							</ModalHeader>
							<ModalBody
								contentContainerStyle={{ gap: Spacing.Medium }}
							>
								<Typography tone='Secondary'>
									{selected.prompt}
								</Typography>
								<Typography style={prayerBodyStyle}>
									{selected.prayer}
								</Typography>
							</ModalBody>
						</ModalCard>
					</ModalRoot>
				</Modal>
			)}
		</>
	);
};

export const PrayerScreen = () => {
	const headerHeight = useHeaderHeight();
	const params = useLocalSearchParams();
	const route = parsePracticeRoute(
		params['journeyId'],
		params['dayNumber'],
		FoundationalPracticeId.Pray,
	);
	const { session, completion, loading, isSaving, error, refresh, complete } =
		useJourneyPractice(route);
	const isComplete = completion?.status === PracticeCompletionStatus.Complete;
	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			safeAreaEdges={['right', 'bottom', 'left']}
			testID='prayer-screen'
		>
			<PrayerColumn style={{ paddingTop: headerHeight }}>
				{!route && (
					<Typography>This practice link isn’t available.</Typography>
				)}
				{route && loading && !session && (
					<Typography>Loading your prayer time…</Typography>
				)}
				{error && (
					<Card>
						<Typography>{error}</Typography>
						<TurndownButton
							disabled={loading || isSaving}
							onPress={() => void refresh()}
						>
							Refresh prayer
						</TurndownButton>
					</Card>
				)}
				{session && (
					<>
						<PrayerBanner
							source={prayerBanner}
							contentFit='cover'
							accessible={false}
						/>
						<PrayerIntro>
							<Typography
								tone='Secondary'
								align='center'
							>
								LET’S PRAY
							</Typography>
							<Typography
								align='center'
								weight='Regular'
								style={prayerTitleStyle}
							>
								Spend a Few Moments with God
							</Typography>
							<Typography
								align='center'
								style={prayerBodyStyle}
							>
								Find a quiet place, take a deep breath, and use
								the prompts below to guide your prayer time.
							</Typography>
						</PrayerIntro>
						<PrayerPrompts
							key={`${session.day.journeyId}-${session.day.dayNumber}`}
						/>
						<TurndownButton
							fullWidth
							size='Large'
							loading={isSaving}
							disabled={
								loading || isSaving || !!error || isComplete
							}
							onPress={() => void complete()}
						>
							{isComplete ? 'Completed' : 'Complete Prayer'}
						</TurndownButton>
					</>
				)}
			</PrayerColumn>
		</TurndownScrollScreen>
	);
};
