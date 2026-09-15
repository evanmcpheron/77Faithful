import { Input } from '@td/components/form/input/input.component';
import { TurndownListScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type {
	ICreateCommunityReplyRequest,
	IEditCommunityReplyRequest,
} from '@td/types/community/community-post-function.types';
import {
	CommunityContentStatus,
	PrayerRequestStatus,
	type ICommunityPost,
	type ICommunityPrayerSupporter,
	type ICommunityReply,
	type TPrayerRequestStatus,
} from '@td/types/community/community-post.types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { CommunityPostLimits } from '../community-post';
import {
	createCommunityPostOperationId,
	createCommunityReply,
	deleteCommunityPost,
	deleteCommunityReply,
	editCommunityReply,
	getCommunityPost,
	getCommunityPostReason,
	listCommunityPrayerSupport,
	listCommunityReplies,
	setCommunityPrayerAcknowledgment,
	setCommunityPrayerRequestStatus,
} from '../community-post.service';
import {
	blockCommunityMember,
	createCommunitySafetyOperationId,
	getCommunitySafetyReason,
} from '../community-safety.service';
import { useCommunityContext } from '../use-community-context.hook';
import { communityPostStyles as styles } from './community-post.styles';

const postTypeLabels = {
	PrayerRequest: 'Prayer request',
	Discussion: 'Discussion',
	OrganizerAnnouncement: 'Announcement',
	SharedReflectionCopy: 'Shared reflection',
} as const;

const prayerStatusLabels: Record<TPrayerRequestStatus, string> = {
	Current: 'Current',
	NoLongerCurrent: 'No longer current',
	Answered: 'Answered',
};

const unavailableReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'MembershipUnavailable',
	'PostUnavailable',
]);

type TThreadState =
	| { status: 'Loading' }
	| { status: 'Unavailable' }
	| { status: 'Error' }
	| {
			status: 'Ready';
			post: ICommunityPost;
			replies: ICommunityReply[];
			replyCount: number;
			nextReplyCursor: string | null;
			supporters: ICommunityPrayerSupporter[];
			supportCount: number;
			viewerIsPraying: boolean;
			supportUnavailable: boolean;
			isRefreshing: boolean;
			isLoadingMore: boolean;
			loadMoreError: boolean;
	  };

interface IReplyEditState {
	replyId: string;
	text: string;
	submitted: boolean;
	saving: boolean;
	uncertain: boolean;
	message: string | null;
}

const formatTimestamp = ({
	seconds,
	nanoseconds,
}: {
	seconds: number;
	nanoseconds: number;
}): string =>
	new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(seconds * 1_000 + Math.floor(nanoseconds / 1_000_000)));

const publishedReplyText = (reply: ICommunityReply): string | null =>
	reply.publication.status === CommunityContentStatus.Published
		? reply.publication.text
		: null;

const isPublishedPrayerRequest = (post: ICommunityPost): boolean =>
	post.publication.status === CommunityContentStatus.Published &&
	post.publication.content.postType === 'PrayerRequest';

const isCurrentPrayerRequest = (post: ICommunityPost): boolean =>
	post.publication.status === CommunityContentStatus.Published &&
	post.publication.content.postType === 'PrayerRequest' &&
	post.publication.content.prayerRequestStatus ===
		PrayerRequestStatus.Current;

const mergeReplies = (
	current: ICommunityReply[],
	next: ICommunityReply[],
): ICommunityReply[] => {
	const replyIds = new Set(current.map((reply) => reply.replyId));
	return [
		...current,
		...next.filter((reply) => !replyIds.has(reply.replyId)),
	];
};

interface ICommunityReplyCardProps {
	reply: ICommunityReply;
	viewerUserId: string;
	communityIsActive: boolean;
	editState: IReplyEditState | null;
	onBeginEdit: (reply: ICommunityReply) => void;
	onChangeEdit: (text: string) => void;
	onCancelEdit: () => void;
	onSaveEdit: () => void;
	onDelete: (reply: ICommunityReply) => void;
	onReport: (reply: ICommunityReply) => void;
	onBlock: (reply: ICommunityReply) => void;
}

