import {
	buildCommunityInvitationLink,
	createCommunityInviteIntent,
	isCommunityInviteIntentExpired,
	parseCommunityInvitationUrl,
	parseStoredCommunityInviteIntent,
} from './community-invite-intent';

jest.mock('expo-secure-store', () => ({
	AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
	isAvailableAsync: jest.fn(),
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

const code = '23456789ABCDEFGHJKMN';
const configuration = {
	schemes: ['mobile'],
	ownedHosts: ['links.example.org'],
};

it.each([
	`mobile:///communities/join?invitationCode=${code}`,
	`mobile://communities/join?invitationCode=${code}`,
	`https://links.example.org/communities/join?invitationCode=${code}`,
])('accepts only configured invitation entry points: %s', (url) => {
	expect(parseCommunityInvitationUrl(url, configuration)).toBe(code);
});

it.each([
	`other:///communities/join?invitationCode=${code}`,
	`https://foreign.example/communities/join?invitationCode=${code}`,
	`http://links.example.org/communities/join?invitationCode=${code}`,
	`mobile:///today?invitationCode=${code}`,
	`mobile:///communities/join?invitationCode=${code}&redirect=https://foreign.example`,
	`mobile:///communities/join?invitationCode=${code}&invitationCode=${code}`,
	`mobile:///communities/join?invitationCode=too-short`,
	`mobile://user:password@communities/join?invitationCode=${code}`,
	`mobile:///communities/join?invitationCode=${code}#redirect`,
	`mobile:///communities/join?token=${code}`,
])('rejects foreign, conflicting, or malformed URLs: %s', (url) => {
	expect(parseCommunityInvitationUrl(url, configuration)).toBeNull();
});

it('rejects oversized URLs before parsing their token', () => {
	expect(
		parseCommunityInvitationUrl(
			`mobile:///communities/join?invitationCode=${code}${'A'.repeat(2_100)}`,
			configuration,
		),
	).toBeNull();
});

it('builds the configured native invitation route without a redirect', () => {
	expect(
		buildCommunityInvitationLink('23456-789AB-CDEFG-HJKMN', 'mobile'),
	).toBe(`mobile:///communities/join?invitationCode=${code}`);
	expect(() =>
		buildCommunityInvitationLink(code, 'https://foreign.example'),
	).toThrow('Invalid application link scheme.');
});

it('bounds receipt lifetime and validates cold-start storage', () => {
	const intent = createCommunityInviteIntent(code, 1_000, null);
	expect(intent.expiresAt).toBe(2_592_001_000);
	expect(isCommunityInviteIntentExpired(intent, intent.expiresAt - 1)).toBe(
		false,
	);
	expect(isCommunityInviteIntentExpired(intent, intent.expiresAt)).toBe(true);
	expect(parseStoredCommunityInviteIntent(JSON.stringify(intent))).toEqual(
		intent,
	);
	expect(
		parseStoredCommunityInviteIntent(
			JSON.stringify({ ...intent, expiresAt: intent.expiresAt + 1 }),
		),
	).toBeNull();
	expect(
		parseStoredCommunityInviteIntent(
			JSON.stringify({ ...intent, rawUrl: 'private' }),
		),
	).toBeNull();
});
