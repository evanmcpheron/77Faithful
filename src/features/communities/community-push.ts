import type {
	IRegisterCommunityPushInstallationRequest,
	IUnregisterCommunityPushInstallationRequest,
} from '../../types/community/community-push.types';

const installationPattern = /^[A-Za-z0-9]{20}$/;
const secretPattern = /^[a-f0-9]{64}$/;
const operationPattern = /^[A-Za-z0-9_-]{1,128}$/;
const tokenPattern =
	/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{1,200}\]$/;
const permissions = ['NotRequested', 'Granted', 'Denied', 'Unavailable'];
const object = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Invalid push request.');
	return value as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, fields: string[]): void => {
	if (
		Object.keys(value).length !== fields.length ||
		!fields.every((field) =>
			Object.prototype.hasOwnProperty.call(value, field),
		)
	)
		throw new Error('Unexpected push field.');
};
const common = (value: Record<string, unknown>): void => {
	if (
		typeof value['installationId'] !== 'string' ||
		!installationPattern.test(value['installationId']) ||
		typeof value['installationSecret'] !== 'string' ||
		!secretPattern.test(value['installationSecret']) ||
		typeof value['operationId'] !== 'string' ||
		!operationPattern.test(value['operationId'])
	)
		throw new Error('Invalid push identity.');
};
export const parseRegisterCommunityPushInstallationRequest = (
	value: unknown,
): IRegisterCommunityPushInstallationRequest => {
	const input = object(value);
	exact(input, [
		'installationId',
		'installationSecret',
		'operationId',
		'token',
		'permission',
		'deliveryEnabled',
	]);
	common(input);
	if (
		(input['token'] !== null &&
			(typeof input['token'] !== 'string' ||
				!tokenPattern.test(input['token']))) ||
		!permissions.includes(input['permission'] as string) ||
		typeof input['deliveryEnabled'] !== 'boolean' ||
		(input['permission'] !== 'Granted' && input['token'] !== null) ||
		(input['deliveryEnabled'] &&
			(input['permission'] !== 'Granted' || input['token'] === null))
	)
		throw new Error('Invalid push state.');
	return input as unknown as IRegisterCommunityPushInstallationRequest;
};
export const parseUnregisterCommunityPushInstallationRequest = (
	value: unknown,
): IUnregisterCommunityPushInstallationRequest => {
	const input = object(value);
	exact(input, ['installationId', 'installationSecret', 'operationId']);
	common(input);
	return input as unknown as IUnregisterCommunityPushInstallationRequest;
};
