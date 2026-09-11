import type { WithFieldValue } from 'firebase/firestore';
import {
	collection,
	doc,
	runTransaction,
	serverTimestamp,
	Timestamp,
} from 'firebase/firestore';

import { db } from '@td/services/firebase/firebase.instance';
import type { IDevicePreferencesDocument } from '@td/types/account/device-preferences.types';
import type { IJourneySetupDraftDocument } from '@td/types/account/journey-setup.types';
import type {
	IWritingHead,
	IWritingRevisionDocument,
} from '@td/types/journey/journey-writing.types';
import { WritingKind } from '@td/types/journey/journey-writing.types';
import { DomainSchemaVersion } from '@td/types/shared/persistence.types';

export interface IJourneySetupSnapshot {
	draft: IJourneySetupDraftDocument | null;
	devicePreferences: IDevicePreferencesDocument | null;
}

export interface ISaveJourneySetupInput {
	userId: string;
	deviceId: string;
	expectedDraftRevision: number | null;
	expectedDeviceRevision: number | null;
	currentStep: IJourneySetupDraftDocument['currentStep'];
	choices: IJourneySetupDraftDocument['choices'];
	motivation: string;
	morningReminder: IDevicePreferencesDocument['morningReminder'];
	eveningReflectionReminder: IDevicePreferencesDocument['eveningReflectionReminder'];
}

export class JourneySetupConflictError extends Error {
	constructor() {
		super('Journey setup changed in another session.');
		this.name = 'JourneySetupConflictError';
	}
}

export const loadJourneySetup = async (
	userId: string,
	deviceId: string,
): Promise<IJourneySetupSnapshot> => {
	return runTransaction(db, async (transaction) => {
		const draftSnapshot = await transaction.get(
			doc(db, 'users', userId, 'journeySetupDrafts', 'current'),
		);
		const deviceSnapshot = await transaction.get(
			doc(db, 'users', userId, 'devicePreferences', deviceId),
		);

		// These private documents are written with the shared contracts and validated by Firestore rules.
		return {
			draft: draftSnapshot.exists()
				? (draftSnapshot.data() as IJourneySetupDraftDocument)
				: null,
			devicePreferences: deviceSnapshot.exists()
				? (deviceSnapshot.data() as IDevicePreferencesDocument)
				: null,
		};
	});
};

export const saveJourneySetup = async (
	input: ISaveJourneySetupInput,
): Promise<void> => {
	const draftReference = doc(
		db,
		'users',
		input.userId,
		'journeySetupDrafts',
		'current',
	);
	const deviceReference = doc(
		db,
		'users',
		input.userId,
		'devicePreferences',
		input.deviceId,
	);
	const writingReference = doc(
		collection(draftReference, 'writingRevisions'),
	);
	const recordedOnDeviceAt = Timestamp.now();
	const motivation = input.motivation.trim() || null;

	await runTransaction(db, async (transaction) => {
		const draftSnapshot = await transaction.get(draftReference);
		const deviceSnapshot = await transaction.get(deviceReference);
		const draft = draftSnapshot.data() as
			IJourneySetupDraftDocument | undefined;
		const devicePreferences = deviceSnapshot.data() as
			IDevicePreferencesDocument | undefined;

		if (
			(draft?.revision ?? null) !== input.expectedDraftRevision ||
			(devicePreferences?.revision ?? null) !==
				input.expectedDeviceRevision
		) {
			throw new JourneySetupConflictError();
		}

		const previousWriting: IWritingHead | null =
			draft?.startingMotivation ?? null;
		const hasMotivationChanged =
			motivation !== (previousWriting?.text ?? null);
		const startingMotivation: WithFieldValue<IWritingHead> | null =
			hasMotivationChanged
				? {
						revisionId: writingReference.id,
						text: motivation,
						updatedAt: serverTimestamp(),
					}
				: previousWriting;

		if (hasMotivationChanged) {
			const writingRevision: WithFieldValue<IWritingRevisionDocument> = {
				userId: input.userId,
				target: {
					kind: WritingKind.SetupMotivation,
					setupDraftId: 'current',
				},
				baseRevisionId: previousWriting?.revisionId ?? null,
				text: motivation,
				origin: {
					operationId: writingReference.id,
					deviceId: input.deviceId,
					recordedOnDeviceAt,
				},
				savedAt: serverTimestamp(),
			};
			transaction.set(writingReference, writingRevision);
		}

		const nextDraft: WithFieldValue<IJourneySetupDraftDocument> = {
			schemaVersion: DomainSchemaVersion.Current,
			userId: input.userId,
			revision: (input.expectedDraftRevision ?? -1) + 1,
			currentStep: input.currentStep,
			choices: input.choices,
			startingMotivation,
			createdAt: draft?.createdAt ?? serverTimestamp(),
			updatedAt: serverTimestamp(),
		};
		const nextDevicePreferences: WithFieldValue<IDevicePreferencesDocument> =
			{
				schemaVersion: DomainSchemaVersion.Current,
				userId: input.userId,
				revision: (input.expectedDeviceRevision ?? -1) + 1,
				morningReminder: input.morningReminder,
				eveningReflectionReminder: input.eveningReflectionReminder,
				createdAt: devicePreferences?.createdAt ?? serverTimestamp(),
				updatedAt: serverTimestamp(),
			};

		transaction.set(draftReference, nextDraft);
		transaction.set(deviceReference, nextDevicePreferences);
	});
};
