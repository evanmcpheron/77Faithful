import type {
	ICreateCommunityRequest,
	ICreateCommunityResult,
} from '../../types/community/community-function.types';

export const CommunityCreationLimits = {
	name: 100,
	purpose: 2000,
	displayName: 80,
	participationExpectations: 2000,
} as const;
const record = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid community data.');
	return value as Record<string, unknown>;
};
const text = (value: unknown, max: number, required: boolean): string => {
	if (
		typeof value !== 'string' ||
		value.length > max ||
		(required && !value.trim())
	)
		throw new Error('Invalid community text.');
	return value.trim();
};

export const parseCreateCommunityRequest = (
	value: unknown,
): ICreateCommunityRequest => {
	const input = record(value);
	const keys = ['name', 'purpose', 'settings', 'operationId'];
	if (
		Object.keys(input).length !== keys.length ||
		!keys.every((key) => key in input) ||
		typeof input['operationId'] !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(input['operationId'])
	)
		throw new Error('Invalid community request.');
	const settings = record(input['settings']);
	if (
		Object.keys(settings).some((key) => key !== 'participationExpectations')
	)
		throw new Error('Invalid community settings.');
	return {
		name: text(input['name'], CommunityCreationLimits.name, true),
		purpose: text(input['purpose'], CommunityCreationLimits.purpose, false),
		settings:
			'participationExpectations' in settings
				? {
						participationExpectations: text(
							settings['participationExpectations'],
							CommunityCreationLimits.participationExpectations,
							false,
						),
					}
				: {},
		operationId: input['operationId'],
	};
};

export const parseCreateCommunityResult = (
	value: unknown,
): ICreateCommunityResult => {
	const community = record(record(value)['community']);
	const organizer = record(community['organizer']);
	if (
		typeof community['communityId'] !== 'string' ||
		!/^[a-zA-Z0-9_-]{1,128}$/.test(community['communityId']) ||
		typeof organizer['userId'] !== 'string' ||
		!organizer['userId'] ||
		!['Active', 'Closed'].includes(String(community['status']))
	)
		throw new Error('Invalid community response.');
	return {
		community: {
			communityId: community['communityId'],
			name: text(community['name'], CommunityCreationLimits.name, true),
			purpose: text(
				community['purpose'],
				CommunityCreationLimits.purpose,
				false,
			),
			organizer: {
				userId: organizer['userId'],
				displayName: text(
					organizer['displayName'],
					CommunityCreationLimits.displayName,
					false,
				),
			},
			status: community['status'] === 'Active' ? 'Active' : 'Closed',
			...('participationExpectations' in community
				? {
						participationExpectations: text(
							community['participationExpectations'],
							CommunityCreationLimits.participationExpectations,
							false,
						),
					}
				: {}),
		},
	};
};
