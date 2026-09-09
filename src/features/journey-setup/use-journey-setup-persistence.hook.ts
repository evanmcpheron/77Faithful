import { FirebaseError } from 'firebase/app';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { getDeviceId } from '@77/features/account/device-id.service';

import {
  JourneySetupConflictError,
  loadJourneySetup,
  saveJourneySetup,
} from './journey-setup.service';
import type { IJourneySetupSnapshot, ISaveJourneySetupInput } from './journey-setup.service';

export type TJourneySetupChanges = Omit<
  ISaveJourneySetupInput,
  'userId' | 'deviceId' | 'expectedDraftRevision' | 'expectedDeviceRevision'
>;

export const useJourneySetupPersistence = (
  userId: string,
  onLoad: (snapshot: IJourneySetupSnapshot) => void,
) => {
  const handleLoaded = useEffectEvent(onLoad);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const session = useRef<{
    deviceId: string;
    draftRevision: number | null;
    deviceRevision: number | null;
  } | null>(null);
  const pendingSave = useRef<Promise<boolean> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentLoad = true;
    session.current = null;

    const load = async () => {
      try {
        const deviceId = await getDeviceId();
        const loadedSnapshot = await loadJourneySetup(userId, deviceId);
        if (!isCurrentLoad) return;

        session.current = {
          deviceId,
          draftRevision: loadedSnapshot.draft?.revision ?? null,
          deviceRevision: loadedSnapshot.devicePreferences?.revision ?? null,
        };
        handleLoaded(loadedSnapshot);
        setHasConflict(false);
      } catch (error) {
        if (!isCurrentLoad) return;
        const errorCode = error instanceof FirebaseError ? error.code : 'unknown';
        console.warn('Journey setup could not be loaded.', { errorCode });
        setErrorMessage(
          errorCode === 'permission-denied' || errorCode === 'unauthenticated'
            ? 'We couldn’t access your setup. Try again, or sign out and sign in again.'
            : 'We couldn’t load your saved setup. Check your connection and try again.',
        );
      } finally {
        if (isCurrentLoad) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isCurrentLoad = false;
    };
  }, [userId, loadAttempt]);

  const save = async (changes: TJourneySetupChanges): Promise<boolean> => {
    if (pendingSave.current) return false;
    const currentSession = session.current;
    if (!currentSession || !isMounted.current || hasConflict) return false;

    setIsSaving(true);
    setErrorMessage(null);
    const savePromise = (async () => {
      try {
        await saveJourneySetup({
          ...changes,
          userId,
          deviceId: currentSession.deviceId,
          expectedDraftRevision: currentSession.draftRevision,
          expectedDeviceRevision: currentSession.deviceRevision,
        });
        currentSession.draftRevision = (currentSession.draftRevision ?? -1) + 1;
        currentSession.deviceRevision = (currentSession.deviceRevision ?? -1) + 1;
        return true;
      } catch (error) {
        if (!isMounted.current) return false;
        if (error instanceof JourneySetupConflictError) {
          setHasConflict(true);
          setErrorMessage(
            'Your setup changed in another session. Your edits are still shown here. Copy any writing you want to keep, then load the saved setup before editing again.',
          );
        } else {
          setErrorMessage(
            'Your latest changes haven’t been saved. Check your connection and try again.',
          );
        }
        return false;
      } finally {
        pendingSave.current = null;
        if (isMounted.current) setIsSaving(false);
      }
    })();
    pendingSave.current = savePromise;
    return savePromise;
  };

  const reload = () => {
    if (pendingSave.current) return;
    setIsLoading(true);
    setErrorMessage(null);
    setLoadAttempt((previousAttempt) => previousAttempt + 1);
  };

  return {
    isLoading,
    isSaving,
    errorMessage,
    hasConflict,
    save,
    reload,
    getDraftRevision: () => session.current?.draftRevision ?? null,
  };
};
