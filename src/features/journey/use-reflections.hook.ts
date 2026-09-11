import { useAuth } from '@td/providers/auth/auth.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { loadReflections } from './reflections.service';
import type { IReflectionCursor, IReflectionPage } from './reflections.types';

export const useReflections = () => {
	const { account, isProfileReady } = useAuth();
	const userId =
		account?.isEmailConfirmed && isProfileReady ? account.userId : null;
	const [pagination, setPagination] = useState<{
		userId: string;
		cursors: (IReflectionCursor | null)[];
	} | null>(null);
	const cursors =
		pagination?.userId === userId ? pagination?.cursors : undefined;
	const cursor = cursors?.at(-1) ?? null;
	const [state, setState] = useState<{
		userId: string;
		cursor: IReflectionCursor | null;
		page: IReflectionPage;
	} | null>(null);
	const [error, setError] = useState(false);
	const generation = useRef(0);
	const refresh = useCallback(async () => {
		const request = ++generation.current;
		setError(false);
		if (!userId) return;
		try {
			const page = await loadReflections(userId, cursor);
			if (request === generation.current)
				setState({ userId, cursor, page });
		} catch {
			if (request === generation.current) setError(true);
		}
	}, [userId, cursor]);
	useFocusEffect(
		useCallback(() => {
			void refresh();
			return () => {
				generation.current++;
			};
		}, [refresh]),
	);
	const page =
		state?.userId === userId && state?.cursor === cursor
			? state?.page
			: null;
	return {
		entries: page?.entries ?? null,
		error,
		refresh,
		hasOlder: Boolean(page?.nextCursor),
		hasNewer: (cursors?.length ?? 1) > 1,
		older: () => {
			if (userId && page?.nextCursor)
				setPagination({
					userId,
					cursors: [...(cursors ?? [null]), page.nextCursor],
				});
		},
		newer: () => {
			if (userId && cursors && cursors.length > 1)
				setPagination({ userId, cursors: cursors.slice(0, -1) });
		},
	};
};
