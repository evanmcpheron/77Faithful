import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Spinner, Theme, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { SeventySevenPage } from '@77/components/core/seventy-seven-page.component';
import type { TPracticeId } from '@77/types/formation/practice.types';
import type { IJourneyDocument } from '@77/types/journey/journey.types';

import { DayPracticeScreen, getPracticeRoute } from './day-practice-screen.component';
import { getJourneyCalendarDate, getJourneyDayNumber } from './journey-calendar';
import { getPreviewDaySession } from './provisional-day-content';
import { TodayDashboard } from './today-dashboard.component';
import { useJourneyDay } from './use-journey-day.hook';
import { useLatestJourney } from './use-latest-journey.hook';

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
  onOpenJourney?: () => void;
  onOpenSettings?: () => void;
}

interface IActiveTodayProps extends ITodayScreenProps {
  journeyId: string;
  journey: TTodayJourney;
  dayNumber: number;
}

const ActiveToday = ({
  userId,
  journeyId,
  journey,
  dayNumber,
  previewJourney,
  onExitPreview,
  onOpenJourney,
  onOpenSettings,
}: IActiveTodayProps) => {
  const router = useRouter();
  const [previewSession] = useState(() =>
    __DEV__ && previewJourney ? getPreviewDaySession(userId, previewJourney, dayNumber) : undefined,
  );
  const [previewPracticeId, setPreviewPracticeId] = useState<TPracticeId | null>(null);
  const controller = useJourneyDay(journeyId, dayNumber, previewSession);
  const handleOpenPractice = (practiceId: TPracticeId) => {
    if (previewSession) setPreviewPracticeId(practiceId);
    else router.push(getPracticeRoute(journeyId, dayNumber, practiceId));
  };

  if (previewPracticeId)
    return (
      <DayPracticeScreen
        userId={userId}
        practiceId={previewPracticeId}
        controller={controller}
        onBack={() => setPreviewPracticeId(null)}
        onOpenPractice={handleOpenPractice}
        isPreview
      />
    );
  if (!controller.session || controller.loadError)
    return (
      <SeventySevenPage title="Today">
        {controller.isLoading ? (
          <Spinner accessibilityLabel="Loading today’s practices" />
        ) : (
          <YStack gap={16}>
            <SeventySevenText role="alert">{controller.loadError}</SeventySevenText>
            <SeventySevenButton onPress={controller.retry}>Try again</SeventySevenButton>
          </YStack>
        )}
      </SeventySevenPage>
    );
  return (
    <TodayDashboard
      controller={controller}
      motivation={journey.startingMotivation?.text ?? null}
      onOpenPractice={handleOpenPractice}
      onOpenJourney={onOpenJourney ?? (() => router.navigate('/journey'))}
      onOpenSettings={onOpenSettings ?? (() => router.navigate('/settings'))}
      onExitPreview={previewSession ? onExitPreview : undefined}
    />
  );
};

export const TodayScreen = ({ userId, previewJourney, ...callbacks }: ITodayScreenProps) => {
  const isPreview = __DEV__ && Boolean(previewJourney);
  const {
    journey: savedJourney,
    journeyId,
    isLoading,
    hasError,
    retry,
  } = useLatestJourney(isPreview ? null : userId);
  const journey = (__DEV__ && previewJourney) || savedJourney;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleClockUpdate = () => {
      timerId = setTimeout(
        () => {
          setNow(new Date());
          scheduleClockUpdate();
        },
        60000 - (Date.now() % 60000),
      );
    };
    scheduleClockUpdate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearTimeout(timerId);
      subscription.remove();
    };
  }, []);

  const dayNumber = journey
    ? getJourneyDayNumber(
        journey.startDate,
        getJourneyCalendarDate(now, Intl.DateTimeFormat().resolvedOptions().timeZone),
      )
    : null;
  const hasEndedEarly = journey?.state.status === 'EndedEarly';
  const hasCompleted =
    !hasEndedEarly &&
    (journey?.state.status === 'Completed' || (dayNumber !== null && dayNumber > 77));
  const isActiveDay = !hasEndedEarly && !hasCompleted && dayNumber !== null && dayNumber >= 1;

  return (
    <Theme name="formation">
      {journey && isActiveDay && dayNumber !== null && (journeyId || isPreview) ? (
        <ActiveToday
          key={`${userId}.${journeyId ?? 'preview'}.${dayNumber}`}
          userId={userId}
          journeyId={journeyId ?? 'preview'}
          journey={journey}
          dayNumber={dayNumber}
          previewJourney={previewJourney}
          {...callbacks}
        />
      ) : (
        <SeventySevenPage title="Today">
          {isLoading && !isPreview ? (
            <Spinner accessibilityLabel="Loading today" />
          ) : hasError ? (
            <YStack gap={16}>
              <SeventySevenText role="alert">
                We couldn’t load your journey. Check your connection and try again.
              </SeventySevenText>
              <SeventySevenButton onPress={retry}>Try again</SeventySevenButton>
            </YStack>
          ) : !journey ? (
            <SeventySevenText>
              Your journey hasn’t started yet. Your saved setup will open when your account is
              ready.
            </SeventySevenText>
          ) : (
            <YStack gap={16}>
              <SeventySevenText size="HeadingSmall">
                {hasEndedEarly
                  ? 'Your journey ended early'
                  : hasCompleted
                    ? 'Your 77 days are complete'
                    : 'Your journey dates'}
              </SeventySevenText>
              <SeventySevenText>
                {hasEndedEarly
                  ? 'Your earlier days remain part of your record.'
                  : hasCompleted
                    ? 'Take time to thank God and reflect on what you want to carry forward.'
                    : 'Check your phone’s date and time to see today’s place in your journey.'}
              </SeventySevenText>
              <SeventySevenButton href="/journey">View Journey</SeventySevenButton>
            </YStack>
          )}
        </SeventySevenPage>
      )}
    </Theme>
  );
};
