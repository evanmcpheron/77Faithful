import LeafIcon from '@td/assets/icons/prayer/leaf.svg';
import BookIcon from '@td/assets/icons/reading/book-open.svg';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { BorderColors, SurfaceColors, TextColors } from '@td/theme/colors';
import { IconSizes } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { View } from 'react-native';
import { reflectionAssets } from '../reflections.assets';
import { useReflections } from '../use-reflections.hook';
import {
	ReflectionAction,
	ReflectionActions,
	ReflectionCircle,
	ReflectionContent,
	ReflectionDivider,
	ReflectionEntryCopy,
	ReflectionEntryRow,
	ReflectionFeatured,
	ReflectionFooter,
	ReflectionFooterBranch,
	ReflectionHeader,
	ReflectionHeadingRow,
	ReflectionHero,
	ReflectionHeroBranch,
	ReflectionQuoteImage,
	ReflectionSection,
	reflectionTextStyles as textStyles,
} from './reflections.styles';

export const ReflectionsScreen = () => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const text = { color: TextColors.Primary };
	const secondary = { color: TextColors.Secondary };
	const surface = { backgroundColor: SurfaceColors.Muted };
	const { entries, error, refresh, hasOlder, hasNewer, older, newer } =
		useReflections();
	const openReflection = (journeyId: string, dayNumber: number) =>
		router.push({
			pathname: '/journeys/[journeyId]/days/[dayNumber]/reflection',
			params: {
				journeyId,
				dayNumber: String(dayNumber),
				returnTo: 'reflections',
			},
		});

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			safeAreaEdges={['left', 'right', 'bottom']}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			keyboardEnabled={false}
			testID='reflections-screen'
		>
			<ReflectionContent style={{ paddingTop: headerHeight }}>
				<ReflectionHeader>
					<Typography
						weight='Regular'
						style={[textStyles.intro, secondary]}
					>
						A place to be honest with God, notice His work, and grow
						over time.
					</Typography>
				</ReflectionHeader>
				<ReflectionHero
					style={surface}
					accessible
					accessibilityLabel='Be still, and know that I am God. Psalm 46:10.'
				>
					<ReflectionQuoteImage
						source={reflectionAssets.quote}
						contentFit='contain'
						accessible={false}
					/>
					<ReflectionHeroBranch
						source={reflectionAssets.heroBranch}
						contentFit='contain'
						accessible={false}
					/>
				</ReflectionHero>
				<ReflectionActions>
					<ReflectionAction>
						<ReflectionCircle style={surface}>
							<AppIcon
								name={IconName.ClipboardPencil}
								size={IconSizes.Large}
								color={TextColors.Primary}
							/>
						</ReflectionCircle>
						<Typography style={[textStyles.label, text]}>
							Write
						</Typography>
						<Typography
							align='center'
							weight='Regular'
							style={[textStyles.support, secondary]}
						>
							Capture what’s on your heart
						</Typography>
					</ReflectionAction>
					<ReflectionAction>
						<ReflectionCircle style={surface}>
							<BookIcon
								width={IconSizes.Large}
								height={IconSizes.Large}
								color={TextColors.Primary}
							/>
						</ReflectionCircle>
						<Typography style={[textStyles.label, text]}>
							Remember
						</Typography>
						<Typography
							align='center'
							weight='Regular'
							style={[textStyles.support, secondary]}
						>
							Look back and see His faithfulness
						</Typography>
					</ReflectionAction>
					<ReflectionAction>
						<ReflectionCircle style={surface}>
							<LeafIcon
								width={IconSizes.Large}
								height={IconSizes.Large}
								color={TextColors.Primary}
							/>
						</ReflectionCircle>
						<Typography style={[textStyles.label, text]}>
							Grow
						</Typography>
						<Typography
							align='center'
							weight='Regular'
							style={[textStyles.support, secondary]}
						>
							Notice patterns and progress
						</Typography>
					</ReflectionAction>
				</ReflectionActions>
				<ReflectionDivider
					style={{ backgroundColor: BorderColors.Subtle }}
				/>
				<ReflectionSection>
					<ReflectionHeadingRow>
						<Typography
							weight='Regular'
							style={[textStyles.heading, text]}
						>
							{hasNewer
								? 'Earlier Reflections'
								: 'Recent Reflections'}
						</Typography>
					</ReflectionHeadingRow>
					{error ? (
						<View accessibilityLiveRegion='polite'>
							<Typography
								weight='Regular'
								style={text}
							>
								We couldn’t load your reflections. Check your
								connection and try again.
							</Typography>
							<TurndownButton
								variant='Outline'
								tone='Brand'
								onPress={() => void refresh()}
							>
								Try again
							</TurndownButton>
						</View>
					) : !entries ? (
						<View
							accessibilityState={{ busy: true }}
							accessibilityLiveRegion='polite'
						>
							<Typography style={secondary}>
								Loading your reflections…
							</Typography>
						</View>
					) : entries.length === 0 ? (
						<ReflectionFooter style={surface}>
							<Typography
								weight='Regular'
								style={[textStyles.label, text]}
							>
								{hasNewer || hasOlder
									? 'No reflections in this part of your journey'
									: 'A place for your reflections'}
							</Typography>
							<Typography
								weight='Regular'
								style={secondary}
							>
								{hasNewer || hasOlder
									? 'You can continue through your history using the controls below.'
									: 'Your saved reflections will appear here. Begin with what’s on your heart today.'}
							</Typography>
						</ReflectionFooter>
					) : (
						entries.map((entry, index) => {
							const date = new Date(
								`${entry.calendarDate}T12:00:00Z`,
							).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								timeZone: 'UTC',
							});
							const Entry =
								index === 0
									? ReflectionFeatured
									: ReflectionEntryRow;
							return (
								<Entry
									key={`${entry.journeyId}-${entry.dayNumber}`}
									style={
										index === 0
											? surface
											: {
													borderBottomColor:
														BorderColors.Subtle,
												}
									}
									accessibilityRole='button'
									accessibilityLabel={`${date}, Day ${entry.dayNumber} reflection`}
									onPress={() =>
										openReflection(
											entry.journeyId,
											entry.dayNumber,
										)
									}
								>
									<ReflectionHeadingRow>
										<ReflectionEntryCopy>
											<Typography
												weight='Regular'
												style={[
													textStyles.support,
													secondary,
												]}
											>
												{date}
											</Typography>
											<Typography
												weight='Regular'
												style={[textStyles.label, text]}
											>
												Day {entry.dayNumber} reflection
											</Typography>
											{index === 0 && (
												<Typography
													numberOfLines={3}
													weight='Regular'
													style={[
														textStyles.intro,
														secondary,
													]}
												>
													{entry.reflection?.text}
												</Typography>
											)}
										</ReflectionEntryCopy>
										<AppIcon
											name={IconName.ArrowRight}
											size={IconSizes.Small}
											color={TextColors.Secondary}
										/>
									</ReflectionHeadingRow>
								</Entry>
							);
						})
					)}
					{(hasOlder || hasNewer) && (
						<ReflectionHeadingRow>
							<TurndownButton
								variant='Ghost'
								fullWidth={false}
								disabled={!hasNewer}
								onPress={newer}
							>
								Newer
							</TurndownButton>
							<TurndownButton
								variant='Ghost'
								fullWidth={false}
								disabled={!hasOlder || !entries || error}
								onPress={older}
							>
								Older
							</TurndownButton>
						</ReflectionHeadingRow>
					)}
				</ReflectionSection>
				<ReflectionFooter style={surface}>
					<ReflectionFooterBranch
						source={reflectionAssets.footerBranch}
						contentFit='contain'
						accessible={false}
					/>
					<Typography
						weight='Regular'
						style={[textStyles.quote, text]}
					>
						“You have kept count of my tossings; put my tears in
						your bottle. You have recorded each one in your book.”
					</Typography>
					<Typography
						align='center'
						weight='Regular'
						style={[textStyles.citation, secondary]}
					>
						PSALM 56:8
					</Typography>
				</ReflectionFooter>
				<Typography
					align='center'
					weight='Regular'
					style={secondary}
				>
					Your reflections are private.
				</Typography>
			</ReflectionContent>
		</TurndownScrollScreen>
	);
};
