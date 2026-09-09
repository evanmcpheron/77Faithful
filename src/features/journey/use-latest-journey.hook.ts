import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@77/lib/firebase';
import type { IJourneyDocument } from '@77/types/journey/journey.types';

interface ILatestJourneyState {
  userId: string;
  journey: IJourneyDocument | null;
  hasError: boolean;
}

export const useLatestJourney = (userId: string | null) => {
  const [result, setResult] = useState<ILatestJourneyState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  if (result !== null && result.userId !== userId) setResult(null);

  useEffect(() => {
    if (!userId) return;

    return onSnapshot(
      query(collection(db, 'users', userId, 'journeys'), orderBy('createdAt', 'desc'), limit(1)),
      { includeMetadataChanges: true },
      (snapshot) => {
        // Keep waiting when the local cache cannot establish whether a journey exists.
        if (snapshot.empty && snapshot.metadata.fromCache) return;
        setResult({
          userId,
          // Journeys are server-owned records using the shared contract.
          journey: snapshot.empty ? null : (snapshot.docs[0].data() as IJourneyDocument),
          hasError: false,
        });
      },
      (error) => {
        console.warn('Could not load the journey.', { code: error.code });
        setResult({ userId, journey: null, hasError: true });
      },
    );
  }, [userId, retryCount]);

  const retry = () => {
    setResult(null);
    setRetryCount((count) => count + 1);
  };

  return {
    journey: result?.userId === userId ? result?.journey : null,
    isLoading: userId !== null && result?.userId !== userId,
    hasError: result?.userId === userId && result?.hasError === true,
    retry,
  };
};
