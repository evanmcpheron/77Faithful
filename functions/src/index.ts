import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
	cancelPracticeSettingsForAccount,
	confirmPracticeSettingsForAccount,
	getPracticeSettingsForAccount,
} from './journey/practice-settings';
import {
	parseCancelPracticeSettingsRequest,
	parseConfirmPracticeSettingsRequest,
	parsePracticeSettingsRequest,
} from './journey/practice-settings-request';
import { refreshTodayVerseSources } from './journey/refresh-today-verses';
export {
	enrollCommunityJourney,
	getCommunityJourneyEnrollment,
	withdrawCommunityJourneyEnrollment,
} from './community/community-journey-enrollment';

import { getJourneyDayForAccount } from './journey/journey-day';
import {
	completeJourneyPracticeForAccount,
	saveJourneyReflectionForAccount,
} from './journey/journey-day-participation';
import {
	parseCompleteJourneyPracticeRequest,
	parseGetJourneyDayRequest,
	parseSaveJourneyReflectionRequest,
} from './journey/journey-day-request';
import {
	parseStartJourneyRequest,
	startJourneyForAccount,
} from './journey/start-journey';

initializeApp();
setGlobalOptions({ maxInstances: 10 });

export const getPracticeSettings = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to view your practices.',
		);
	return getPracticeSettingsForAccount(
		request.auth.uid,
		parsePracticeSettingsRequest(request.data),
	);
});

export const confirmOptionalPracticeReplacement = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to change your practices.',
		);
	return confirmPracticeSettingsForAccount(
		request.auth.uid,
		parseConfirmPracticeSettingsRequest(request.data),
	);
});

export const cancelOptionalPracticeReplacement = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to change your practices.',
		);
	return cancelPracticeSettingsForAccount(
		request.auth.uid,
		parseCancelPracticeSettingsRequest(request.data),
	);
});

export const startJourney = onCall(async (request) => {
	if (!request.auth)
		throw new HttpsError(
			'unauthenticated',
			'Sign in before starting your journey.',
		);
	if (request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Confirm your email before starting your journey.',
		);
	return startJourneyForAccount(
		request.auth.uid,
		parseStartJourneyRequest(request.data),
	);
});

export const getJourneyDay = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to open this day.',
		);
	return getJourneyDayForAccount(
		request.auth.uid,
		parseGetJourneyDayRequest(request.data),
	);
});

export const setJourneyPracticeCompletion = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to update this day.',
		);
	return completeJourneyPracticeForAccount(
		request.auth.uid,
		parseCompleteJourneyPracticeRequest(request.data),
	);
});

export const saveJourneyReflection = onCall(async (request) => {
	if (!request.auth || request.auth.token.email_verified !== true)
		throw new HttpsError(
			'permission-denied',
			'Sign in with a confirmed email to save your reflection.',
		);
	return saveJourneyReflectionForAccount(
		request.auth.uid,
		parseSaveJourneyReflectionRequest(request.data),
	);
});

export const refreshTodayVerses = onSchedule(
	{
		schedule: '0 3 * * 0',
		timeZone: 'Etc/UTC',
		secrets: ['API_BIBLE_KEY'],
		timeoutSeconds: 540,
		maxInstances: 1,
		retryCount: 0,
	},
	async () => {
		await refreshTodayVerseSources();
	},
);

export { listReflections } from './journey/list-reflections';

export { createCommunity } from './community/create-community';

export {
	closeCommunity,
	leaveCommunity,
	removeCommunityMember,
	transferCommunityOrganizer,
	updateCommunity,
} from './community/community-administration';

export {
	communityAuthUserDeleted,
	resumeCommunityCleanup,
} from './community/community-cleanup';
export {
	getCurrentCommunityInvitation,
	issueCommunityInvitation,
	revokeCommunityInvitation,
	rotateCommunityInvitation,
} from './community/community-invitation';
export {
	acceptCommunityInvitation,
	previewCommunityInvitation,
} from './community/community-invitation-redemption';
export {
	cancelCommunityJourney,
	configureCommunityJourney,
	getCommunityJourneyCourseOption,
	getCommunityJourneySchedule,
	listCommunityJourneyHistory,
	reviseCommunityJourney,
} from './community/community-journey';
export {
	createCommunityPost,
	deleteCommunityPost,
	editCommunityPost,
	getCommunityPost,
	listCommunityPosts,
} from './community/community-post';
export {
	blockCommunityMember,
	listBlockedCommunityMembers,
	reportCommunityContent,
	unblockCommunityMember,
} from './community/community-safety';
export {
	claimCommunitySafetyReport,
	getCommunitySafetyReport,
	listCommunitySafetyReports,
	reviewCommunityReport,
} from './community/community-safety-review';
export {
	createCommunityReply,
	deleteCommunityReply,
	editCommunityReply,
	listCommunityPrayerSupport,
	listCommunityReplies,
	setCommunityPrayerAcknowledgment,
	setCommunityPrayerRequestStatus,
} from './community/community-thread';
export { listOwnCommunityContributions } from './community/own-community-contributions';
export { getCommunity, listCommunities } from './community/read-community';
export {
	getCommunityContext,
	listCommunityMembers,
	listCommunityPage,
} from './community/read-community-context';