const CommunityReplyCard = ({
	reply,
	viewerUserId,
	communityIsActive,
	editState,
	onBeginEdit,
	onChangeEdit,
	onCancelEdit,
	onSaveEdit,
	onDelete,
	onReport,
	onBlock,
}: ICommunityReplyCardProps) => {
	const text = publishedReplyText(reply);
	const isAuthor = reply.author.userId === viewerUserId;
	const isEditing = editState?.replyId === reply.replyId;
	const editError = isEditing
		? !editState.text.trim()
			? 'Write something before saving your reply.'
			: editState.text.length > CommunityPostLimits.text
				? `Use ${CommunityPostLimits.text.toLocaleString()} characters or fewer.`
				: undefined
		: undefined;
	const tombstone =
		reply.publication.status === CommunityContentStatus.AuthorDeleted
			? 'Reply deleted by its author.'
			: reply.publication.status ===
				  CommunityContentStatus.ModeratorRemoved
				? 'Reply removed by a moderator.'
				: null;

	return (
		<Card testID={`community-reply-${reply.replyId}`}>
			<View style={styles.cardContent}>
				<View style={styles.headingRow}>
					<Typography weight='Semibold'>
						{reply.author.displayName || 'Name unavailable'}
					</Typography>
					<Typography
						size='Body2'
						tone='Secondary'
						weight='Regular'
					>
						{formatTimestamp(reply.createdAt)}
						{reply.editedAt ? ' · Edited' : ''}
					</Typography>
				</View>
				{isEditing && editState ? (
					<View style={styles.section}>
						<Input
							label='Edit reply'
							value={editState.text}
							onChange={onChangeEdit}
							readOnly={editState.saving || editState.uncertain}
							multiline
							ignoreForm
							testID={`edit-reply-${reply.replyId}`}
							{...(editState.submitted && editError
								? { errorMessage: editError }
								: {})}
						/>
						<Typography
							size='Body2'
							tone='Secondary'
							weight='Regular'
							style={styles.count}
						>
							{editState.text.length.toLocaleString()} /{' '}
							{CommunityPostLimits.text.toLocaleString()}
						</Typography>
						{editState.message ? (
							<Typography
								tone='Error'
								weight='Regular'
							>
								{editState.message}
							</Typography>
						) : null}
						<View style={styles.inlineActions}>
							<TurndownButton
								loading={editState.saving}
								disabled={editState.saving}
								testID={`save-reply-${reply.replyId}`}
								onPress={onSaveEdit}
							>
								{editState.uncertain ? 'Retry save' : 'Save'}
							</TurndownButton>
							<TurndownButton
								variant='Outline'
								disabled={editState.saving}
								onPress={onCancelEdit}
							>
								Cancel
							</TurndownButton>
						</View>
					</View>
				) : (
					<>
						{tombstone ? (
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{tombstone}
							</Typography>
						) : (
							<Typography weight='Regular'>{text}</Typography>
						)}
						{isAuthor && text ? (
							<View style={styles.inlineActions}>
								{communityIsActive ? (
									<TurndownButton
										variant='Ghost'
										size='Small'
										onPress={() => onBeginEdit(reply)}
									>
										Edit
									</TurndownButton>
								) : null}
								<TurndownButton
									variant='Ghost'
									size='Small'
									onPress={() => onDelete(reply)}
								>
									Delete
								</TurndownButton>
							</View>
						) : null}
						{text && !isAuthor ? (
							<TurndownButton
								variant='Ghost'
								size='Small'
								onPress={() => onReport(reply)}
								testID={`report-reply-${reply.replyId}`}
							>
								Report reply
							</TurndownButton>
						) : null}
						{text && !isAuthor && communityIsActive ? (
							<TurndownButton
								variant='Ghost'
								size='Small'
								onPress={() => onBlock(reply)}
								testID={`block-reply-author-${reply.replyId}`}
							>
								Block member
							</TurndownButton>
						) : null}
					</>
				)}
			</View>
		</Card>
	);
};

