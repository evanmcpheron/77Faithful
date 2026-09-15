import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Card } from '@td/components/ui/card/card.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useScreenScrollOffset } from '@td/providers/header-scroll/use-screen-scroll-offset.hook';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type {
	ICreateCommunityPostRequest,
	IEditCommunityPostRequest,
} from '@td/types/community/community-post-function.types';
import {
	CommunityPostType,
	PrayerRequestStatus,
	type ICommunityPost,
	type TCommunityPostType,
} from '@td/types/community/community-post.types';
import {
	useFocusEffect,
	useLocalSearchParams,
	useNavigation,
	useRouter,
} from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { CommunityPostLimits } from '../community-post';
import {
	getCommunityPostDraft,
	removeCommunityPostDraft,
	setCommunityPostDraft,
} from '../community-post-draft';
import {
	createCommunityPost,
	createCommunityPostOperationId,
	editCommunityPost,
	getCommunityPost,
	getCommunityPostReason,
} from '../community-post.service';
import { useCommunityContext } from '../use-community-context.hook';
import { composePostStyles as styles } from './compose-post.styles';

const postTypeOptions: readonly {
	type: TCommunityPostType;
	label: string;
	description: string;
}[] = [
	{
		type: CommunityPostType.PrayerRequest,
		label: 'Prayer request',
		description: 'Ask this community to pray with you.',
	},
	{
		type: CommunityPostType.Discussion,
		label: 'Discussion',
		description: 'Begin a conversation with the community.',
	},
	{
		type: CommunityPostType.SharedReflectionCopy,
		label: 'Shared reflection',
		description: 'Write a separate reflection to share here.',
	},
	{
		type: CommunityPostType.OrganizerAnnouncement,
		label: 'Announcement',
		description: 'Share an update as the community organizer.',
	},
];

const labels: Record<
	TCommunityPostType,
	{ title: string; field: string; submit: string }
> = {
	PrayerRequest: {
		title: 'Share a prayer request',
		field: 'Prayer request',
		submit: 'Share prayer request',
	},
	Discussion: {
		title: 'Start a discussion',
		field: 'Discussion',
		submit: 'Post discussion',
	},
	SharedReflectionCopy: {
		title: 'Share a reflection',
		field: 'Shared reflection',
		submit: 'Share reflection',
	},
	OrganizerAnnouncement: {
		title: 'Post an announcement',
		field: 'Announcement',
		submit: 'Post announcement',
	},
};

type TPostLoadState =
	| { status: 'NotNeeded' }
	| { status: 'Loading' }
	| { status: 'Unavailable' }
	| { status: 'Error' }
	| { status: 'Ready'; post: ICommunityPost };

type TPendingRequest =
	| { mode: 'Create'; request: ICreateCommunityPostRequest }
	| { mode: 'Edit'; request: IEditCommunityPostRequest };

const unavailableReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'CommunityClosed',
	'MembershipUnavailable',
	'OrganizerRequired',
	'PostUnavailable',
	'PostAuthorRequired',
]);

const publishedText = (post: ICommunityPost): string | null =>
	post.publication.status === 'Published'
		? post.publication.content.text
		: null;

const resolvedPostType = (post: ICommunityPost): TCommunityPostType =>
	post.publication.status === 'Published'
		? post.publication.content.postType
		: post.publication.postType;

