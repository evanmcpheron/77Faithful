import { useAuth } from '@td/providers/auth/auth.hook';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { CommunityCreationLimits } from '../community-creation';
import {
	createCommunity,
	createCommunityOperationId,
} from '../create-community.service';

import { Input } from '@td/components/form/input/input.component';
import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import { StyledCard } from '@td/components/ui/card/card.styles';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import type { ICreateCommunityRequest } from '@td/types/community/community-function.types';
import { createCommunityStyles as styles } from './create-community.styles';

export const CreateCommunityScreen = () => {
	const { account } = useAuth();
	return (
		<CreateCommunityForm
			key={account?.userId ?? 'signed-out'}
			userId={account?.userId ?? null}
		/>
	);
};

const CreateCommunityForm = ({ userId }: { userId: string | null }) => {
	const router = useRouter();
	const [fields, setFields] = useState<
		Pick<ICreateCommunityRequest, 'name' | 'purpose'>
	>({ name: '', purpose: '' });
	const [submitted, setSubmitted] = useState(false);
	const [saving, setSaving] = useState(false);
	const [requestStarted, setRequestStarted] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const pending = useRef<ICreateCommunityRequest | null>(null);
	const inFlight = useRef(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const nameError = !fields.name.trim()
		? 'Enter a community name.'
		: fields.name.length > CommunityCreationLimits.name
			? 'Use 100 characters or fewer for the community name.'
			: undefined;
	const purposeError =
		fields.purpose.length > CommunityCreationLimits.purpose
			? 'Use 2,000 characters or fewer for the description.'
			: undefined;
	const updateField = (field: keyof typeof fields, value: string) => {
		if (pending.current || inFlight.current) return;
		setFields((current) => ({ ...current, [field]: value }));
		setSubmitted(false);
		setMessage(null);
	};
	const submit = async () => {
		if (inFlight.current) return;
		setSubmitted(true);
		if (nameError || purposeError) return;
		if (!userId) {
			setMessage('Sign in before creating a community.');
			return;
		}
		inFlight.current = true;
		setSaving(true);
		setRequestStarted(true);
		setMessage(null);
		try {
			pending.current ??= {
				...fields,
				settings: {},
				operationId: createCommunityOperationId(),
			};
			const result = await createCommunity(pending.current);
			if (result.community.organizer.userId !== userId)
				throw new Error('Unexpected organizer.');
			if (mounted.current)
				router.replace({
					pathname: '/communities/[communityId]',
					params: { communityId: result.community.communityId },
				});
		} catch (error) {
			const code =
				error && typeof error === 'object' && 'code' in error
					? error.code
					: null;
			if (
				mounted.current &&
				[
					'functions/unauthenticated',
					'functions/permission-denied',
					'functions/failed-precondition',
					'functions/invalid-argument',
				].includes(String(code))
			) {
				pending.current = null;
				setRequestStarted(false);
				setMessage(
					code === 'functions/invalid-argument'
						? 'Check your community details and try again.'
						: 'Sign in with a confirmed email and an available account to create a community.',
				);
				return;
			}
			if (mounted.current)
				setMessage(
					'We couldn’t confirm community creation. Your details are still here. Try again to confirm the same request.',
				);
		} finally {
			inFlight.current = false;
			if (mounted.current) setSaving(false);
		}
	};

	return (
		<TurndownScrollScreen
			backgroundColor={SurfaceColors.Screen}
			contentPadding={Spacing.Medium}
			bottomSpacing={Spacing.Large}
			keyboardEnabled
			testID='create-community-screen'
		>
			<View style={styles.content}>
				<View style={styles.intro}>
					<Typography
						size='Body2'
						tone='Secondary'
						style={styles.eyebrow}
					>
						CREATE A COMMUNITY
					</Typography>
					<View accessibilityRole='header'>
						<Typography
							size='Display'
							weight='Regular'
							style={styles.title}
						>
							Let’s get started
						</Typography>
					</View>
					<Typography
						tone='Secondary'
						weight='Regular'
						style={styles.description}
					>
						Give your community a name and (optional) description.
						You can always change these later.
					</Typography>
				</View>
				<View>
					<Input
						label='Community name'
						placeholder='e.g. Smith Family, Grace Church, etc.'
						value={fields.name}
						onChange={(value) => updateField('name', value)}
						{...(submitted && nameError
							? { errorMessage: nameError }
							: {})}
						readOnly={requestStarted}
						ignoreForm
						testID='community-name'
					/>
				</View>
				<View>
					<Input
						label='Description (optional)'
						readOnly={requestStarted}
						{...(submitted && purposeError
							? { errorMessage: purposeError }
							: {})}
						placeholder='What brings your community together?'
						value={fields.purpose}
						onChange={(value) => updateField('purpose', value)}
						multiline
						ignoreForm
						testID='community-description'
					/>
				</View>
				<View style={styles.privacy}>
					<Typography
						size='H3'
						weight='Semibold'
					>
						Privacy
					</Typography>
					<StyledCard
						padding={Spacing.Small}
						tone='Neutral'
						variant='Outlined'
						accessible
						accessibilityRole='text'
						accessibilityLabel='Invite only. Only people you invite can join.'
					>
						<View style={styles.row}>
							<View style={styles.icon}>
								<AppIcon
									name='Lock'
									tone='Brand'
								/>
							</View>
							<View style={styles.cardCopy}>
								<Typography weight='Semibold'>
									Invite only
								</Typography>
								<Typography
									tone='Secondary'
									weight='Regular'
								>
									Only people you invite can join.
								</Typography>
							</View>
						</View>
					</StyledCard>
				</View>
				<View style={styles.actions}>
					{message && (
						<View
							accessibilityLiveRegion='polite'
							accessibilityRole='alert'
						>
							<Typography
								tone='Error'
								weight='Regular'
							>
								{message}
							</Typography>
						</View>
					)}
					<TurndownButton
						size='Large'
						fullWidth
						loading={saving}
						disabled={saving}
						onPress={() => {
							void submit();
						}}
					>
						Create Community
					</TurndownButton>
				</View>
			</View>
		</TurndownScrollScreen>
	);
};
