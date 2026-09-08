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

// Remove CDK's default OAuth code flow and example callback from this SDK-only client.
cfnUserPoolClient.allowedOAuthFlowsUserPoolClient = false;
cfnUserPoolClient.allowedOAuthFlows = undefined;
cfnUserPoolClient.allowedOAuthScopes = undefined;
cfnUserPoolClient.callbackUrLs = undefined;
