import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { IOwnCommunityContribution } from '@td/types/community/community-post-function.types';
import { useFocusEffect } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import {
	createCommunityPostOperationId,
	deleteCommunityPost,
	deleteCommunityReply,
	getCommunityPostReason,
	listOwnCommunityContributions,
} from '../community-post.service';

const contributionKey = (item: IOwnCommunityContribution) =>
	`${item.communityId}:${item.postId}:${item.replyId ?? ''}`;

type TDeleteRequest =
	| {
			kind: 'Post';
			communityId: string;
			postId: string;
			expectedRevision: number;
			operationId: string;
	  }
	| {
			kind: 'Reply';
			communityId: string;
			postId: string;
			replyId: string;
			expectedRevision: number;
			operationId: string;
	  };

const SharedContributionsContent = ({ userId }: { userId: string | null }) => {
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const [rows, setRows] = useState<IOwnCommunityContribution[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [status, setStatus] = useState<
		'Loading' | 'Ready' | 'Error' | 'Unavailable'
	>('Loading');
	const [message, setMessage] = useState<string | null>(null);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [deletingKey, setDeletingKey] = useState<string | null>(null);
	const generation = useRef(0);
	const busy = useRef(false);
	const deleted = useRef(new Set<string>());
	const pendingDelete = useRef<{
		key: string;
		request: TDeleteRequest;
	} | null>(null);

	const applyDeleted = (
		items: IOwnCommunityContribution[],
	): IOwnCommunityContribution[] =>
		items.map((item) => {
			if (!deleted.current.has(contributionKey(item))) return item;
			const { text: _text, ...withoutText } = item;
			return { ...withoutText, publicationStatus: 'AuthorDeleted' };
		});

	const load = async (mode: 'Initial' | 'Refresh' | 'More') => {
		if (!userId || busy.current || (mode === 'More' && !cursor)) return;
		busy.current = true;
		const currentGeneration = generation.current;
		if (mode === 'Initial') setStatus('Loading');
		if (mode === 'Refresh') setRefreshing(true);
		if (mode === 'More') setLoadingMore(true);
		setMessage(null);
		try {
			const page = await listOwnCommunityContributions({
				pageSize: 20,
				...(mode === 'More' && cursor ? { cursor } : {}),
			});
			if (currentGeneration !== generation.current) return;
			setRows((previous) => {
				const incoming = applyDeleted(page.contributions);
				if (mode !== 'More') return incoming;
				const known = new Set(previous.map(contributionKey));
				return [
					...previous,
					...incoming.filter(
						(item) => !known.has(contributionKey(item)),
					),
				];
			});
			setCursor(page.nextCursor);
			setStatus('Ready');
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunityPostReason(error);
			if (
				reason === 'AuthenticationRequired' ||
				reason === 'EmailVerificationRequired' ||
				reason === 'AccountUnavailable'
			) {
				setRows([]);
				setCursor(null);
				setStatus('Unavailable');
			} else if (mode === 'Initial') setStatus('Error');
			else setMessage('We couldn’t load contributions. Try again.');
		} finally {
			if (currentGeneration === generation.current) {
				busy.current = false;
				setRefreshing(false);
				setLoadingMore(false);
			}
		}
	};

	useFocusEffect(
		useCallback(() => {
			generation.current += 1;
			busy.current = false;
			if (userId) void load('Initial');
			else {
				setRows([]);
				setCursor(null);
				pendingDelete.current = null;
				setStatus('Unavailable');
			}
			return () => {
				generation.current += 1;
				busy.current = false;
			};
			// A new account remounts this content; focus changes invalidate in-flight results.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId]),
	);

	const remove = async (item: IOwnCommunityContribution) => {
		const key = contributionKey(item);
		if (deletingKey || item.publicationStatus !== 'Published') return;
		const request: TDeleteRequest =
			pendingDelete.current?.key === key
				? pendingDelete.current.request
				: item.kind === 'Reply' && item.replyId
					? {
							kind: 'Reply',
							communityId: item.communityId,
							postId: item.postId,
							replyId: item.replyId,
							expectedRevision: item.revision,
							operationId: createCommunityPostOperationId(),
						}
					: {
							kind: 'Post',
							communityId: item.communityId,
							postId: item.postId,
							expectedRevision: item.revision,
							operationId: createCommunityPostOperationId(),
						};
		pendingDelete.current = { key, request };
		const currentGeneration = generation.current;
		setDeletingKey(key);
		setMessage(null);
		try {
			if (request.kind === 'Reply') await deleteCommunityReply(request);
			else await deleteCommunityPost(request);
			if (currentGeneration !== generation.current) return;
			deleted.current.add(key);
			pendingDelete.current = null;
			setRows((previous) => applyDeleted(previous));
			setMessage('Shared contribution deleted.');
		} catch (error: unknown) {
			if (currentGeneration !== generation.current) return;
			const reason = getCommunityPostReason(error);
			if (reason) pendingDelete.current = null;
			if (
				reason === 'RevisionConflict' ||
				reason === 'PostUnavailable' ||
				reason === 'ReplyUnavailable'
			) {
				setMessage(
					'This contribution changed. Refresh the list before trying again.',
				);
			} else if (
				reason === 'PostAuthorRequired' ||
				reason === 'ReplyAuthorRequired' ||
				reason === 'AuthenticationRequired' ||
				reason === 'EmailVerificationRequired' ||
				reason === 'AccountUnavailable'
			) {
				setRows([]);
				setCursor(null);
				setStatus('Unavailable');
			} else {
				setMessage(
					'We couldn’t confirm the deletion. Try again to confirm the same request.',
				);
			}
		} finally {
			if (currentGeneration === generation.current) setDeletingKey(null);
		}
	};

	const confirmDelete = (item: IOwnCommunityContribution) =>
		Alert.alert(
			`Delete this shared ${item.kind.toLowerCase()}?`,
			'This removes the readable shared contribution, not your original private reflection. Words already viewed or copied by others cannot be recalled.',
			[
				{ text: 'Keep contribution', style: 'cancel' },
				{
					text: 'Delete contribution',
					style: 'destructive',
					onPress: () => void remove(item),
				},
			],
		);

	const header = (
		<View
			style={{
				paddingTop: headerHeight,
				gap: Spacing.Small,
				paddingBottom: Spacing.Large,
			}}
		>
			<Typography
				tone='Secondary'
				weight='Regular'
			>
				Posts and replies you deliberately shared remain after you leave
				or are removed from a community. You can delete each one here.
			</Typography>
			{message ? (
				<View accessibilityLiveRegion='polite'>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						{message}
					</Typography>
				</View>
			) : null}
			{status === 'Loading' ? (
				<Typography>Loading shared contributions…</Typography>
			) : null}
			{status === 'Error' ? (
				<>
					<Typography>
						We couldn’t load your shared contributions.
					</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => void load('Initial')}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{status === 'Unavailable' ? (
				<>
					<Typography>
						Your shared contributions are unavailable. Check your
						account access and try again.
					</Typography>
					<TurndownButton
						variant='Outline'
						onPress={() => void load('Initial')}
					>
						Try again
					</TurndownButton>
				</>
			) : null}
			{status === 'Ready' && rows.length === 0 ? (
				<Typography>
					You have no shared contributions to show.
				</Typography>
			) : null}
		</View>
	);

	return (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled={false}
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			data={rows}
			keyExtractor={contributionKey}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => (
				<View style={{ height: Spacing.Small }} />
			)}
			renderItem={({ item }) => (
				<Card testID={`own-contribution-${contributionKey(item)}`}>
					<View style={{ gap: Spacing.Small }}>
						<Typography size='H3'>
							{item.kind === 'Reply' ? 'Reply' : 'Post'} ·{' '}
							{item.publicationStatus === 'Published'
								? 'Shared'
								: item.publicationStatus === 'AuthorDeleted'
									? 'Deleted'
									: 'Removed'}
						</Typography>
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							Community {item.communityId} ·{' '}
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: 'medium',
							}).format(new Date(item.createdAt.seconds * 1000))}
						</Typography>
						{item.publicationStatus === 'Published' && item.text ? (
							<Typography>{item.text}</Typography>
						) : null}
						{item.publicationStatus === 'Published' ? (
							<TurndownButton
								variant='Outline'
								tone='Error'
								disabled={deletingKey !== null}
								loading={deletingKey === contributionKey(item)}
								onPress={() => confirmDelete(item)}
							>
								Delete shared {item.kind.toLowerCase()}
							</TurndownButton>
						) : null}
					</View>
				</Card>
			)}
			refreshing={refreshing}
			onRefresh={
				status === 'Ready' ? () => void load('Refresh') : undefined
			}
			ListFooterComponent={
				status === 'Ready' && cursor ? (
					<View style={{ paddingVertical: Spacing.Large }}>
						<TurndownButton
							variant='Outline'
							disabled={loadingMore}
							loading={loadingMore}
							onPress={() => void load('More')}
						>
							Load more
						</TurndownButton>
					</View>
				) : null
			}
			testID='shared-contributions-screen'
		/>
	);
};

export const SharedContributionsScreen = () => {
	const { account } = useAuth();
	const userId = account?.userId ?? null;
	return (
		<SharedContributionsContent
			key={userId ?? 'signed-out'}
			userId={userId}
		/>
	);
};
