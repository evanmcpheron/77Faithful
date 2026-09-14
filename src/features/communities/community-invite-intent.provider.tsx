import { useAuth } from '@td/providers/auth/auth.hook';
import { useJourneyAccess } from '@td/providers/journey/journey-access.provider';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { usePathname, useRouter } from 'expo-router';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
	createCommunityInviteIntent,
	deleteCommunityInviteIntent,
	isCommunityInviteIntentExpired,
	loadCommunityInviteIntent,
	parseCommunityInvitationUrl,
	saveCommunityInviteIntent,
	type ICommunityInviteIntent,
} from './community-invite-intent';

interface ICommunityInviteIntentContext {
	pendingCode: string | null;
	cancel: () => Promise<void>;
	complete: () => Promise<void>;
	recordPreviewExpiry: (expiresAtSeconds: number) => Promise<void>;
}

const CommunityInviteIntentContext =
	createContext<ICommunityInviteIntentContext | null>(null);

const asStringArray = (value: unknown): string[] => {
	if (typeof value === 'string') return [value];
	if (Array.isArray(value))
		return value.filter((item): item is string => typeof item === 'string');
	return [];
};

const getInvitationLinkConfiguration = () => {
	const expoConfig = Constants.expoConfig;
	const schemes = asStringArray(expoConfig?.scheme);
	const ownedHosts = asStringArray(expoConfig?.ios?.associatedDomains)
		.filter((domain) => domain.startsWith('applinks:'))
		.map((domain) => domain.slice('applinks:'.length));
	const androidIntentFilters: unknown = expoConfig?.android?.intentFilters;
	if (Array.isArray(androidIntentFilters)) {
		for (const filter of androidIntentFilters) {
			if (!filter || typeof filter !== 'object') continue;
			const data = (filter as Record<string, unknown>)['data'];
			for (const entry of Array.isArray(data) ? data : [data]) {
				if (!entry || typeof entry !== 'object') continue;
				const host = (entry as Record<string, unknown>)['host'];
				const scheme = (entry as Record<string, unknown>)['scheme'];
				if (scheme === 'https' && typeof host === 'string')
					ownedHosts.push(host);
			}
		}
	}
	return { schemes, ownedHosts };
};

const isPrivateWritingRoute = (pathname: string): boolean =>
	/^\/journeys\/[^/]+\/days\/[^/]+\/reflection$/.test(pathname);

