import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { parseStartJourneyRequest, startJourneyForAccount } from './journey/start-journey';

initializeApp();
setGlobalOptions({ maxInstances: 10 });

export const startJourney = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'Sign in before starting your journey.');
  if (request.auth.token.email_verified !== true)
    throw new HttpsError('permission-denied', 'Confirm your email before starting your journey.');
  return startJourneyForAccount(request.auth.uid, parseStartJourneyRequest(request.data));
});