const CommunityPostContent = ({
	userId,
	communityId,
	postId,
}: {
	userId: string;
	communityId: string;
	postId: string;
}) => {
	const router = useRouter();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const { state: contextState, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [threadState, setThreadState] = useState<TThreadState>({
		status: 'Loading',
	});
	const [loadAttempt, setLoadAttempt] = useState(0);
	const [replyDraft, setReplyDraft] = useState('');
	const [replySubmitted, setReplySubmitted] = useState(false);
	const [replySaving, setReplySaving] = useState(false);
	const [replyUncertain, setReplyUncertain] = useState(false);
	const [replyMessage, setReplyMessage] = useState<string | null>(null);
	const [editState, setEditState] = useState<IReplyEditState | null>(null);
	const [mutationMessage, setMutationMessage] = useState<string | null>(null);
	const [mutationPending, setMutationPending] = useState(false);
	const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
	const blockInFlight = useRef(false);
	const pendingBlock = useRef<{
		communityId: string;
		memberUserId: string;
		operationId: string;
	} | null>(null);
	const requestGeneration = useRef(0);
	const focused = useRef(false);
	const mounted = useRef(true);
	const replyInFlight = useRef(false);
	const editInFlight = useRef(false);
	const mutationInFlight = useRef(false);
	const pendingReply = useRef<ICreateCommunityReplyRequest | null>(null);
	const pendingEdit = useRef<IEditCommunityReplyRequest | null>(null);

	useEffect(() => {
		mounted.current = true;
		return () => void (mounted.current = false);
	}, []);

	const loadThread = useCallback(
		async (refreshing = false) => {
			const generation = ++requestGeneration.current;
			setThreadState((current) =>
				refreshing && current.status === 'Ready'
					? { ...current, isRefreshing: true }
					: { status: 'Loading' },
			);
			try {
				const [{ post }, replies] = await Promise.all([
					getCommunityPost({ communityId, postId }),
					listCommunityReplies({ communityId, postId }),
				]);
				if (
					generation !== requestGeneration.current ||
					!focused.current
				)
					return;
				let supporters: ICommunityPrayerSupporter[] = [];
				let supportCount = 0;
				let viewerIsPraying = false;
				let supportUnavailable = false;
				if (isPublishedPrayerRequest(post)) {
					try {
						const support = await listCommunityPrayerSupport({
							communityId,
							postId,
							pageSize: 50,
						});
						if (
							generation !== requestGeneration.current ||
							!focused.current
						)
							return;
						supporters = support.supporters;
						supportCount = support.supportCount;
						viewerIsPraying = support.viewerIsPraying;
					} catch (error) {
						if (
							generation !== requestGeneration.current ||
							!focused.current
						)
							return;
						const reason = getCommunityPostReason(error);
						if (reason && unavailableReasons.has(reason)) {
							setThreadState({ status: 'Unavailable' });
							return;
						}
						supportUnavailable = true;
					}
				}
				setThreadState({
					status: 'Ready',
					post,
					replies: replies.replies,
					replyCount: replies.replyCount,
					nextReplyCursor: replies.nextCursor,
					supporters,
					supportCount,
					viewerIsPraying,
					supportUnavailable,
					isRefreshing: false,
					isLoadingMore: false,
					loadMoreError: false,
				});
			} catch (error) {
				if (
					generation !== requestGeneration.current ||
					!focused.current
				)
					return;
				const reason = getCommunityPostReason(error);
				setThreadState({
					status:
						reason && unavailableReasons.has(reason)
							? 'Unavailable'
							: 'Error',
				});
			}
		},
		[communityId, postId],
	);

	useFocusEffect(
		useCallback(() => {
			void loadAttempt;
			focused.current = true;
			void loadThread();
			return () => {
				focused.current = false;
				requestGeneration.current += 1;
			};
		}, [loadAttempt, loadThread]),
	);

	const refresh = useCallback(() => void loadThread(true), [loadThread]);
	const returnToCommunity = () =>
		router.replace({
			pathname: '/communities/[communityId]',
			params: { communityId },
		});
	const openReport = (targetType: 'Post' | 'Reply', replyId?: string) =>
		router.push({
			pathname: '/communities/[communityId]/report',
			params: {
				communityId,
				targetType,
				postId,
				...(replyId ? { replyId } : {}),
			},
		});
	const blockAuthor = async (memberUserId: string) => {
		if (
			blockInFlight.current ||
			!focused.current ||
			contextState.status !== 'Ready' ||
			contextState.context.community.status !== 'Active' ||
			memberUserId === userId
		)
			return;
		pendingBlock.current =
			pendingBlock.current?.memberUserId === memberUserId
				? pendingBlock.current
				: {
						communityId,
						memberUserId,
						operationId: createCommunitySafetyOperationId(),
					};
		blockInFlight.current = true;
		setBlockingUserId(memberUserId);
		setMutationMessage(null);
		try {
			await blockCommunityMember(pendingBlock.current);
			if (!mounted.current || !focused.current) return;
			pendingBlock.current = null;
			setThreadState({ status: 'Loading' });
			setEditState(null);
			setReplyDraft('');
			setMutationMessage('Member blocked. Shared content is refreshing.');
			void loadThread();
		} catch (error: unknown) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunitySafetyReason(error);
			if (reason) pendingBlock.current = null;
			setMutationMessage(
				reason === 'TargetUnavailable'
					? 'This member is no longer available to block.'
					: reason
						? 'We couldn’t block this member. Try again.'
						: 'We couldn’t confirm the block. Retry to confirm the same request.',
			);
		} finally {
			blockInFlight.current = false;
			if (mounted.current) setBlockingUserId(null);
		}
	};
	const confirmBlock = (memberUserId: string, displayName: string) =>
		Alert.alert(
			`Block ${displayName || 'this member'}?`,
			'Blocking hides this person’s shared posts, replies, and prayer support from you and prevents direct replies and prayer acknowledgments to their posts. It does not remove either of you from the community. You can unblock them from Settings.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Block member',
					style: 'destructive',
					onPress: () => void blockAuthor(memberUserId),
				},
			],
		);
	const retry = () => {
		if (contextState.status === 'Error') retryContext();
		setLoadAttempt((value) => value + 1);
	};

	const loadMoreReplies = async () => {
		if (
			threadState.status !== 'Ready' ||
			!threadState.nextReplyCursor ||
			threadState.isLoadingMore
		)
			return;
		const generation = requestGeneration.current;
		const cursor = threadState.nextReplyCursor;
		setThreadState({
			...threadState,
			isLoadingMore: true,
			loadMoreError: false,
		});
		try {
			const result = await listCommunityReplies({
				communityId,
				postId,
				cursor,
			});
			if (generation !== requestGeneration.current || !focused.current)
				return;
			setThreadState((current) =>
				current.status === 'Ready'
					? {
							...current,
							replies: mergeReplies(
								current.replies,
								result.replies,
							),
							replyCount: result.replyCount,
							nextReplyCursor: result.nextCursor,
							isLoadingMore: false,
						}
					: current,
			);
		} catch (error) {
			if (generation !== requestGeneration.current || !focused.current)
				return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason))
				setThreadState({ status: 'Unavailable' });
			else
				setThreadState((current) =>
					current.status === 'Ready'
						? {
								...current,
								isLoadingMore: false,
								loadMoreError: true,
							}
						: current,
				);
		}
	};

	const replyError = !replyDraft.trim()
		? 'Write something before sending your reply.'
		: replyDraft.length > CommunityPostLimits.text
			? `Use ${CommunityPostLimits.text.toLocaleString()} characters or fewer.`
			: undefined;

	const submitReply = async () => {
		if (replyInFlight.current) return;
		setReplySubmitted(true);
		if (replyError || threadState.status !== 'Ready') return;
		if (
			contextState.status !== 'Ready' ||
			contextState.context.community.status !== 'Active' ||
			threadState.post.publication.status !==
				CommunityContentStatus.Published
		) {
			setReplyMessage(
				'This conversation is no longer accepting replies.',
			);
			return;
		}
		pendingReply.current ??= {
			communityId,
			postId,
			text: replyDraft,
			operationId: createCommunityPostOperationId(),
		};
		replyInFlight.current = true;
		setReplySaving(true);
		setReplyMessage(null);
		try {
			const result = await createCommunityReply(pendingReply.current);
			if (!mounted.current || !focused.current) return;
			if (result.postId !== postId)
				throw new Error('Unexpected community reply response.');
			pendingReply.current = null;
			setReplyDraft('');
			setReplySubmitted(false);
			setReplyUncertain(false);
			setReplyMessage('Your reply was added.');
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (!reason) {
				setReplyUncertain(true);
				setReplyMessage(
					'We couldn’t confirm whether your reply was added. Your words are still here. Retry to confirm the same request.',
				);
			} else {
				pendingReply.current = null;
				setReplyUncertain(false);
				setReplyMessage(
					unavailableReasons.has(reason) ||
						reason === 'CommunityClosed'
						? 'This conversation is no longer accepting replies. Your words are still here.'
						: 'We couldn’t add your reply. Your words are still here. Try again.',
				);
				if (unavailableReasons.has(reason)) refresh();
			}
		} finally {
			replyInFlight.current = false;
			if (mounted.current) setReplySaving(false);
		}
	};

	const beginEdit = (reply: ICommunityReply) => {
		const text = publishedReplyText(reply);
		if (!text) return;
		pendingEdit.current = null;
		setEditState({
			replyId: reply.replyId,
			text,
			submitted: false,
			saving: false,
			uncertain: false,
			message: null,
		});
	};

	const saveEdit = async () => {
		if (
			editInFlight.current ||
			!editState ||
			threadState.status !== 'Ready'
		)
			return;
		const reply = threadState.replies.find(
			(item) => item.replyId === editState.replyId,
		);
		const error =
			!editState.text.trim() ||
			editState.text.length > CommunityPostLimits.text;
		setEditState({ ...editState, submitted: true });
		if (!reply || error) return;
		pendingEdit.current ??= {
			communityId,
			postId,
			replyId: reply.replyId,
			text: editState.text,
			expectedRevision: reply.revision,
			operationId: createCommunityPostOperationId(),
		};
		editInFlight.current = true;
		setEditState({
			...editState,
			submitted: true,
			saving: true,
			message: null,
		});
		try {
			await editCommunityReply(pendingEdit.current);
			if (!mounted.current || !focused.current) return;
			pendingEdit.current = null;
			setEditState(null);
			setMutationMessage('Your reply changes were saved.');
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setThreadState({ status: 'Unavailable' });
				return;
			}
			if (!reason)
				setEditState({
					...editState,
					submitted: true,
					saving: false,
					uncertain: true,
					message:
						'We couldn’t confirm this edit. Retry to confirm the same request.',
				});
			else {
				pendingEdit.current = null;
				setEditState({
					...editState,
					submitted: true,
					saving: false,
					uncertain: false,
					message:
						reason === 'RevisionConflict'
							? 'This reply changed since you opened it. Your words are still here. Refresh before trying again.'
							: 'We couldn’t save this reply. Your words are still here.',
				});
			}
		} finally {
			editInFlight.current = false;
		}
	};

	const runDeleteReply = async (reply: ICommunityReply) => {
		if (mutationInFlight.current) return;
		mutationInFlight.current = true;
		setMutationPending(true);
		try {
			await deleteCommunityReply({
				communityId,
				postId,
				replyId: reply.replyId,
				expectedRevision: reply.revision,
				operationId: createCommunityPostOperationId(),
			});
			if (!mounted.current || !focused.current) return;
			setEditState(null);
			setMutationMessage('Your reply was deleted.');
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setThreadState({ status: 'Unavailable' });
				return;
			}
			setMutationMessage(
				reason === 'RevisionConflict'
					? 'This reply changed before it could be deleted. Refresh and review it.'
					: 'We couldn’t confirm that this reply was deleted. Refresh before trying again.',
			);
		} finally {
			mutationInFlight.current = false;
			if (mounted.current) setMutationPending(false);
		}
	};

	const confirmDeleteReply = (reply: ICommunityReply) =>
		Alert.alert(
			'Delete this reply?',
			'The reply text will no longer be visible to community members.',
			[
				{ text: 'Keep reply', style: 'cancel' },
				{
					text: 'Delete reply',
					style: 'destructive',
					onPress: () => void runDeleteReply(reply),
				},
			],
		);

	const runDeletePost = async (post: ICommunityPost) => {
		if (mutationInFlight.current) return;
		mutationInFlight.current = true;
		setMutationPending(true);
		try {
			await deleteCommunityPost({
				communityId,
				postId,
				expectedRevision: post.revision,
				operationId: createCommunityPostOperationId(),
			});
			if (!mounted.current || !focused.current) return;
			setMutationMessage('Your post was deleted.');
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setThreadState({ status: 'Unavailable' });
				return;
			}
			setMutationMessage(
				reason === 'RevisionConflict'
					? 'This post changed before it could be deleted. Refresh and review it.'
					: 'We couldn’t confirm that this post was deleted. Refresh before trying again.',
			);
		} finally {
			mutationInFlight.current = false;
			if (mounted.current) setMutationPending(false);
		}
	};

	const confirmDeletePost = (post: ICommunityPost) =>
		Alert.alert(
			'Delete this post?',
			'The post text will no longer be visible. Existing replies will remain in the conversation.',
			[
				{ text: 'Keep post', style: 'cancel' },
				{
					text: 'Delete post',
					style: 'destructive',
					onPress: () => void runDeletePost(post),
				},
			],
		);

	const updatePrayerStatus = async (
		post: ICommunityPost,
		status: TPrayerRequestStatus,
	) => {
		if (mutationInFlight.current) return;
		mutationInFlight.current = true;
		setMutationPending(true);
		setMutationMessage(null);
		try {
			await setCommunityPrayerRequestStatus({
				communityId,
				postId,
				prayerRequestStatus: status,
				expectedRevision: post.revision,
				operationId: createCommunityPostOperationId(),
			});
			if (!mounted.current || !focused.current) return;
			setMutationMessage(
				`Prayer request marked ${prayerStatusLabels[status].toLowerCase()}.`,
			);
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setThreadState({ status: 'Unavailable' });
				return;
			}
			setMutationMessage(
				reason === 'RevisionConflict'
					? 'This prayer request changed. Refresh and review its current status.'
					: 'We couldn’t update this prayer request status. Try again.',
			);
		} finally {
			mutationInFlight.current = false;
			if (mounted.current) setMutationPending(false);
		}
	};

	const togglePrayerSupport = async (viewerIsPraying: boolean) => {
		if (mutationInFlight.current) return;
		mutationInFlight.current = true;
		setMutationPending(true);
		setMutationMessage(null);
		try {
			await setCommunityPrayerAcknowledgment({
				communityId,
				postId,
				isPraying: !viewerIsPraying,
				operationId: createCommunityPostOperationId(),
			});
			if (!mounted.current || !focused.current) return;
			setMutationMessage(
				viewerIsPraying
					? 'Your prayer acknowledgment was withdrawn.'
					: 'The community can now see that you’re praying.',
			);
			refresh();
		} catch (error) {
			if (!mounted.current || !focused.current) return;
			const reason = getCommunityPostReason(error);
			if (reason && unavailableReasons.has(reason)) {
				setThreadState({ status: 'Unavailable' });
				return;
			}
			setMutationMessage(
				'We couldn’t confirm that prayer acknowledgment. Refresh before trying again.',
			);
		} finally {
			mutationInFlight.current = false;
			if (mounted.current) setMutationPending(false);
		}
	};

	const context =
		contextState.status === 'Ready' ? contextState.context : null;
	const unavailable =
		contextState.status === 'Unavailable' ||
		threadState.status === 'Unavailable';
	const loading =
		contextState.status === 'Loading' || threadState.status === 'Loading';
	const error =
		contextState.status === 'Error' || threadState.status === 'Error';
	const ready = Boolean(context && threadState.status === 'Ready');
	const post =
		ready && threadState.status === 'Ready' ? threadState.post : null;
	const communityIsActive = context?.community.status === 'Active';
	const postIsPublished =
		post?.publication.status === CommunityContentStatus.Published;
	const viewerIsAuthor = post?.author.userId === userId;
	const canEditPost = Boolean(
		communityIsActive &&
		viewerIsAuthor &&
		post?.publication.status === 'Published' &&
		(post.publication.content.postType !== 'OrganizerAnnouncement' ||
			context?.membership.role === 'Organizer'),
	);
	const canReply = Boolean(communityIsActive && postIsPublished);
	const prayerRequest =
		post?.publication.status === 'Published' &&
		post.publication.content.postType === 'PrayerRequest'
			? post.publication.content
			: null;

	const header = (
		<View style={[styles.content, { paddingTop: headerHeight }]}>
			{unavailable ? (
				<View
					style={styles.section}
					accessibilityLiveRegion='polite'
				>
					<Typography size='H1'>
						This conversation is unavailable
					</Typography>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						Your membership may have changed, or this post may no
						longer be available.
					</Typography>
					<TurndownButton
						variant='Outline'
						onPress={returnToCommunity}
					>
						Return to community
					</TurndownButton>
				</View>
			) : loading ? (
				<View
					accessibilityLiveRegion='polite'
					accessibilityState={{ busy: true }}
				>
					<Typography size='H1'>Loading conversation…</Typography>
				</View>
			) : error ? (
				<View
					style={styles.section}
					accessibilityLiveRegion='polite'
				>
					<Typography size='H1'>
						We couldn’t load this conversation.
					</Typography>
					<Typography
						tone='Secondary'
						weight='Regular'
					>
						Check your connection and try again.
					</Typography>
					<TurndownButton onPress={retry}>Try again</TurndownButton>
					<TurndownButton
						variant='Outline'
						onPress={returnToCommunity}
					>
						Return to community
					</TurndownButton>
				</View>
			) : post && context && threadState.status === 'Ready' ? (
				<>
					<TurndownButton
						variant='Ghost'
						onPress={returnToCommunity}
					>
						Return to {context.community.name}
					</TurndownButton>
					<Card testID='community-post-detail'>
						<View style={styles.cardContent}>
							<View style={styles.headingRow}>
								<Typography size='H2'>
									{
										postTypeLabels[
											post.publication.status ===
											'Published'
												? post.publication.content
														.postType
												: post.publication.postType
										]
									}
								</Typography>
								<Typography
									size='Body2'
									tone='Secondary'
									weight='Regular'
								>
									{formatTimestamp(post.createdAt)}
									{post.editedAt ? ' · Edited' : ''}
								</Typography>
							</View>
							<Typography weight='Semibold'>
								{post.author.displayName || 'Name unavailable'}
							</Typography>
							{post.publication.status === 'Published' ? (
								<Typography
									weight='Regular'
									style={styles.postText}
								>
									{post.publication.content.text}
								</Typography>
							) : (
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									{post.publication.status === 'AuthorDeleted'
										? 'Post deleted by its author. Existing replies remain below.'
										: 'Post removed by a moderator. Existing authorized replies remain below.'}
								</Typography>
							)}
							{prayerRequest ? (
								<Typography
									size='Body2'
									tone='Secondary'
									weight='Semibold'
								>
									Status:{' '}
									{
										prayerStatusLabels[
											prayerRequest.prayerRequestStatus
										]
									}
								</Typography>
							) : null}
							{viewerIsAuthor && postIsPublished ? (
								<View style={styles.inlineActions}>
									{canEditPost ? (
										<TurndownButton
											variant='Outline'
											onPress={() =>
												router.push({
													pathname:
														'/communities/[communityId]/posts/[postId]/edit',
													params: {
														communityId,
														postId,
													},
												})
											}
										>
											Edit post
										</TurndownButton>
									) : null}
									<TurndownButton
										variant='Ghost'
										disabled={mutationPending}
										onPress={() => confirmDeletePost(post)}
									>
										Delete post
									</TurndownButton>
								</View>
							) : null}
							{postIsPublished && !viewerIsAuthor ? (
								<TurndownButton
									variant='Ghost'
									onPress={() => openReport('Post')}
									testID='report-post'
								>
									Report post
								</TurndownButton>
							) : null}
							{postIsPublished &&
							!viewerIsAuthor &&
							communityIsActive ? (
								<TurndownButton
									variant='Ghost'
									disabled={blockingUserId !== null}
									loading={
										blockingUserId === post.author.userId
									}
									onPress={() =>
										confirmBlock(
											post.author.userId,
											post.author.displayName,
										)
									}
									testID='block-post-author'
								>
									Block member
								</TurndownButton>
							) : null}
						</View>
					</Card>
					{prayerRequest ? (
						<Card>
							<View style={styles.cardContent}>
								<Typography size='H2'>
									Prayer support
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									“I’m praying” is visible to this community.
									It does not mark your daily Pray practice
									complete.
								</Typography>
								{threadState.supportUnavailable ? (
									<Typography
										tone='Secondary'
										weight='Regular'
									>
										Prayer acknowledgment information is
										unavailable right now.
									</Typography>
								) : (
									<>
										<Typography weight='Regular'>
											{threadState.supportCount === 0
												? 'No one has added a prayer acknowledgment yet.'
												: `${threadState.supportCount} ${threadState.supportCount === 1 ? 'person has' : 'people have'} said they’re praying.`}
										</Typography>
										{threadState.supporters.map(
											(supporter) => (
												<Typography
													key={supporter.userId}
													size='Body2'
													weight='Regular'
												>
													{supporter.displayName ||
														'Name unavailable'}{' '}
													·{' '}
													{formatTimestamp(
														supporter.acknowledgedAt,
													)}
												</Typography>
											),
										)}
										{threadState.viewerIsPraying ||
										(isCurrentPrayerRequest(post) &&
											communityIsActive) ? (
											<TurndownButton
												variant={
													threadState.viewerIsPraying
														? 'Outline'
														: 'Solid'
												}
												loading={mutationPending}
												disabled={mutationPending}
												testID='toggle-prayer-support'
												onPress={() =>
													void togglePrayerSupport(
														threadState.viewerIsPraying,
													)
												}
											>
												{threadState.viewerIsPraying
													? 'Withdraw “I’m praying”'
													: 'I’m praying'}
											</TurndownButton>
										) : null}
									</>
								)}
							</View>
						</Card>
					) : null}
					{prayerRequest && viewerIsAuthor && communityIsActive ? (
						<View style={styles.section}>
							<Typography size='H2'>
								Prayer request status
							</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								Choose the status deliberately. No additional
								text is required.
							</Typography>
							<View
								accessibilityRole='radiogroup'
								style={styles.statusOptions}
							>
								{Object.values(PrayerRequestStatus).map(
									(status) => {
										const selected =
											prayerRequest.prayerRequestStatus ===
											status;
										return (
											<Pressable
												key={status}
												accessibilityRole='radio'
												accessibilityState={{
													selected,
													disabled: mutationPending,
												}}
												disabled={
													selected || mutationPending
												}
												style={[
													styles.statusOption,
													selected &&
														styles.selectedStatus,
												]}
												testID={`prayer-status-${status}`}
												onPress={() =>
													void updatePrayerStatus(
														post,
														status,
													)
												}
											>
												<Typography weight='Semibold'>
													{prayerStatusLabels[status]}
												</Typography>
											</Pressable>
										);
									},
								)}
							</View>
						</View>
					) : null}
					{mutationMessage ? (
						<View
							accessibilityRole='alert'
							accessibilityLiveRegion='polite'
						>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{mutationMessage}
							</Typography>
						</View>
					) : null}
					<View accessibilityRole='header'>
						<Typography size='H2'>
							Replies ({threadState.replyCount})
						</Typography>
					</View>
					{threadState.replies.length === 0 ? (
						<Typography
							tone='Secondary'
							weight='Regular'
						>
							No replies have been added yet.
						</Typography>
					) : null}
				</>
			) : null}
		</View>
	);

	const footer =
		post && threadState.status === 'Ready' ? (
			<View style={styles.footer}>
				{threadState.loadMoreError ? (
					<Typography
						tone='Error'
						weight='Regular'
					>
						We couldn’t load more replies. Try again.
					</Typography>
				) : null}
				{threadState.nextReplyCursor ? (
					<TurndownButton
						variant='Outline'
						loading={threadState.isLoadingMore}
						disabled={threadState.isLoadingMore}
						onPress={() => void loadMoreReplies()}
					>
						Load more replies
					</TurndownButton>
				) : null}
				{canReply ? (
					<Card>
						<View style={styles.cardContent}>
							<Typography size='H2'>Add a reply</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								Your reply is shared with current and future
								members. Replying does not change any
								daily-practice completion.
							</Typography>
							<Input
								label='Reply'
								placeholder='Write your reply'
								value={replyDraft}
								onChange={(value) => {
									setReplyDraft(value);
									setReplySubmitted(false);
									setReplyMessage(null);
									pendingReply.current = null;
									setReplyUncertain(false);
								}}
								readOnly={replySaving || replyUncertain}
								multiline
								ignoreForm
								testID='community-reply-text'
								{...(replySubmitted && replyError
									? { errorMessage: replyError }
									: {})}
							/>
							<Typography
								size='Body2'
								tone='Secondary'
								weight='Regular'
								style={styles.count}
							>
								{replyDraft.length.toLocaleString()} /{' '}
								{CommunityPostLimits.text.toLocaleString()}
							</Typography>
							{replyMessage ? (
								<View
									accessibilityRole='alert'
									accessibilityLiveRegion='polite'
								>
									<Typography
										tone={
											replyUncertain
												? 'Error'
												: 'Secondary'
										}
										weight='Regular'
									>
										{replyMessage}
									</Typography>
								</View>
							) : null}
							<TurndownButton
								fullWidth
								loading={replySaving}
								disabled={replySaving}
								testID='submit-community-reply'
								onPress={() => void submitReply()}
							>
								{replyUncertain ? 'Retry reply' : 'Add reply'}
							</TurndownButton>
						</View>
					</Card>
				) : (
					<Card>
						<View style={styles.cardContent}>
							<Typography size='H2'>
								Replies are closed
							</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{postIsPublished
									? 'This community is a read-only archive.'
									: 'A deleted or removed post no longer accepts new replies.'}
							</Typography>
						</View>
					</Card>
				)}
				<TurndownButton
					variant='Outline'
					onPress={returnToCommunity}
				>
					Return to community
				</TurndownButton>
			</View>
		) : null;

	return (
		<TurndownListScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			data={
				threadState.status === 'Ready' && context
					? threadState.replies
					: []
			}
			keyExtractor={(reply) => reply.replyId}
			ListHeaderComponent={header}
			ItemSeparatorComponent={() => <View style={styles.separator} />}
			renderItem={({ item }) => (
				<CommunityReplyCard
					reply={item}
					viewerUserId={userId}
					communityIsActive={communityIsActive}
					editState={editState}
					onBeginEdit={beginEdit}
					onChangeEdit={(text) => {
						if (!editState) return;
						pendingEdit.current = null;
						setEditState({
							...editState,
							text,
							submitted: false,
							uncertain: false,
							message: null,
						});
					}}
					onCancelEdit={() => {
						pendingEdit.current = null;
						setEditState(null);
					}}
					onSaveEdit={() => void saveEdit()}
					onDelete={confirmDeleteReply}
					onReport={(reply) => openReport('Reply', reply.replyId)}
					onBlock={(reply) =>
						confirmBlock(
							reply.author.userId,
							reply.author.displayName,
						)
					}
				/>
			)}
			refreshing={
				threadState.status === 'Ready'
					? threadState.isRefreshing
					: false
			}
			onRefresh={threadState.status === 'Ready' ? refresh : undefined}
			ListFooterComponent={footer}
			testID='community-post-screen'
		/>
	);
};

export const CommunityPostScreen = () => {
	const { communityId, postId } = useLocalSearchParams<{
		communityId?: string;
		postId?: string;
	}>();
	const { account } = useAuth();
	const userId = account?.userId;
	if (!userId || !communityId || !postId)
		return (
			<TurndownListScreen
				backgroundColor={SurfaceColors.Screen}
				data={[]}
				renderItem={() => null}
				ListHeaderComponent={
					<Typography size='H2'>
						This conversation is unavailable
					</Typography>
				}
			/>
		);
	return (
		<CommunityPostContent
			key={`${userId}:${communityId}:${postId}`}
			userId={userId}
			communityId={communityId}
			postId={postId}
		/>
	);
};
