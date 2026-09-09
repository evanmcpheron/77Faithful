import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Spinner } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { SeventySevenPage } from '@77/components/core/seventy-seven-page.component';
import { weeklyThemes } from '@77/features/journey-setup/journey-setup-content';
import { SeventySevenCard } from '@77/surface';

import {
  addJourneyCalendarDays,
  getJourneyCalendarDate,
  getJourneyDayNumber,
} from './journey-calendar';
import { useLatestJourney } from './use-latest-journey.hook';
import type { TTodayJourney } from './today-screen.component';

interface IJourneyScreenProps {
  userId: string;
  previewJourney?: TTodayJourney;
  onExitPreview?: () => void;
}

export const JourneyScreen = ({ userId, previewJourney, onExitPreview }: IJourneyScreenProps) => {
  const isPreview = __DEV__ && Boolean(previewJourney);
  const {
    journey: savedJourney,
    isLoading,
    hasError,
    retry,
  } = useLatestJourney(isPreview ? null : userId);
  const journey = (__DEV__ && previewJourney) || savedJourney;
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

  const calendarDate = getJourneyCalendarDate(
    now,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const dayNumber = journey ? getJourneyDayNumber(journey.startDate, calendarDate) : 0;
  const hasEndedEarly = journey?.state.status === 'EndedEarly';
  const hasCompleted = !hasEndedEarly && (journey?.state.status === 'Completed' || dayNumber > 77);
  const currentWeek =
    !hasEndedEarly && !hasCompleted && dayNumber >= 1 ? Math.ceil(dayNumber / 7) : null;

  return (
    <SeventySevenPage title="Journey">
      {isPreview ? (
        <SeventySevenCard gap="$3">
          <SeventySevenText>Journey preview · Your journey hasn’t started.</SeventySevenText>
          <SeventySevenButton onPress={onExitPreview}>Back to setup</SeventySevenButton>
        </SeventySevenCard>
      ) : null}
      {isLoading ? (
        <Spinner accessibilityLabel="Loading your journey" />
      ) : hasError ? (
        <>
          <SeventySevenText role="alert">
            We couldn’t load your journey. Check your connection and try again.
          </SeventySevenText>
          <SeventySevenButton onPress={retry}>Try again</SeventySevenButton>
        </>
      ) : !journey ? (
        <SeventySevenText>
          Your journey isn’t available yet. Return to Today to continue.
        </SeventySevenText>
      ) : (
        <>
          <SeventySevenCard gap="$3">
            <SeventySevenText size="HeadingSmall" role="heading">
              {hasEndedEarly
                ? 'Your journey ended early'
                : hasCompleted
                  ? 'Your 77 days are complete'
                  : dayNumber >= 1
                    ? `Day ${dayNumber} of 77`
                    : 'Your journey dates'}
            </SeventySevenText>
            <SeventySevenText>Started {journey.startDate}</SeventySevenText>
            <SeventySevenText>
              Day 77 · {addJourneyCalendarDays(journey.startDate, 76)}
            </SeventySevenText>
            {journey.state.status === 'EndedEarly' ? (
              <SeventySevenText>
                Ended {journey.state.endedOn} · Day {journey.state.lastReachedDayNumber}
              </SeventySevenText>
            ) : null}
            <SeventySevenText color="$textSecondary">
              {hasCompleted
                ? 'Thank God for what you have learned, and consider which practices you want to carry forward.'
                : 'Keep returning to Scripture, prayer, and faithful action. An incomplete day does not restart your 77 days.'}
            </SeventySevenText>
          </SeventySevenCard>
          {isPreview ? (
            <SeventySevenCard gap="$3">
              <SeventySevenText bold>Your starting motivation</SeventySevenText>
              <SeventySevenText>
                {journey.startingMotivation?.text || 'You haven’t added a starting motivation.'}
              </SeventySevenText>
            </SeventySevenCard>
          ) : (
            <SeventySevenButton href="/reflections" appearance="Outlined">
              Saved reflections
            </SeventySevenButton>
          )}
          <SeventySevenText size="HeadingSmall" role="heading">
            Your eleven weeks
          </SeventySevenText>
          {weeklyThemes.map((theme, index) => (
            <SeventySevenCard
              key={theme}
              gap="$2"
              borderColor={currentWeek === index + 1 ? '$link' : '$border'}
            >
              <SeventySevenText color="$textSecondary">
                Week {index + 1} · Days {index * 7 + 1}–{(index + 1) * 7}
                {currentWeek === index + 1 ? ' · This week' : ''}
              </SeventySevenText>
              <SeventySevenText bold>{theme}</SeventySevenText>
            </SeventySevenCard>
          ))}
        </>
      )}
    </SeventySevenPage>
  );
};
