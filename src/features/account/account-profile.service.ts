import type { WithFieldValue } from 'firebase/firestore';
import {
	doc,
	getDoc,
	runTransaction,
	serverTimestamp,
} from 'firebase/firestore';

import { db } from '@td/services/firebase/firebase.instance';
import type { IUserProfileDocument } from '@td/types/account/user.types';
import { DomainSchemaVersion } from '@td/types/shared/persistence.types';

export const ensureAccountProfile = async (
	userId: string,
	preferredName: string | null = null,
): Promise<void> => {
	const name = preferredName?.trim() || null;
	if (name && name.length > 80) {
		throw new Error(
			'Use a preferred name with no more than 80 characters.',
		);
	}
	const profileReference = doc(db, 'users', userId);

	// Existing profiles can be restored from Firestore's cache while offline.
	if ((await getDoc(profileReference)).exists()) return;

	// A retry after interrupted registration must never overwrite an existing profile.
	await runTransaction(db, async (transaction) => {
		const profileSnapshot = await transaction.get(profileReference);
		if (profileSnapshot.exists()) return;

		const profile: WithFieldValue<IUserProfileDocument> = {
			schemaVersion: DomainSchemaVersion.Current,
			revision: 0,
			preferredName: name,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		};
		transaction.set(profileReference, profile);
	});
};
