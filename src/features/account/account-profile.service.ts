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

type TEditableProfile = Pick<
	IUserProfileDocument,
	'preferredName' | 'revision'
>;

export class AccountProfileConflictError extends Error {}

const readEditableProfile = (data: unknown): TEditableProfile => {
	if (
		!data ||
		typeof data !== 'object' ||
		!('schemaVersion' in data) ||
		data.schemaVersion !== DomainSchemaVersion.Current ||
		!('revision' in data) ||
		typeof data.revision !== 'number' ||
		!Number.isSafeInteger(data.revision) ||
		data.revision < 0 ||
		!('preferredName' in data) ||
		!(
			data.preferredName === null ||
			(typeof data.preferredName === 'string' &&
				data.preferredName.length <= 80)
		)
	)
		throw new Error('Your profile could not be read. Please try again.');
	return { preferredName: data.preferredName, revision: data.revision };
};

export const loadAccountProfile = async (
	userId: string,
): Promise<TEditableProfile> => {
	const snapshot = await getDoc(doc(db, 'users', userId));
	return readEditableProfile(snapshot.data());
};

export const savePreferredName = async (
	userId: string,
	profile: TEditableProfile,
): Promise<TEditableProfile> => {
	const preferredName = profile.preferredName?.trim() || null;
	if (preferredName && preferredName.length > 80) {
		throw new Error(
			'Use a preferred name with no more than 80 characters.',
		);
	}
	const reference = doc(db, 'users', userId);
	return runTransaction(db, async (transaction) => {
		const current = readEditableProfile(
			(await transaction.get(reference)).data(),
		);
		if (current.revision !== profile.revision) {
			throw new AccountProfileConflictError(
				'Your name changed on another device. Reload your profile before saving again.',
			);
		}
		const updated = { preferredName, revision: current.revision + 1 };
		transaction.update(reference, {
			...updated,
			updatedAt: serverTimestamp(),
		});
		return updated;
	});
};

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
