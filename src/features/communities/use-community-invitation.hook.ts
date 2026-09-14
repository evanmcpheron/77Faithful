import type {
	IIssueCommunityInvitationRequest,
	IRevokeCommunityInvitationRequest,
	IRotateCommunityInvitationRequest,
} from '@td/types/community/community-function.types';
import type { IOrganizerCommunityInvitation } from '@td/types/community/community-invitation.types';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	createCommunityInvitationOperationId,
	getCommunityInvitationReason,
	getCurrentCommunityInvitation,
	issueCommunityInvitation,
	revokeCommunityInvitation,
	rotateCommunityInvitation,
} from './community-invitation.service';

export type TCommunityInvitationScreenState =
	| { status: 'Idle' }
	| { status: 'Loading' }
	| { status: 'None' }
	| { status: 'Ready'; invitation: IOrganizerCommunityInvitation }
	| { status: 'Unavailable' }
	| { status: 'Error' };

export type TCommunityInvitationMutation = 'Issue' | 'Rotate' | 'Revoke' | null;

const accessDeniedReasons = new Set([
	'AuthenticationRequired',
	'EmailVerificationRequired',
	'AccountUnavailable',
	'CommunityUnavailable',
	'OrganizerRequired',
	'CommunityClosed',
	'MembershipRemoved',
	'MembershipUnavailable',
]);

interface IPendingInvitationOperations {
	issue: IIssueCommunityInvitationRequest | null;
	rotate: IRotateCommunityInvitationRequest | null;
	revoke: IRevokeCommunityInvitationRequest | null;
}

const emptyPendingOperations = (): IPendingInvitationOperations => ({
	issue: null,
	rotate: null,
	revoke: null,
});

export const useCommunityInvitation = ({
	userId,
	communityId,
	canManage,
}: {
	userId: string | null;
	communityId: string | undefined;
	canManage: boolean;
}) => {
	const [state, setState] = useState<TCommunityInvitationScreenState>({
		status: 'Idle',
	});
	const [mutation, setMutation] =
		useState<TCommunityInvitationMutation>(null);
	const [mutationMessage, setMutationMessage] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);
	const requestGeneration = useRef(0);
	const pending = useRef<IPendingInvitationOperations>(
		emptyPendingOperations(),
	);
	const inFlight = useRef(false);

	const clearSensitiveState = useCallback(() => {
		requestGeneration.current += 1;
		pending.current = emptyPendingOperations();
		inFlight.current = false;
		setMutation(null);
		setMutationMessage(null);
		setState({ status: canManage ? 'Loading' : 'Idle' });
	}, [canManage]);

	useEffect(() => clearSensitiveState, [clearSensitiveState]);

	useFocusEffect(
		useCallback(() => {
			const generation = ++requestGeneration.current;
			if (!userId || !communityId || !canManage) {
				setState({ status: 'Idle' });
				return;
			}

			setState({ status: 'Loading' });
			setMutationMessage(null);
			void getCurrentCommunityInvitation(communityId).then(
				(invitation) => {
					if (generation !== requestGeneration.current) return;
					if (invitation && invitation.communityId !== communityId) {
						setState({ status: 'Unavailable' });
						return;
					}
					setState(
						invitation
							? { status: 'Ready', invitation }
							: { status: 'None' },
					);
				},
				(error: unknown) => {
					if (generation !== requestGeneration.current) return;
					const reason = getCommunityInvitationReason(error);
					setState({
						status:
							reason && accessDeniedReasons.has(reason)
								? 'Unavailable'
								: 'Error',
					});
				},
			);

			return () => {
				if (requestGeneration.current === generation) {
					requestGeneration.current += 1;
					setState({ status: 'Loading' });
				}
			};
			// Retry changes intentionally rerun this focused-screen load.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [userId, communityId, canManage, attempt]),
	);

	const handleMutationFailure = useCallback((error: unknown) => {
		const reason = getCommunityInvitationReason(error);
		if (reason && accessDeniedReasons.has(reason)) {
			pending.current = emptyPendingOperations();
			setState({ status: 'Unavailable' });
			setMutationMessage(null);
			return;
		}
		setMutationMessage(
			reason
				? 'We couldn’t update this invitation. Please try again.'
				: 'We couldn’t confirm whether the invitation changed. Try again to confirm the same request.',
		);
	}, []);

	const issue = useCallback(async () => {
		if (inFlight.current || !communityId || !canManage) return;
		const generation = requestGeneration.current;
		inFlight.current = true;
		setMutation('Issue');
		setMutationMessage(null);
		pending.current.issue ??= {
			communityId,
			operationId: createCommunityInvitationOperationId(),
		};
		try {
			const invitation = await issueCommunityInvitation(
				pending.current.issue,
			);
			if (generation !== requestGeneration.current) return;
			if (invitation.communityId !== communityId)
				throw new Error('Unexpected invitation response.');
			pending.current.issue = null;
			setState({ status: 'Ready', invitation });
		} catch (error) {
			if (generation !== requestGeneration.current) return;
			handleMutationFailure(error);
		} finally {
			if (generation !== requestGeneration.current) return;
			inFlight.current = false;
			setMutation(null);
		}
	}, [canManage, communityId, handleMutationFailure]);

	const rotate = useCallback(async () => {
		if (inFlight.current || !communityId || !canManage) return;
		const generation = requestGeneration.current;
		inFlight.current = true;
		setMutation('Rotate');
		setMutationMessage(null);
		pending.current.rotate ??= {
			communityId,
			operationId: createCommunityInvitationOperationId(),
		};
		try {
			const invitation = await rotateCommunityInvitation(
				pending.current.rotate,
			);
			if (generation !== requestGeneration.current) return;
			if (invitation.communityId !== communityId)
				throw new Error('Unexpected invitation response.');
			pending.current.rotate = null;
			pending.current.revoke = null;
			setState({ status: 'Ready', invitation });
		} catch (error) {
			if (generation !== requestGeneration.current) return;
			handleMutationFailure(error);
		} finally {
			if (generation !== requestGeneration.current) return;
			inFlight.current = false;
			setMutation(null);
		}
	}, [canManage, communityId, handleMutationFailure]);

	const revoke = useCallback(async () => {
		if (
			inFlight.current ||
			!communityId ||
			!canManage ||
			state.status !== 'Ready'
		)
			return;
		const generation = requestGeneration.current;
		inFlight.current = true;
		setMutation('Revoke');
		setMutationMessage(null);
		pending.current.revoke ??= {
			communityId,
			invitationId: state.invitation.invitationId,
			operationId: createCommunityInvitationOperationId(),
		};
		try {
			const result = await revokeCommunityInvitation(
				pending.current.revoke,
			);
			if (generation !== requestGeneration.current) return;
			if (
				result.communityId !== communityId ||
				result.invitationId !== state.invitation.invitationId
			)
				throw new Error('Unexpected invitation response.');
			pending.current.revoke = null;
			setState({ status: 'None' });
		} catch (error) {
			if (generation !== requestGeneration.current) return;
			handleMutationFailure(error);
		} finally {
			if (generation !== requestGeneration.current) return;
			inFlight.current = false;
			setMutation(null);
		}
	}, [canManage, communityId, handleMutationFailure, state]);

	const retry = useCallback(() => setAttempt((value) => value + 1), []);

	return {
		state,
		mutation,
		mutationMessage,
		issue,
		rotate,
		revoke,
		retry,
	};
};
