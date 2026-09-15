import { Modal } from '@td/components/layout/modal/modal.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import {
	createCommunityPost,
	createCommunityPostOperationId,
	getCommunityPostReason,
} from '@td/features/communities/community-post.service';
import {
	getCommunityContext,
	listCommunities,
} from '@td/features/communities/community-reader.service';
import { useAuth } from '@td/providers/auth/auth.hook';
import { Spacing } from '@td/theme/spacing';
import type { ICreateCommunityPostRequest } from '@td/types/community/community-post-function.types';
import { CommunityPostType } from '@td/types/community/community-post.types';
import {
	CommunityStatus,
	type ICommunitySummary,
} from '@td/types/community/community.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReflectionInput } from './reflection.styles';

interface IReflectionSharePreviewProps {
	userId: string;
	initialText: string;
	onClose: () => void;
}

export const ReflectionSharePreviewScreen = ({
	userId,
	initialText,
	onClose,
}: IReflectionSharePreviewProps) => {
	const { account } = useAuth();
	const router = useRouter();
	const { height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const [text, setText] = useState(initialText);
	const [focused, setFocused] = useState(false);
	const [communities, setCommunities] = useState<ICommunitySummary[] | null>(
		null,
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [confirmedId, setConfirmedId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [uncertain, setUncertain] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const pending = useRef<ICreateCommunityPostRequest | null>(null);
	const inFlight = useRef(false);
	const active = useRef(false);
	const generation = useRef(0);
	const selected = communities?.find(
		(item) => item.communityId === selectedId,
	);
	const accountAvailable = account?.userId === userId;

	useFocusEffect(
		useCallback(() => {
			active.current = true;
			const current = ++generation.current;
			if (!accountAvailable) {
				setLoading(false);
				setMessage(
					'Your account changed. This copy has not been shared.',
				);
				return () => {
					active.current = false;
					generation.current++;
				};
			}
			setLoading(true);
			void listCommunities().then(
				(items) => {
					if (!active.current || generation.current !== current)
						return;
					setCommunities(
						items.filter(
							(item) => item.status === CommunityStatus.Active,
						),
					);
					setLoading(false);
					setSelectedId((previous) =>
						items.some(
							(item) =>
								item.communityId === previous &&
								item.status === CommunityStatus.Active,
						)
							? previous
							: null,
					);
					setConfirmedId(null);
				},
				() => {
					if (!active.current || generation.current !== current)
						return;
					setCommunities(null);
					setLoading(false);
					setMessage(
						'We couldn’t load your communities. Your copy has not been shared.',
					);
				},
			);
			return () => {
				active.current = false;
				generation.current++;
			};
			// Retry changes intentionally refresh the focused preview.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [accountAvailable, attempt]),
	);

	const select = (communityId: string) => {
		if (saving || uncertain) return;
		setSelectedId(communityId);
		setConfirmedId(null);
		pending.current = null;
		setMessage(null);
	};
	const close = () => {
		if (saving || uncertain) return;
		onClose();
	};
	const share = async () => {
		if (
			inFlight.current ||
			!accountAvailable ||
			!selected ||
			confirmedId !== selectedId ||
			!text.trim()
		)
			return;
		inFlight.current = true;
		setSaving(true);
		setMessage(null);
		const current = generation.current;
		try {
			if (!pending.current) {
				const context = await getCommunityContext(selected.communityId);
				if (
					!active.current ||
					generation.current !== current ||
					account?.userId !== userId
				)
					return;
				if (
					context.community.status !== CommunityStatus.Active ||
					!context.capabilities.canCreatePost ||
					context.community.name !== selected.name
				) {
					setConfirmedId(null);
					setMessage(
						'This community or your access changed. Review the audience again before sharing.',
					);
					setAttempt((value) => value + 1);
					return;
				}
				pending.current = {
					communityId: selected.communityId,
					content: {
						postType: CommunityPostType.SharedReflectionCopy,
						text: text.trim(),
					},
					operationId: createCommunityPostOperationId(),
				};
			}
			const request = pending.current;
			const result = await createCommunityPost(request);
			if (
				!active.current ||
				generation.current !== current ||
				account?.userId !== userId
			)
				return;
			if (result.communityId !== request.communityId)
				throw new Error('Unexpected post audience.');
			pending.current = null;
			onClose();
			router.push({
				pathname: '/communities/[communityId]/posts/[postId]',
				params: {
					communityId: result.communityId,
					postId: result.postId,
				},
			});
		} catch (error) {
			if (
				!active.current ||
				generation.current !== current ||
				account?.userId !== userId
			)
				return;
			const reason = getCommunityPostReason(error);
			if (!reason) {
				setUncertain(true);
				setMessage(
					'We couldn’t confirm whether this copy was shared. Retry to confirm the same request.',
				);
			} else {
				pending.current = null;
				setUncertain(false);
				if (
					reason === 'CommunityClosed' ||
					reason === 'MembershipUnavailable' ||
					reason === 'CommunityUnavailable' ||
					reason === 'AccountUnavailable'
				) {
					setConfirmedId(null);
					setMessage(
						'This community or your access changed. Your copy was not shared.',
					);
					setAttempt((value) => value + 1);
				} else {
					setMessage(
						'We couldn’t share this copy. Check it and try again.',
					);
				}
			}
		} finally {
			inFlight.current = false;
			if (active.current && generation.current === current)
				setSaving(false);
		}
	};

	return (
		<Modal
			open
			title='Share a reflection copy'
			onClose={close}
		>
			<ScrollView
				style={{
					maxHeight: Math.max(
						Spacing.Huge,
						height - insets.top - insets.bottom - Spacing.XXHuge,
					),
				}}
				keyboardShouldPersistTaps='handled'
			>
				<View
					accessibilityViewIsModal
					onAccessibilityEscape={close}
					style={{
						gap: Spacing.Medium,
						paddingVertical: Spacing.Medium,
					}}
				>
					<Typography>
						Your private reflection stays private. Only the edited
						copy below will be posted.
					</Typography>
					<ReflectionInput
						isFocused={focused}
						multiline
						maxLength={10000}
						accessibilityLabel='Reflection copy to share'
						value={text}
						editable={!saving && !uncertain && accountAvailable}
						onChangeText={(value: string) => {
							setText(value);
							setConfirmedId(null);
							pending.current = null;
							setMessage(null);
						}}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
					/>
					<Typography weight='Semibold'>
						Choose one community
					</Typography>
					{loading && (
						<Typography>Loading your communities…</Typography>
					)}
					{!loading && !communities && (
						<TurndownButton
							variant='Outline'
							onPress={() => setAttempt((value) => value + 1)}
						>
							Try again
						</TurndownButton>
					)}
					{!loading && communities?.length === 0 && (
						<>
							<Typography>
								You have no active communities to share with.
							</Typography>
							<TurndownButton
								variant='Outline'
								onPress={() => {
									close();
									router.push('/communities/create');
								}}
							>
								Create community
							</TurndownButton>
							<TurndownButton
								variant='Outline'
								onPress={() => {
									close();
									router.push('/communities/join');
								}}
							>
								Join community
							</TurndownButton>
						</>
					)}
					{communities?.map((community) => (
						<TurndownButton
							key={community.communityId}
							variant='Outline'
							accessibilityLabel={`${community.name}${selectedId === community.communityId ? ', selected' : ''}`}
							disabled={saving || uncertain}
							onPress={() => select(community.communityId)}
						>
							{community.name}
							{selectedId === community.communityId ? ' ✓' : ''}
						</TurndownButton>
					))}
					{selected && (
						<>
							<Typography>
								Audience: {selected.name}. Current and future
								members of this community can see the posted
								copy. Editing or deleting your private
								reflection will not change or delete this
								community copy.
							</Typography>
							<TurndownButton
								variant='Outline'
								disabled={saving || uncertain || !text.trim()}
								onPress={() =>
									setConfirmedId(selected.communityId)
								}
							>
								{confirmedId === selected.communityId
									? `Audience confirmed: ${selected.name}`
									: `Confirm audience: ${selected.name}`}
							</TurndownButton>
						</>
					)}
					{message && <Typography tone='Error'>{message}</Typography>}
					<TurndownButton
						disabled={
							saving ||
							!accountAvailable ||
							!selected ||
							(!uncertain && confirmedId !== selectedId) ||
							!text.trim()
						}
						loading={saving}
						onPress={() => void share()}
					>
						{uncertain ? 'Retry same share' : 'Share copy'}
					</TurndownButton>
					<TurndownButton
						variant='Outline'
						disabled={saving || uncertain}
						onPress={close}
					>
						Cancel
					</TurndownButton>
				</View>
			</ScrollView>
		</Modal>
	);
};
