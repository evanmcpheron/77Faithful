import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Progress, Sheet, useTheme, XStack, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import type { TPracticeId } from '@77/types/formation/practice.types';

import { DailyPracticeRow } from './daily-practice-row.component';
import { getDailyPractices } from './daily-practices';
import { FormationCard, FormationHeading } from './formation-ui.component';
import type { TJourneyDayController } from './use-journey-day.hook';

interface ITodayDashboardProps {
  controller: TJourneyDayController;
  motivation: string | null;
  onOpenPractice: (practiceId: TPracticeId) => void;
  onOpenJourney: () => void;
  onOpenSettings: () => void;
  onExitPreview?: () => void;
}

export const TodayDashboard = ({
  controller,
  motivation,
  onOpenPractice,
  onOpenJourney,
  onOpenSettings,
  onExitPreview,
}: ITodayDashboardProps) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [isWeekOpen, setIsWeekOpen] = useState(false);
  const [isMotivationOpen, setIsMotivationOpen] = useState(false);
  const { session, getCompletion, setComplete, isSaving, isLoading, saveError } = controller;
  if (!session) return null;
  const practices = getDailyPractices(session);
  const completedCount = practices.filter(
    (practice) => getCompletion(practice.practiceId)?.status === 'Complete',
  ).length;
  const nextPractice = practices.find(
    (practice) => getCompletion(practice.practiceId)?.status !== 'Complete',
  );
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const date = new Date(`${session.day.calendarDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const quote = session.scripture?.primaryPassage.paragraphs
    .flatMap((paragraph) => paragraph.runs)
    .find((run) => run.text.length <= 200);
  const handleComplete = (practiceId: TPracticeId, isComplete: boolean) => {
    void setComplete(practiceId, isComplete);
  };
  const handleContinue = () => {
    if (nextPractice) onOpenPractice(nextPractice.practiceId);
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} bg="$background" pb={32}>
          <YStack
            minH={260 + insets.top}
            overflow="hidden"
            pt={insets.top + 20}
            pb={76}
            pl={insets.left + 24}
            pr={insets.right + 24}
          >
            <Image
              source={require('../../../assets/images/today-landscape-placeholder.jpg')}
              contentFit="cover"
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              accessibilityIgnoresInvertColors
              accessible={false}
            />
            <YStack position="absolute" t={0} l={0} r={0} b={0} bg="rgba(246, 243, 238, 0.76)" />
            <YStack width="100%" maxW={720} self="center" gap={20}>
              <XStack justify="space-between" items="flex-start" gap={12}>
                <FormationHeading
                  flex={1}
                  color="#203D34"
                  fontSize={38}
                  lineHeight={44}
                  role="heading"
                  aria-level={1}
                >
                  {greeting}
                  {session.preferredName ? `,\n${session.preferredName}` : '.'}
                </FormationHeading>
                <Button
                  circular
                  width={44}
                  height={44}
                  bg="rgba(255,255,255,0.85)"
                  borderWidth={0}
                  onPress={onOpenSettings}
                  accessibilityLabel="Open Settings"
                >
                  <SymbolView
                    name={{
                      ios: 'person.crop.circle',
                      android: 'account_circle',
                      web: 'account_circle',
                    }}
                    tintColor="#294F42"
                    size={27}
                  />
                </Button>
              </XStack>
              <YStack gap={12} maxW={520}>
                <SeventySevenText color="#334D42" fontSize={17} lineHeight={26}>
                  Make room for God in Scripture,{'\n'}prayer, and faithful action.
                </SeventySevenText>
                <SeventySevenText color="#40564A" fontSize={13}>
                  {date}
                </SeventySevenText>
              </YStack>
            </YStack>
          </YStack>
          <YStack width="100%" maxW={760} self="center" px={20} mt={-52} gap={22}>
            <XStack gap={12} flexWrap="wrap">
              <Button
                unstyled
                flex={1}
                minW={140}
                cursor="pointer"
                onPress={onOpenJourney}
                accessibilityLabel={`Day ${session.day.dayNumber} of 77. Open Journey`}
              >
                <FormationCard flex={1} width="100%" gap={12} p={16} rounded={22}>
                  <SeventySevenText bold fontSize={18}>
                    Day {session.day.dayNumber} of 77
                  </SeventySevenText>
                  <Progress
                    value={(session.day.dayNumber / 77) * 100}
                    size="$2"
                    bg="$surfaceSubtle"
                    accessibilityLabel={`Day ${session.day.dayNumber} of 77`}
                  >
                    <Progress.Indicator bg="$primary" />
                  </Progress>
                  <XStack gap={6} items="center" justify="space-between">
                    <SeventySevenText flex={1} numberOfLines={2} fontSize={13} lineHeight={19}>
                      {session.content.title}
                    </SeventySevenText>
                    <SymbolView
                      name={{
                        ios: 'chevron.right',
                        android: 'chevron_right',
                        web: 'chevron_right',
                      }}
                      size={18}
                      tintColor={theme.color.val}
                    />
                  </XStack>
                </FormationCard>
              </Button>
              <Button
                unstyled
                flex={1}
                minW={140}
                cursor="pointer"
                onPress={() => setIsWeekOpen(true)}
                accessibilityLabel={`This week: ${session.week.title}. Read the introduction`}
              >
                <FormationCard flex={1} width="100%" gap={6} p={16} rounded={22}>
                  <SeventySevenText color="$textSecondary" fontSize={11} letterSpacing={1.5}>
                    THIS WEEK · {session.day.weekNumber}
                  </SeventySevenText>
                  <XStack items="center" gap={6}>
                    <FormationHeading flex={1} fontSize={21} lineHeight={26}>
                      {session.week.title}
                    </FormationHeading>
                    <SymbolView
                      name={{
                        ios: 'chevron.right',
                        android: 'chevron_right',
                        web: 'chevron_right',
                      }}
                      size={18}
                      tintColor={theme.color.val}
                    />
                  </XStack>
                  <SeventySevenText
                    color="$textSecondary"
                    fontSize={13}
                    lineHeight={19}
                    numberOfLines={2}
                  >
                    {session.week.description}
                  </SeventySevenText>
                </FormationCard>
              </Button>
            </XStack>
            {onExitPreview ? (
              <FormationCard gap={10}>
                <SeventySevenText>
                  Preview · Changes here aren’t saved to your account.
                </SeventySevenText>
                <SeventySevenButton appearance="Outlined" onPress={onExitPreview}>
                  Back to setup
                </SeventySevenButton>
              </FormationCard>
            ) : null}
            <FormationCard p={16} gap={16}>
              <XStack
                justify="space-between"
                items="baseline"
                flexWrap="wrap"
                gap={8}
                px={4}
                pt={4}
                pb={4}
              >
                <FormationHeading fontSize={28} lineHeight={35} role="heading" aria-level={2}>
                  Today’s Practices
                </FormationHeading>
                <SeventySevenText
                  color="$textSecondary"
                  fontSize={13}
                  accessibilityLiveRegion="polite"
                >
                  {completedCount} of {practices.length} complete
                </SeventySevenText>
              </XStack>
              <YStack gap={12}>
                {practices.map((practice) => (
                  <DailyPracticeRow
                    key={practice.practiceId}
                    practice={practice}
                    isComplete={getCompletion(practice.practiceId)?.status === 'Complete'}
                    isSaving={isSaving || isLoading}
                    onOpen={onOpenPractice}
                    onComplete={handleComplete}
                  />
                ))}
              </YStack>
              {saveError ? (
                <YStack gap={8}>
                  <SeventySevenText role="alert">{saveError}</SeventySevenText>
                  <Button onPress={controller.retry}>Reload practices</Button>
                </YStack>
              ) : null}
              {nextPractice ? (
                <SeventySevenButton
                  rounded={16}
                  mt={4}
                  disabled={isSaving || isLoading}
                  onPress={handleContinue}
                >
                  {nextPractice.action} →
                </SeventySevenButton>
              ) : (
                <YStack
                  bg="$surfaceElevated"
                  rounded={16}
                  p={18}
                  gap={6}
                  accessibilityLiveRegion="polite"
                >
                  <SeventySevenText bold>Today’s practices are complete.</SeventySevenText>
                  <SeventySevenText color="$textSecondary">
                    Take a moment to thank God for what He showed you today.
                  </SeventySevenText>
                </YStack>
              )}
            </FormationCard>
            {quote ? (
              <FormationCard bg="$surfaceSubtle" py={26} gap={12}>
                <FormationHeading
                  alignment="Center"
                  fontSize={21}
                  lineHeight={31}
                  fontStyle="italic"
                >
                  {quote.text}
                </FormationHeading>
                <SeventySevenText
                  alignment="Center"
                  color="$textSecondary"
                  fontSize={11}
                  letterSpacing={1}
                >
                  {session.scriptureReference} · {session.translation.abbreviation}
                </SeventySevenText>
              </FormationCard>
            ) : null}
            {motivation ? (
              <YStack px={4} gap={12}>
                <Button
                  chromeless
                  justify="space-between"
                  onPress={() => setIsMotivationOpen((isOpen) => !isOpen)}
                  aria-expanded={isMotivationOpen}
                >
                  Your starting motivation {isMotivationOpen ? '−' : '+'}
                </Button>
                {isMotivationOpen ? (
                  <SeventySevenText px={12} color="$textSecondary">
                    {motivation}
                  </SeventySevenText>
                ) : null}
              </YStack>
            ) : null}
          </YStack>
        </YStack>
      </ScrollView>
      <Sheet
        modal
        open={isWeekOpen}
        onOpenChange={setIsWeekOpen}
        snapPoints={[80]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay bg="rgba(0,0,0,0.35)" />
        <Sheet.Handle />
        <Sheet.Frame bg="$background" p={24} gap={18}>
          <Button self="flex-end" onPress={() => setIsWeekOpen(false)}>
            Close
          </Button>
          <Sheet.ScrollView>
            <YStack gap={20} pb={insets.bottom + 32}>
              <SeventySevenText color="$textSecondary">
                Week {session.day.weekNumber}
              </SeventySevenText>
              <FormationHeading fontSize={32} lineHeight={40} role="heading">
                {session.week.title}
              </FormationHeading>
              <SeventySevenText fontSize={18} lineHeight={30}>
                {session.week.introduction}
              </SeventySevenText>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};
