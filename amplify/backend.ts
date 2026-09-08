import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { dataInvariants } from './data-invariants/resource';

export const backend = defineBackend({
  auth,
  data,
  dataInvariants,
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

const invariantFunction = backend.dataInvariants.resources.lambda;
for (const [modelName, environmentName] of [
  ['UserProfile', 'USER_PROFILE_TABLE_NAME'],
  ['Journey', 'JOURNEY_TABLE_NAME'],
  ['DailyEntry', 'DAILY_ENTRY_TABLE_NAME'],
] as const) {
  const table = backend.data.resources.tables[modelName];
  backend.dataInvariants.addEnvironment(environmentName, table.tableName);
  table.grant(invariantFunction, 'dynamodb:GetItem', 'dynamodb:PutItem');
}
