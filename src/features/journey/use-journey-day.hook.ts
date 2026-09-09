import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { TPracticeId } from '@77/types/formation/practice.types';
import type { IPracticeCompletion } from '@77/types/journey/journey-day.types';
import type { IWritingHead } from '@77/types/journey/journey-writing.types';

import { getPracticeCompletion } from './daily-practices';
import type {
  ICompleteJourneyPracticeRequest,
  IJourneyDaySession,
  ISaveJourneyReflectionRequest,
} from './journey-day-session.types';
import {
  createDailyChangeOrigin,
  getDailySaveError,
  loadJourneyDay,
  saveJourneyReflection,
  setJourneyPracticeCompletion,
} from './journey-day.service';

export const useJourneyDay = (
  journeyId: string,
  dayNumber: number,
  previewSession?: IJourneyDaySession,
) => {
  const [session, setSession] = useState<IJourneyDaySession | null>(previewSession ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!previewSession);
  const [isSaving, setIsSaving] = useState(false);
  const [completionOverrides, setCompletionOverrides] = useState<
    Partial<Record<TPracticeId, IPracticeCompletion>>
  >({});
  const [retryCount, setRetryCount] = useState(0);
  const pendingSave = useRef(false);
  const isMounted = useRef(true);
  const lastPracticeRequest = useRef<ICompleteJourneyPracticeRequest | null>(null);
  const lastReflectionRequest = useRef<ISaveJourneyReflectionRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      setIsSaving(pendingSave.current);
      if (retryCount > 0) setSaveError(null);
      let isCurrentLoad = true;
      if (!previewSession) {
        setIsLoading(true);
        setLoadError(null);
        loadJourneyDay({
          journeyId,
          dayNumber,
          observedPhoneTimeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
          .then(({ data }) => {
            if (!isCurrentLoad) return;
            setSession((current) => {
              const currentWriting = current?.day.reflection;
              const loadedWriting = data.day.reflection;
              const hasNewerWriting =
                currentWriting &&
                (!loadedWriting ||
                  currentWriting.updatedAt.seconds > loadedWriting.updatedAt.seconds ||
                  (currentWriting.updatedAt.seconds === loadedWriting.updatedAt.seconds &&
                    currentWriting.updatedAt.nanoseconds > loadedWriting.updatedAt.nanoseconds));
              return hasNewerWriting
                ? { ...data, day: { ...data.day, reflection: currentWriting } }
                : data;
            });
            setCompletionOverrides((current) => {
              const newerCompletions: Partial<Record<TPracticeId, IPracticeCompletion>> = {};
              for (const practiceId of Object.keys(current) as TPracticeId[]) {
                const completion = current[practiceId];
                const loadedCompletion = getPracticeCompletion(data.day.practices, practiceId);
                if (
                  completion &&
                  loadedCompletion &&
                  completion.revision > loadedCompletion.revision
                )
                  newerCompletions[practiceId] = completion;
              }
              return newerCompletions;
            });
            setIsLoading(false);
          })
          .catch((error: unknown) => {
            console.warn(
              'Could not load the daily practices.',
              error instanceof Error ? error.message : 'Unknown error',
            );
            if (!isCurrentLoad) return;
            setLoadError(
              'We couldn’t load today’s practices. Check your connection and try again.',
            );
            setIsLoading(false);
          });
      }
      return () => {
        isCurrentLoad = false;
        isMounted.current = false;
      };
    }, [journeyId, dayNumber, previewSession, retryCount]),
  );

  const getCompletion = (practiceId: TPracticeId) =>
    completionOverrides[practiceId] ??
    (session ? getPracticeCompletion(session.day.practices, practiceId) : undefined);

  const setComplete = async (practiceId: TPracticeId, isComplete: boolean): Promise<boolean> => {
    const previousCompletion = getCompletion(practiceId);
    if (!previousCompletion || pendingSave.current || isLoading) return false;
    pendingSave.current = true;
    setIsSaving(true);
    setSaveError(null);
    setCompletionOverrides((current) => ({
      ...current,
      [practiceId]: { ...previousCompletion, status: isComplete ? 'Complete' : 'NotMarked' },
    }));
    try {
      let completion: IPracticeCompletion;
      if (previewSession) {
        completion = {
          ...previousCompletion,
          status: isComplete ? 'Complete' : 'NotMarked',
          revision: previousCompletion.revision + 1,
        };
      } else {
        const previousRequest = lastPracticeRequest.current;
        const request =
          previousRequest?.practiceId === practiceId &&
          previousRequest.isComplete === isComplete &&
          previousRequest.expectedCompletionRevision === previousCompletion.revision
            ? previousRequest
            : {
                journeyId,
                dayNumber,
                practiceId,
                isComplete,
                expectedCompletionRevision: previousCompletion.revision,
                observedPhoneTimeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
                origin: await createDailyChangeOrigin(),
              };
        lastPracticeRequest.current = request;
        completion = (await setJourneyPracticeCompletion(request)).data.completion;
        lastPracticeRequest.current = null;
      }
      if (isMounted.current)
        setCompletionOverrides((current) => ({ ...current, [practiceId]: completion }));
      return true;
    } catch (error) {
      if (isMounted.current) {
        setCompletionOverrides((current) => ({ ...current, [practiceId]: previousCompletion }));
        setSaveError(getDailySaveError(error));
      }
      return false;
    } finally {
      pendingSave.current = false;
      if (isMounted.current) setIsSaving(false);
    }
  };

  const saveReflection = async (
    text: string,
    expectedRevisionId: string | null,
  ): Promise<IWritingHead | null> => {
    if (!session || pendingSave.current || isLoading) return null;
    pendingSave.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      let writing: IWritingHead;
      if (previewSession) {
        writing = {
          revisionId: `preview-${Date.now()}`,
          text,
          updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        };
      } else {
        const previousRequest = lastReflectionRequest.current;
        const request: ISaveJourneyReflectionRequest =
          previousRequest?.text === text &&
          previousRequest.expectedRevisionId === expectedRevisionId
            ? previousRequest
            : {
                target: { kind: 'DailyReflection', journeyId, dayNumber },
                expectedRevisionId,
                text,
                origin: await createDailyChangeOrigin(),
                observedPhoneTimeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
              };
        lastReflectionRequest.current = request;
        writing = (await saveJourneyReflection(request)).data.currentWriting;
        lastReflectionRequest.current = null;
      }
      if (isMounted.current)
        setSession((current) =>
          current ? { ...current, day: { ...current.day, reflection: writing } } : null,
        );
      return writing;
    } catch (error) {
      if (isMounted.current) setSaveError(getDailySaveError(error));
      return null;
    } finally {
      pendingSave.current = false;
      if (isMounted.current) setIsSaving(false);
    }
  };

  return {
    session,
    isLoading,
    isSaving,
    loadError,
    saveError,
    getCompletion,
    setComplete,
    saveReflection,
    retry: () => setRetryCount((count) => count + 1),
  };
};

export type TJourneyDayController = ReturnType<typeof useJourneyDay>;
