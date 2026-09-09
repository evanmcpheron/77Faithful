import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Separator, Spinner, Theme, XStack, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { setupPractices } from '@77/features/journey-setup/journey-setup-content';
import { useAuth } from '@77/providers/auth-provider';
import type { TPracticeId } from '@77/types/formation/practice.types';

import { DailyPrayerContent, DailyReflectionContent } from './daily-practice-content.component';
import { getDailyPractices } from './daily-practices';
import { FormationCard, FormationHeading } from './formation-ui.component';
import { ReflectionEditor } from './reflection-editor.component';
import { ScriptureReading } from './scripture-reading.component';
import { useJourneyDay } from './use-journey-day.hook';
import type { TJourneyDayController } from './use-journey-day.hook';

export const getPracticeRoute = (journeyId: string, dayNumber: number, practiceId: TPracticeId) => {
  const base = `/journeys/${journeyId}/days/${dayNumber}` as const;
  if (practiceId === 'ReadScripture') return `${base}/scripture` as const;
  if (practiceId === 'Pray') return `${base}/prayer` as const;
  if (practiceId === 'Reflect') return `${base}/reflection` as const;
  return `${base}/practices/${practiceId}` as const;
};

interface IDayPracticeScreenProps {
  userId: string;
  practiceId: TPracticeId;
  controller: TJourneyDayController;
  onBack: () => void;
  onOpenPractice: (practiceId: TPracticeId) => void;
  isPreview?: boolean;
}

