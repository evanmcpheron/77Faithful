import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@77/lib/firebase';
import { JourneyStatus } from '@77/types/journey/journey.types';

interface IJourneyAccess {
  userId: string;
  hasJourney: boolean;
  hasError: boolean;
}

export const useJourneyAccess = (userId: string | null) => {
  const [access, setAccess] = useState<IJourneyAccess | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  if (access !== null && access.userId !== userId) {
    setAccess(null);
  }

  useEffect(() => {
    if (!userId) return;

    const journeyQuery = query(
      collection(db, 'users', userId, 'journeys'),
      where('state.status', 'in', Object.values(JourneyStatus)),
      limit(1),
    );

    return onSnapshot(
      journeyQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        // An empty cache does not establish that this account has no journey.
        if (snapshot.empty && snapshot.metadata.fromCache) return;
        setAccess({ userId, hasJourney: !snapshot.empty, hasError: false });
      },
      (error) => {
        console.error('Unable to load journey access.', error);
        setAccess({ userId, hasJourney: false, hasError: true });
      },
    );
  }, [userId, retryCount]);

  const retry = () => {
    setAccess(null);
    setRetryCount((previousCount) => previousCount + 1);
  };

  return {
    isLoading: userId !== null && access?.userId !== userId,
    hasJourney: access?.userId === userId && access?.hasJourney === true,
    hasError: access?.userId === userId && access?.hasError === true,
    retry,
  };
};
