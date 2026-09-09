import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { AppState, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { setupPractices, weeklyThemes } from '@77/features/journey-setup/journey-setup-content';
import { db } from '@77/lib/firebase';
import { SeventySevenCard } from '@77/surface';
import type { IJourneyDocument } from '@77/types/journey/journey.types';

import {
  addJourneyCalendarDays,
  getJourneyCalendarDate,
  getJourneyDayNumber,
} from './journey-calendar';

export type TTodayJourney = Pick<
  IJourneyDocument,
  'startDate' | 'state' | 'initialOptionalPracticeIds'
> & {
  startingMotivation: Pick<NonNullable<IJourneyDocument['startingMotivation']>, 'text'> | null;
};

interface ITodayScreenProps {
  userId: string;
  previewJourney?: TTodayJourney;
  onExitPreview?: () => void;
}

export const TodayScreen = ({ userId, previewJourney, onExitPreview }: ITodayScreenProps) => {
  const insets = useSafeAreaInsets();
  const [savedJourney, setJourney] = useState<IJourneyDocument | null>(null);
  const journey = (__DEV__ && previewJourney) || savedJourney;
  const isPreview = __DEV__ && Boolean(previewJourney);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timerId);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isPreview) return;

    return onSnapshot(
      query(collection(db, 'users', userId, 'journeys'), orderBy('createdAt', 'desc'), limit(1)),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.empty && snapshot.metadata.fromCache) return;
        // Journeys are server-owned records using the shared contract.
        setJourney(snapshot.empty ? null : (snapshot.docs[0].data() as IJourneyDocument));
        setHasError(false);
        setIsLoading(false);
      },
      (error) => {
        console.warn('Today could not load the journey.', { code: error.code });
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, [userId, retryCount, isPreview]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount((count) => count + 1);
  };

  const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const calendarDate = journey ? getJourneyCalendarDate(now, timeZoneId) : null;
  const dayNumber =
    journey && calendarDate ? getJourneyDayNumber(journey.startDate, calendarDate) : null;
  const hasEndedEarly = journey?.state.status === 'EndedEarly';
  const hasCompleted =
    journey?.state.status === 'Completed' || (dayNumber !== null && dayNumber > 77);
  const isActiveDay = !hasEndedEarly && !hasCompleted && dayNumber !== null && dayNumber >= 1;
  const chosenPractices = journey
    ? setupPractices.filter((practice) =>
        journey.initialOptionalPracticeIds.some((practiceId) => practiceId === practice.practiceId),
      )
    : [];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack
        flex={1}
        bg="$background"
        pt={insets.top + 24}
        pb={insets.bottom + 32}
        pl={insets.left + 24}
        pr={insets.right + 24}
      >
        <YStack width="100%" maxW={640} self="center" gap="$5">
          <SeventySevenText bold color="$primary">
            77Faithful
          </SeventySevenText>
          <SeventySevenText size="Heading" role="heading">
            Today
          </SeventySevenText>
          {isPreview ? (
            <SeventySevenCard gap="$2">
              <SeventySevenText>Today preview · Your journey hasn’t started.</SeventySevenText>
              <SeventySevenButton onPress={onExitPreview}>Back to setup</SeventySevenButton>
            </SeventySevenCard>
          ) : null}
          {isLoading && !isPreview ? (
            <Spinner accessibilityLabel="Loading today" />
          ) : hasError ? (
            <YStack gap="$3">
              <SeventySevenText role="alert">
                We couldn’t load your journey. Check your connection and try again.
              </SeventySevenText>
              <SeventySevenButton onPress={handleRetry}>Try again</SeventySevenButton>
            </YStack>
          ) : !journey ? (
            <SeventySevenText>
              Your journey hasn’t started yet. Your saved setup will open when your account is
              ready.
            </SeventySevenText>
          ) : (
            <YStack gap="$4">
              <SeventySevenCard gap="$3">
                <SeventySevenText size="HeadingSmall" role="heading">
                  {hasEndedEarly
                    ? 'Your journey ended early'
                    : hasCompleted
                      ? 'Your 77 days are complete'
                      : isActiveDay
                        ? `Day ${dayNumber} of 77`
                        : 'Your journey dates'}
                </SeventySevenText>
                {isActiveDay && dayNumber !== null ? (
                  <>
                    <SeventySevenText>
                      {calendarDate} · {timeZoneId}
                    </SeventySevenText>
                    <SeventySevenText bold>
                      Week {Math.ceil(dayNumber / 7)} · {weeklyThemes[Math.ceil(dayNumber / 7) - 1]}
                    </SeventySevenText>
                    <SeventySevenText>
                      Make room for Scripture, prayer, and faithful action today.
                    </SeventySevenText>
                  </>
                ) : (
                  <SeventySevenText>
                    {hasEndedEarly
                      ? 'Your earlier days remain part of your record.'
                      : hasCompleted
                        ? 'Take time to thank God and reflect on what you want to carry forward.'
                        : 'Check your phone’s date and time to see today’s place in your journey.'}
                  </SeventySevenText>
                )}
                <SeventySevenText color="$textSecondary">
                  Started {journey.startDate} · Day 77{' '}
                  {addJourneyCalendarDays(journey.startDate, 76)}
                </SeventySevenText>
              </SeventySevenCard>
              {isActiveDay ? (
                <>
                  <SeventySevenText size="HeadingSmall" role="heading">
                    Foundational Practices
                  </SeventySevenText>
                  <SeventySevenCard gap="$3">
                    <SeventySevenText bold>Read Scripture</SeventySevenText>
                    <SeventySevenText bold>Pray</SeventySevenText>
                    <SeventySevenText bold>Reflect</SeventySevenText>
                  </SeventySevenCard>
                  <SeventySevenText size="HeadingSmall" role="heading">
                    Chosen Practices
                  </SeventySevenText>
                  {chosenPractices.map((practice) => (
                    <SeventySevenCard key={practice.practiceId} gap="$2">
                      <SeventySevenText bold>{practice.name}</SeventySevenText>
                      <SeventySevenText>{practice.purpose}</SeventySevenText>
                    </SeventySevenCard>
                  ))}
                </>
              ) : null}
              {journey.startingMotivation?.text ? (
                <SeventySevenCard gap="$2">
                  <SeventySevenText bold>Your starting motivation</SeventySevenText>
                  <SeventySevenText>{journey.startingMotivation.text}</SeventySevenText>
                </SeventySevenCard>
              ) : null}
            </YStack>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
};
