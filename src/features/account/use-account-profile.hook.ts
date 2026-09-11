import type { IUserProfileDocument } from '@td/types/account/user.types';
import { useEffect, useRef, useState } from 'react';
import {
	AccountProfileConflictError,
	loadAccountProfile,
	savePreferredName,
} from './account-profile.service';

export const useAccountProfile = (userId: string) => {
	const [profile, setProfile] = useState<Pick<
		IUserProfileDocument,
		'preferredName' | 'revision'
	> | null>(null);
	const [name, setName] = useState('');
	const [attempt, setAttempt] = useState(0);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [conflict, setConflict] = useState(false);
	const busy = useRef(false);
	useEffect(() => {
		let current = true;
		void loadAccountProfile(userId)
			.then(
				(next) => {
					if (!current) return;
					setProfile(next);
					setName(next.preferredName ?? '');
					setConflict(false);
					setSaved(false);
				},
				() => {
					if (current)
						setError(
							'We could not load your profile. Please try again.',
						);
				},
			)
			.finally(() => {
				if (current) setLoading(false);
			});
		return () => {
			current = false;
		};
	}, [userId, attempt]);
	const validationError =
		name.trim().length > 80 ? 'Use no more than 80 characters.' : undefined;
	const save = async () => {
		if (!profile || loading || busy.current || validationError || conflict)
			return;
		busy.current = true;
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const next = await savePreferredName(userId, {
				revision: profile.revision,
				preferredName: name,
			});
			setProfile(next);
			setName(next.preferredName ?? '');
			setSaved(true);
		} catch (cause) {
			const isConflict = cause instanceof AccountProfileConflictError;
			setConflict(isConflict);
			setError(
				isConflict
					? cause.message
					: 'We could not save your name. Check your connection and try again.',
			);
		} finally {
			busy.current = false;
			setSaving(false);
		}
	};
	return {
		name,
		loading,
		saving,
		error,
		saved,
		validationError,
		canSave:
			!!profile &&
			!loading &&
			!saving &&
			!conflict &&
			!validationError &&
			(name.trim() || null) !== profile.preferredName,
		canReload: !loading && !saving && (!profile || conflict),
		changeName: (value: string) => {
			setName(value);
			setSaved(false);
		},
		reload: () => {
			setLoading(true);
			setError(null);
			setAttempt((value) => value + 1);
		},
		save,
	};
};
