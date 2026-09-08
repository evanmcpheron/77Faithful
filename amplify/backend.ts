import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

export const backend = defineBackend({
  auth,
});

const { cfnIdentityPool, cfnUserPool, cfnUserPoolClient } = backend.auth.resources.cfnResources;

cfnIdentityPool.allowUnauthenticatedIdentities = false;
cfnUserPool.userPoolTier = 'LITE';
cfnUserPool.addPropertyOverride('Policies.SignInPolicy.AllowedFirstAuthFactors', ['PASSWORD']);
cfnUserPoolClient.explicitAuthFlows = ['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'];