export const DayPracticeScreen = ({
  userId,
  practiceId,
  controller,
  onBack,
  onOpenPractice,
  isPreview = false,
}: IDayPracticeScreenProps) => {
  const insets = useSafeAreaInsets();
  const {
    session,
    isLoading,
    isSaving,
    loadError,
    saveError,
    retry,
    getCompletion,
    setComplete,
    saveReflection,
  } = controller;
  const practice = session
    ? getDailyPractices(session).find((assigned) => assigned.practiceId === practiceId)
    : null;
  const isComplete = getCompletion(practiceId)?.status === 'Complete';
  const nextPractice = session
    ? getDailyPractices(session).find(
        (assigned) =>
          assigned.practiceId !== practiceId &&
          getCompletion(assigned.practiceId)?.status !== 'Complete',
      )
    : null;
  const optionalPractice = setupPractices.find(
    (definition) => definition.practiceId === practiceId,
  );
  const handleCompletion = () => {
    void setComplete(practiceId, !isComplete);
  };

  return (
    <Theme name="formation">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <YStack
            flex={1}
            bg="$background"
            pt={insets.top + 12}
            pb={32}
            pl={insets.left + 20}
            pr={insets.right + 20}
          >
            <YStack width="100%" maxW={680} self="center" gap={24}>
              <XStack>
                <Button chromeless minH={44} onPress={onBack} disabled={isSaving}>
                  ← Back to Today
                </Button>
              </XStack>
              {isLoading ? (
                <Spinner accessibilityLabel="Loading this practice" />
              ) : loadError || !session ? (
                <YStack gap={16}>
                  <SeventySevenText role="alert">{loadError}</SeventySevenText>
                  <SeventySevenButton onPress={retry}>Try again</SeventySevenButton>
                </YStack>
              ) : !practice ? (
                <SeventySevenText>This practice isn’t assigned to this day.</SeventySevenText>
              ) : (
                <>
                  <YStack gap={8}>
                    <SeventySevenText color="$textSecondary">
                      Day {session.day.dayNumber} of 77 · {session.week.title}
                    </SeventySevenText>
                    <FormationHeading fontSize={36} lineHeight={43} role="heading" aria-level={1}>
                      {practice.name}
                    </FormationHeading>
                    <SeventySevenText color="$textSecondary">
                      {session.scriptureReference}
                    </SeventySevenText>
                  </YStack>
                  <FormationCard gap={24}>
                    {practiceId === 'ReadScripture' ? (
                      <ScriptureReading session={session} />
                    ) : practiceId === 'Pray' ? (
                      <DailyPrayerContent
                        prayerPrompt={session.content.prayerPrompt}
                        writtenPrayer={session.content.writtenPrayer}
                      />
                    ) : practiceId === 'Reflect' ? (
                      <>
                        <DailyReflectionContent
                          reflectionQuestion={session.content.reflectionQuestion}
                        />
                        <ReflectionEditor
                          userId={userId}
                          journeyId={session.day.journeyId}
                          dayNumber={session.day.dayNumber}
                          writing={session.day.reflection}
                          isSaving={isSaving}
                          isPreview={isPreview}
                          onSave={saveReflection}
                        />
                      </>
                    ) : optionalPractice ? (
                      <YStack gap={20}>
                        <SeventySevenText fontSize={18} lineHeight={29}>
                          {optionalPractice.purpose}
                        </SeventySevenText>
                        <SeventySevenText bold>A way to begin</SeventySevenText>
                        {optionalPractice.examples.map((example) => (
                          <SeventySevenText key={example}>{example}</SeventySevenText>
                        ))}
                        <SeventySevenText color="$textSecondary">
                          {optionalPractice.boundaries}
                        </SeventySevenText>
                      </YStack>
                    ) : null}
                    <Separator borderColor="$borderColor" />
                    {saveError ? (
                      <YStack gap={8}>
                        <SeventySevenText role="alert">{saveError}</SeventySevenText>
                        <Button disabled={isSaving} onPress={retry}>
                          Reload saved version
                        </Button>
                      </YStack>
                    ) : null}
                    <SeventySevenButton
                      rounded={16}
                      disabled={isSaving}
                      onPress={handleCompletion}
                      appearance={isComplete ? 'Outlined' : 'Filled'}
                    >
                      {isSaving ? 'Saving…' : isComplete ? 'Completed · Undo' : 'Mark complete'}
                    </SeventySevenButton>
                    {isComplete ? (
                      <SeventySevenButton
                        rounded={16}
                        disabled={isSaving}
                        onPress={
                          nextPractice ? () => onOpenPractice(nextPractice.practiceId) : onBack
                        }
                      >
                        {nextPractice ? `${nextPractice.action} →` : 'Return to Today'}
                      </SeventySevenButton>
                    ) : null}
                  </FormationCard>
                </>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Theme>
  );
};

const ConnectedDayPractice = ({
  userId,
  journeyId,
  dayNumber,
  practiceId,
}: {
  userId: string;
  journeyId: string;
  dayNumber: number;
  practiceId: TPracticeId;
}) => {
  const router = useRouter();
  const controller = useJourneyDay(journeyId, dayNumber);
  return (
    <DayPracticeScreen
      userId={userId}
      practiceId={practiceId}
      controller={controller}
      onBack={() => router.navigate('/today')}
      onOpenPractice={(next) => router.replace(getPracticeRoute(journeyId, dayNumber, next))}
    />
  );
};

export const DayPracticeRoute = ({ practiceId }: { practiceId: TPracticeId }) => {
  const { user } = useAuth();
  const { journeyId, dayNumber } = useLocalSearchParams<{ journeyId: string; dayNumber: string }>();
  const parsedDayNumber = Number(dayNumber);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {user &&
      /^[a-zA-Z0-9_-]{1,128}$/.test(journeyId ?? '') &&
      Number.isInteger(parsedDayNumber) &&
      parsedDayNumber >= 1 &&
      parsedDayNumber <= 77 ? (
        <ConnectedDayPractice
          key={`${user.uid}.${journeyId}.${dayNumber}`}
          userId={user.uid}
          journeyId={journeyId}
          dayNumber={parsedDayNumber}
          practiceId={practiceId}
        />
      ) : (
        <SeventySevenText>This day isn’t available.</SeventySevenText>
      )}
    </>
  );
};