const ComposePostContent = ({
	userId,
	communityId,
	postId,
}: {
	userId: string;
	communityId: string;
	postId?: string;
}) => {
	const router = useRouter();
	const navigation = useNavigation();
	const headerHeight = useHeaderHeight();
	const { scrollOffset, handleScrollPositionChange } =
		useScreenScrollOffset();
	const { state: contextState, retry: retryContext } = useCommunityContext(
		userId,
		communityId,
	);
	const [initialDraft] = useState(() =>
		getCommunityPostDraft(userId, communityId, postId),
	);
	const [selectedType, setSelectedType] = useState<TCommunityPostType>(
		initialDraft?.postType ?? CommunityPostType.Discussion,
	);
	const [text, setText] = useState(initialDraft?.text ?? '');
	const [initialText, setInitialText] = useState<string | null>(
		postId ? null : '',
	);
	const [submitted, setSubmitted] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uncertain, setUncertain] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [postAttempt, setPostAttempt] = useState(0);
	const [completed, setCompleted] = useState(false);
	const [latestCommunityName, setLatestCommunityName] = useState<
		string | null
	>(null);
	const [observedCommunityName, setObservedCommunityName] = useState<
		string | null
	>(null);
	const [postState, setPostState] = useState<TPostLoadState>(
		postId ? { status: 'Loading' } : { status: 'NotNeeded' },
	);
	const pending = useRef<TPendingRequest | null>(null);
	const inFlight = useRef(false);
	const mounted = useRef(true);
	const focused = useRef(false);
	const completedRef = useRef(false);

	useEffect(() => {
		mounted.current = true;
		return () => void (mounted.current = false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			void postAttempt;
			focused.current = true;
			if (!postId) return () => void (focused.current = false);
			let current = true;
			setPostState({ status: 'Loading' });
			void getCommunityPost({ communityId, postId }).then(
				({ post }) => {
					if (!current || !mounted.current) return;
					const loadedText = publishedText(post);
					if (
						post.communityId !== communityId ||
						post.postId !== postId ||
						post.author.userId !== userId ||
						loadedText === null
					) {
						setPostState({ status: 'Unavailable' });
						return;
					}
					const loadedType = resolvedPostType(post);
					setSelectedType(loadedType);
					setInitialText(loadedText);
					if (!initialDraft) setText(loadedText);
					else if (initialDraft.postType !== loadedType) {
						setText(loadedText);
						removeCommunityPostDraft(userId, communityId, postId);
					}
					setPostState({ status: 'Ready', post });
				},
				(error: unknown) => {
					if (!current || !mounted.current) return;
					const reason = getCommunityPostReason(error);
					setPostState({
						status:
							reason && unavailableReasons.has(reason)
								? 'Unavailable'
								: 'Error',
					});
				},
			);
			return () => {
				current = false;
				focused.current = false;
			};
		}, [communityId, initialDraft, postId, postAttempt, userId]),
	);

	const currentCommunityName =
		contextState.status === 'Ready'
			? contextState.context.community.name
			: null;
	if (
		currentCommunityName &&
		currentCommunityName !== observedCommunityName
	) {
		setObservedCommunityName(currentCommunityName);
		setLatestCommunityName(currentCommunityName);
	}

	const isEdit = Boolean(postId);
	const isDirty =
		!completed &&
		(initialText === null
			? Boolean(text)
			: text !== initialText ||
				(!isEdit && selectedType !== CommunityPostType.Discussion));
	const shouldConfirmBack = isDirty && !saving;
	useEffect(
		() =>
			navigation.addListener('beforeRemove', (event) => {
				if (!shouldConfirmBack || completedRef.current) return;
				event.preventDefault();
				Alert.alert(
					'Discard this post?',
					'Your writing has not been shared with the community.',
					[
						{ text: 'Keep writing', style: 'cancel' },
						{
							text: 'Discard',
							style: 'destructive',
							onPress: () => {
								removeCommunityPostDraft(
									userId,
									communityId,
									postId,
								);
								navigation.dispatch(event.data.action);
							},
						},
					],
				);
			}),
		[navigation, shouldConfirmBack, completed, userId, communityId, postId],
	);

	const updateDraft = (nextType: TCommunityPostType, nextText: string) => {
		setSelectedType(nextType);
		setText(nextText);
		setSubmitted(false);
		setMessage(null);
		pending.current = null;
		setUncertain(false);
		setCommunityPostDraft(
			userId,
			communityId,
			{ postType: nextType, text: nextText },
			postId,
		);
	};

	const validationMessage = !text.trim()
		? 'Write something before sharing it.'
		: text.length > CommunityPostLimits.text
			? `Use ${CommunityPostLimits.text.toLocaleString()} characters or fewer.`
			: undefined;

	const returnToCommunity = () =>
		router.replace({
			pathname: '/communities/[communityId]',
			params: { communityId },
		});

	const submit = async () => {
		if (inFlight.current) return;
		setSubmitted(true);
		if (validationMessage) return;
		if (contextState.status !== 'Ready') {
			setMessage('We couldn’t confirm your access to this community.');
			return;
		}
		const context = contextState.context;
		if (
			context.community.status !== 'Active' ||
			!context.capabilities.canCreatePost ||
			(selectedType === CommunityPostType.OrganizerAnnouncement &&
				context.membership.role !== 'Organizer')
		) {
			setMessage(
				context.community.status === 'Closed'
					? 'This community is closed and no longer accepts posts.'
					: 'Your permission to share this post has changed.',
			);
			return;
		}
		if (isEdit && postState.status !== 'Ready') return;

		inFlight.current = true;
		setSaving(true);
		setMessage(null);
		try {
			if (!pending.current) {
				if (isEdit && postId && postState.status === 'Ready') {
					pending.current = {
						mode: 'Edit',
						request: {
							communityId,
							postId,
							text,
							expectedRevision: postState.post.revision,
							operationId: createCommunityPostOperationId(),
						},
					};
				} else {
					pending.current = {
						mode: 'Create',
						request: {
							communityId,
							content:
								selectedType === CommunityPostType.PrayerRequest
									? {
											postType: selectedType,
											text,
											prayerRequestStatus:
												PrayerRequestStatus.Current,
										}
									: { postType: selectedType, text },
							operationId: createCommunityPostOperationId(),
						},
					};
				}
			}
			const activeRequest = pending.current;
			if (activeRequest.mode === 'Edit') {
				const result = await editCommunityPost(activeRequest.request);
				if (result.postId !== postId)
					throw new Error('Unexpected community post response.');
			} else {
				const result = await createCommunityPost(activeRequest.request);
				if (result.communityId !== communityId)
					throw new Error('Unexpected community post response.');
			}
			if (!mounted.current || !focused.current) return;
			completedRef.current = true;
			setCompleted(true);
			removeCommunityPostDraft(userId, communityId, postId);
			router.replace({
				pathname: '/communities/[communityId]',
				params: {
					communityId,
					postSaved: isEdit ? 'edited' : 'created',
				},
			});
		} catch (error) {
			if (!mounted.current) return;
			const reason = getCommunityPostReason(error);
			if (!reason) {
				setUncertain(true);
				setMessage(
					'We couldn’t confirm whether this post was saved to the community. Your writing is still here. Retry to confirm the same request.',
				);
			} else {
				pending.current = null;
				setUncertain(false);
				if (reason === 'RevisionConflict')
					setMessage(
						'This post changed since you opened it. Your writing is still here. Return to the post and review the latest version before editing again.',
					);
				else if (unavailableReasons.has(reason))
					setMessage(
						reason === 'CommunityClosed'
							? 'This community is closed. Your writing has not been shared.'
							: 'Your access or permission changed. Your writing has not been shared.',
					);
				else
					setMessage(
						'We couldn’t save this post. Your writing is still here. Check it and try again.',
					);
			}
		} finally {
			inFlight.current = false;
			if (mounted.current) setSaving(false);
		}
	};

	const communityName =
		contextState.status === 'Ready'
			? contextState.context.community.name
			: latestCommunityName;
	let stateContent: React.ReactNode = null;
	if (contextState.status === 'Loading' || postState.status === 'Loading')
		stateContent = (
			<Typography size='H2'>Loading post composer…</Typography>
		);
	else if (contextState.status === 'Error' || postState.status === 'Error')
		stateContent = (
			<View style={styles.section}>
				<Typography size='H2'>
					We couldn’t load the post composer.
				</Typography>
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Check your connection and try again.
				</Typography>
				<TurndownButton
					onPress={
						contextState.status === 'Error'
							? retryContext
							: () => setPostAttempt((value) => value + 1)
					}
				>
					Try again
				</TurndownButton>
			</View>
		);
	else if (
		contextState.status === 'Unavailable' ||
		postState.status === 'Unavailable'
	)
		stateContent = (
			<View style={styles.section}>
				<Typography size='H2'>
					This post composer is unavailable
				</Typography>
				{communityName ? (
					<Typography weight='Regular'>
						Audience: {communityName}
					</Typography>
				) : null}
				<Typography
					tone='Secondary'
					weight='Regular'
				>
					Your membership, permission, or the post may have changed.
					Any writing kept in this composer has not been shared.
				</Typography>
				<TurndownButton
					variant='Outline'
					onPress={returnToCommunity}
				>
					Return to community
				</TurndownButton>
			</View>
		);

	const context =
		contextState.status === 'Ready' ? contextState.context : null;
	const canCompose =
		context?.community.status === 'Active' &&
		context.capabilities.canCreatePost &&
		(postState.status === 'NotNeeded' || postState.status === 'Ready') &&
		(!isEdit ||
			selectedType !== CommunityPostType.OrganizerAnnouncement ||
			context.membership.role === 'Organizer');
	const announcementAllowed = context?.membership.role === 'Organizer';

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentBackgroundColor={SurfaceColors.Screen}
			horizontalPadding={Spacing.Medium}
			verticalPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			safeAreaEdges={['left', 'right', 'bottom']}
			keyboardEnabled
			scrollOffset={scrollOffset}
			onScrollPositionChange={handleScrollPositionChange}
			testID='community-post-composer'
		>
			<View style={[styles.content, { paddingTop: headerHeight }]}>
				{stateContent ??
					(canCompose && context ? (
						<>
							<View style={styles.section}>
								<Typography size='Display'>
									{isEdit
										? `Edit ${labels[selectedType].field.toLowerCase()}`
										: labels[selectedType].title}
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Only text you deliberately submit here will
									be shared. Posting does not change any
									daily-practice completion.
								</Typography>
							</View>

							<View style={styles.section}>
								<Typography size='H2'>Audience</Typography>
								<Card>
									<View
										style={styles.audience}
										accessible
										accessibilityRole='text'
										accessibilityLabel={`Audience: ${context.community.name}. Current and future members can read this post.`}
									>
										<Typography weight='Semibold'>
											{context.community.name}
										</Typography>
										<Typography
											tone='Secondary'
											weight='Regular'
										>
											Current and future members can read
											this post while they have access to
											the community.
										</Typography>
									</View>
								</Card>
							</View>

							<View style={styles.section}>
								<Typography size='H2'>Post type</Typography>
								{isEdit ? (
									<Typography
										weight='Regular'
										testID='immutable-post-type'
									>
										{
											postTypeOptions.find(
												(option) =>
													option.type ===
													selectedType,
											)?.label
										}
									</Typography>
								) : (
									<View
										style={styles.typeList}
										accessibilityRole='radiogroup'
									>
										{postTypeOptions
											.filter(
												(option) =>
													option.type !==
														CommunityPostType.OrganizerAnnouncement ||
													announcementAllowed,
											)
											.map((option) => {
												const selected =
													option.type ===
													selectedType;
												return (
													<Pressable
														key={option.type}
														testID={`post-type-${option.type}`}
														accessibilityRole='radio'
														accessibilityState={{
															checked: selected,
															disabled:
																uncertain ||
																saving,
														}}
														disabled={
															uncertain || saving
														}
														style={[
															styles.typeOption,
															selected &&
																styles.selectedType,
														]}
														onPress={() =>
															updateDraft(
																option.type,
																text,
															)
														}
													>
														<Typography weight='Semibold'>
															{option.label}
														</Typography>
														<Typography
															size='Body2'
															tone='Secondary'
															weight='Regular'
														>
															{option.description}
														</Typography>
													</Pressable>
												);
											})}
									</View>
								)}
							</View>

							<View style={styles.section}>
								<Input
									label={labels[selectedType].field}
									placeholder='Write your post'
									value={text}
									onChange={(value) =>
										updateDraft(selectedType, value)
									}
									readOnly={uncertain || saving}
									multiline
									ignoreForm
									testID='community-post-text'
									{...(submitted && validationMessage
										? { errorMessage: validationMessage }
										: {})}
								/>
								<Typography
									size='Body2'
									tone={
										text.length > CommunityPostLimits.text
											? 'Error'
											: 'Secondary'
									}
									weight='Regular'
									style={styles.count}
								>
									{text.length.toLocaleString()} /{' '}
									{CommunityPostLimits.text.toLocaleString()}
								</Typography>
							</View>

							<View style={styles.actions}>
								{message ? (
									<View
										accessibilityRole='alert'
										accessibilityLiveRegion='polite'
									>
										<Typography
											tone='Error'
											weight='Regular'
										>
											{message}
										</Typography>
									</View>
								) : null}
								<TurndownButton
									fullWidth
									size='Large'
									loading={saving}
									disabled={saving}
									testID='submit-community-post'
									onPress={() => void submit()}
								>
									{uncertain
										? 'Retry save to community'
										: isEdit
											? 'Save changes to community'
											: labels[selectedType].submit}
								</TurndownButton>
								<TurndownButton
									variant='Outline'
									fullWidth
									disabled={saving}
									onPress={returnToCommunity}
								>
									Cancel
								</TurndownButton>
							</View>
						</>
					) : (
						<View style={styles.section}>
							<Typography size='H2'>
								Posting is unavailable
							</Typography>
							<Typography
								tone='Secondary'
								weight='Regular'
							>
								{context?.community.status === 'Closed'
									? 'This community is a read-only archive. Your writing has not been shared.'
									: 'Your permission to post may have changed. Your writing has not been shared.'}
							</Typography>
							<TurndownButton
								variant='Outline'
								onPress={returnToCommunity}
							>
								Return to community
							</TurndownButton>
						</View>
					))}
			</View>
		</TurndownScrollScreen>
	);
};

export const ComposePostScreen = () => {
	const { communityId, postId } = useLocalSearchParams<{
		communityId?: string;
		postId?: string;
	}>();
	const { account } = useAuth();
	const userId = account?.userId;
	if (!userId || !communityId)
		return (
			<TurndownScrollScreen backgroundColor={SurfaceColors.Screen}>
				<Typography size='H2'>
					This post composer is unavailable
				</Typography>
			</TurndownScrollScreen>
		);
	return (
		<ComposePostContent
			key={`${userId}:${communityId}:${postId ?? 'create'}`}
			userId={userId}
			communityId={communityId}
			{...(postId ? { postId } : {})}
		/>
	);
};
