import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { WithFieldValue } from 'firebase/firestore';

import { db } from '@77/lib/firebase';
import type { IUserProfileDocument } from '@77/types/account/user.types';
import { DomainSchemaVersion } from '@77/types/shared/persistence.types';

export const ensureAccountProfile = async (
  userId: string,
  preferredName: string | null = null,
): Promise<void> => {
  const profileReference = doc(db, 'users', userId);

  // A retry after interrupted registration must never overwrite an existing profile.
  await runTransaction(db, async (transaction) => {
    const profileSnapshot = await transaction.get(profileReference);
    if (profileSnapshot.exists()) return;

    const profile: WithFieldValue<IUserProfileDocument> = {
      schemaVersion: DomainSchemaVersion.Current,
      revision: 0,
      preferredName: preferredName?.trim() || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(profileReference, profile);
  });
};