export const CommunityInviteIntentProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { account, isInitializing, isProfileReady } = useAuth();
	const journeyAccess = useJourneyAccess();
	const pathname = usePathname();
	const router = useRouter();
	const [intent, setIntent] = useState<ICommunityInviteIntent | null>(null);
	const [restored, setRestored] = useState(false);
	const intentRef = useRef<ICommunityInviteIntent | null>(null);
	const accountRef = useRef(account);
	const handledUrls = useRef(new Map<string, number>());
	const lastNavigation = useRef<string | null>(null);
	const operationQueue = useRef(Promise.resolve());
	useEffect(() => {
		intentRef.current = intent;
	}, [intent]);
	useEffect(() => {
		accountRef.current = account;
	}, [account]);

	const commitIntent = useCallback(
		async (nextIntent: ICommunityInviteIntent | null) => {
			intentRef.current = nextIntent;
			setIntent(nextIntent);
			try {
				if (nextIntent) await saveCommunityInviteIntent(nextIntent);
				else await deleteCommunityInviteIntent();
			} catch {
				// The in-memory intent remains usable for this session.
			}
		},
		[],
	);

	const clear = useCallback(async () => {
		lastNavigation.current = null;
		await commitIntent(null);
	}, [commitIntent]);

	useEffect(() => {
		const subscription = AppState.addEventListener(
			'change',
			(nextState) => {
				const current = intentRef.current;
				if (
					nextState === 'active' &&
					current &&
					isCommunityInviteIntentExpired(current, Date.now())
				)
					void clear();
			},
		);
		return () => subscription.remove();
	}, [clear]);

	useEffect(() => {
		let current = true;
		const configuration = getInvitationLinkConfiguration();
		const receive = (url: string) => {
			const receivedAt = Date.now();
			const previousReceipt = handledUrls.current.get(url);
			if (previousReceipt && receivedAt - previousReceipt < 2_000) return;
			handledUrls.current.set(url, receivedAt);
			operationQueue.current = operationQueue.current.then(async () => {
				const code = parseCommunityInvitationUrl(url, configuration);
				if (!code || !current) return;
				const existing = intentRef.current;
				if (existing?.code === code) return;
				await commitIntent(
					createCommunityInviteIntent(
						code,
						receivedAt,
						accountRef.current?.userId ?? null,
					),
				);
			});
		};
		const subscription = Linking.addEventListener('url', ({ url }) =>
			receive(url),
		);
		void loadCommunityInviteIntent()
			.then((storedIntent) => {
				if (!current) return;
				if (
					storedIntent &&
					!isCommunityInviteIntentExpired(storedIntent, Date.now())
				) {
					intentRef.current = storedIntent;
					setIntent(storedIntent);
				} else if (storedIntent) {
					void deleteCommunityInviteIntent();
				}
			})
			.catch(() => undefined)
			.finally(() => {
				if (!current) return;
				setRestored(true);
				void Linking.getInitialURL().then((url) => {
					if (url) receive(url);
				});
			});
		return () => {
			current = false;
			subscription.remove();
		};
	}, [commitIntent]);

	useEffect(() => {
		if (!restored || isInitializing || !intent) return;
		if (isCommunityInviteIntentExpired(intent, Date.now())) {
			void Promise.resolve().then(clear);
			return;
		}
		if (intent.boundUserId) {
			if (!account || account.userId !== intent.boundUserId) {
				void Promise.resolve().then(clear);
				return;
			}
		} else if (account) {
			void Promise.resolve().then(() =>
				commitIntent({ ...intent, boundUserId: account.userId }),
			);
			return;
		}

		if (isPrivateWritingRoute(pathname)) return;
		let destination: '/' | '/confirm-email' | '/communities/join';
		if (!account) destination = '/';
		else if (!account.isEmailConfirmed || !isProfileReady)
			destination = '/confirm-email';
		else {
			if (journeyAccess.isLoading || journeyAccess.hasError) return;
			destination = '/communities/join';
		}
		if (pathname === destination || lastNavigation.current === destination)
			return;
		lastNavigation.current = destination;
		router.replace(destination);
	}, [
		account,
		clear,
		commitIntent,
		intent,
		isInitializing,
		isProfileReady,
		journeyAccess.hasError,
		journeyAccess.isLoading,
		pathname,
		restored,
		router,
	]);

	const recordPreviewExpiry = useCallback(
		async (expiresAtSeconds: number) => {
			const current = intentRef.current;
			if (!current || !Number.isSafeInteger(expiresAtSeconds)) return;
			const expiresAt = Math.min(
				current.expiresAt,
				expiresAtSeconds * 1_000,
			);
			if (expiresAt <= Date.now()) {
				await clear();
				return;
			}
			await commitIntent({ ...current, expiresAt });
		},
		[clear, commitIntent],
	);

	const value = useMemo<ICommunityInviteIntentContext>(
		() => ({
			pendingCode: intent?.code ?? null,
			cancel: clear,
			complete: clear,
			recordPreviewExpiry,
		}),
		[clear, intent?.code, recordPreviewExpiry],
	);
	return (
		<CommunityInviteIntentContext.Provider value={value}>
			{children}
		</CommunityInviteIntentContext.Provider>
	);
};

export const useCommunityInviteIntent = () => {
	const context = useContext(CommunityInviteIntentContext);
	if (!context)
		throw new Error(
			'useCommunityInviteIntent must be used within CommunityInviteIntentProvider.',
		);
	return context;
};
