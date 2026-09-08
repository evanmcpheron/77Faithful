const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs');
const { join, resolve } = require('node:path');

const cloudAssemblyDirectory = resolve('.amplify/verification-cdk.out');

function findTemplateFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return findTemplateFiles(path);
    }

    return entry.endsWith('.template.json') ? [path] : [];
  });
}

function readResources(templateFiles) {
  return templateFiles.flatMap((templateFile) => {
    const template = JSON.parse(readFileSync(templateFile, 'utf8'));
    return Object.entries(template.Resources ?? {}).map(([logicalId, resource]) => ({
      logicalId,
      ...resource,
    }));
  });
}

function findFiles(directory, fileName) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return findFiles(path, fileName);
    }

    return entry === fileName ? [path] : [];
  });
}

function requireSingleResource(resources, type) {
  const matches = resources.filter((resource) => resource.Type === type);

  if (matches.length !== 1) {
    throw new Error(`Expected one ${type} resource, found ${matches.length}.`);
  }

  return matches[0];
}

async function main() {
  process.env.CDK_CONTEXT_JSON = JSON.stringify({
    'amplify-backend-name': '77faithful-verification',
    'amplify-backend-namespace': 'verification',
    'amplify-backend-type': 'sandbox',
  });
  process.env.CDK_OUTDIR = cloudAssemblyDirectory;

  const { backend } = await import('../amplify/backend.ts');
  backend.stack.node.root.synth({
    errorOnDuplicateSynth: false,
    outdir: cloudAssemblyDirectory,
  });

  const templateFiles = findTemplateFiles(cloudAssemblyDirectory);

  if (templateFiles.length === 0) {
    throw new Error('The Amplify backend produced no CloudFormation templates.');
  }

  const resources = readResources(templateFiles);
  const userPool = requireSingleResource(resources, 'AWS::Cognito::UserPool');
  const userPoolClient = requireSingleResource(resources, 'AWS::Cognito::UserPoolClient');
  const identityPool = requireSingleResource(resources, 'AWS::Cognito::IdentityPool');
  const graphQlApi = requireSingleResource(resources, 'AWS::AppSync::GraphQLApi');
  const dataTables = resources.filter(
    (resource) => resource.Type === 'Custom::AmplifyDynamoDBTable',
  );
  const schemaFiles = findFiles(cloudAssemblyDirectory, 'model-schema.graphql');

  if (schemaFiles.length !== 1) {
    throw new Error(`Expected one generated model schema, found ${schemaFiles.length}.`);
  }

  const modelSchema = readFileSync(schemaFiles[0], 'utf8');
  const applicationFunctions = resources.filter(
    (resource) =>
      resource.Type === 'AWS::Lambda::Function' &&
      (JSON.stringify(resource.Properties?.Tags) ?? '').includes('faithful77-data-invariants'),
  );
  const applicationFunctionPolicies = resources.filter(
    (resource) =>
      resource.Type === 'AWS::IAM::Policy' &&
      (JSON.stringify(resource.Properties?.PolicyDocument) ?? '').includes('dynamodb:GetItem') &&
      (JSON.stringify(resource.Properties?.PolicyDocument) ?? '').includes('dynamodb:PutItem'),
  );
  const s3Buckets = resources.filter((resource) => resource.Type === 'AWS::S3::Bucket');

  const generatedSchemaChecks = [
    [
      'type UserProfile @model(subscriptions:null,mutations:{create:null,delete:null},queries:{list:null})',
      'UserProfile exposes only owner get/update operations',
    ],
    [
      'type Journey @model(mutations:null,subscriptions:null)',
      'Journey generated mutations and subscriptions are disabled',
    ],
    [
      'type DailyEntry @model(subscriptions:null,mutations:{create:null,delete:null},queries:{list:null})',
      'DailyEntry exposes only owner get/update/index operations',
    ],
    ['identityClaim: "sub"', 'model and protected-field ownership uses the Cognito sub claim'],
    ['queryField: "listDailyEntriesByJourney"', 'DailyEntry has the Journey/day query index'],
    ['@validate(type: gte, value: "1"', 'DailyEntry rejects day numbers below 1'],
    ['@validate(type: lte, value: "77"', 'DailyEntry rejects day numbers above 77'],
    ['ensureUserProfile: UserProfile', 'trusted ensureUserProfile mutation exists'],
    ['startJourney(startDate: AWSDate!', 'trusted startJourney mutation uses a date-only start'],
    ['ensureDailyEntry(journeyId: ID!, day: Int!)', 'trusted ensureDailyEntry mutation exists'],
    ['morningIntention: String', 'private morning intention storage exists'],
    ['reflectionText: String', 'private Reflection writing storage exists'],
  ];

  const checks = [
    [userPool.Properties.UserPoolTier === 'LITE', 'Cognito tier is LITE'],
    [
      JSON.stringify(userPool.Properties.UsernameAttributes) === JSON.stringify(['email']),
      'email is the only username attribute',
    ],
    [
      JSON.stringify(userPool.Properties.AutoVerifiedAttributes) === JSON.stringify(['email']),
      'email is the only auto-verified attribute',
    ],
    [userPool.Properties.MfaConfiguration === 'OFF', 'MFA is disabled'],
    [
      JSON.stringify(userPool.Properties.AccountRecoverySetting?.RecoveryMechanisms) ===
        JSON.stringify([{ Name: 'verified_email', Priority: 1 }]),
      'account recovery is email-only',
    ],
    [
      JSON.stringify(userPool.Properties.Policies?.SignInPolicy?.AllowedFirstAuthFactors) ===
        JSON.stringify(['PASSWORD']),
      'password is the only first authentication factor',
    ],
    [
      JSON.stringify(userPoolClient.Properties.ExplicitAuthFlows) ===
        JSON.stringify(['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH']),
      'the app client permits SRP password auth and refresh only',
    ],
    [
      userPoolClient.Properties.AllowedOAuthFlowsUserPoolClient === false &&
        ['AllowedOAuthFlows', 'AllowedOAuthScopes', 'CallbackURLs', 'LogoutURLs'].every(
          (property) => !userPoolClient.Properties[property]?.length,
        ),
      'OAuth authorization-server features and redirect URLs are disabled',
    ],
    [
      identityPool.Properties.AllowUnauthenticatedIdentities === false,
      'guest identities are disabled',
    ],
    [
      graphQlApi.Properties.AuthenticationType === 'AMAZON_COGNITO_USER_POOLS',
      'Cognito user pools are the default Data authorization mode',
    ],
    [
      JSON.stringify(graphQlApi.Properties.AdditionalAuthenticationProviders) ===
        JSON.stringify([{ AuthenticationType: 'AWS_IAM' }]),
      'Data has only the framework-required IAM secondary mode and no public API key',
    ],
    [dataTables.length === 3, 'exactly three application model tables are synthesized'],
    [
      generatedSchemaChecks.every(([fragment]) => modelSchema.includes(fragment)),
      'the generated schema preserves models, protected operations, indexes, and trusted mutations',
    ],
    [
      applicationFunctions.length >= 1 &&
        applicationFunctions.every((resource) => {
          const variables = resource.Properties?.Environment?.Variables ?? {};
          return (
            resource.Properties?.Runtime === 'nodejs24.x' &&
            !('DATA_INVARIANT_TEST_CATALOG' in variables) &&
            ['USER_PROFILE_TABLE_NAME', 'JOURNEY_TABLE_NAME', 'DAILY_ENTRY_TABLE_NAME'].every(
              (name) => name in variables,
            )
          );
        }),
      'the trusted Node 24 invariant handler receives only the three model table names',
    ],
    [
      applicationFunctionPolicies.length >= 1 &&
        applicationFunctionPolicies.every((resource) => {
          const statements = resource.Properties.PolicyDocument.Statement ?? [];
          return statements.every(
            (statement) =>
              statement.Effect === 'Allow' &&
              JSON.stringify(statement.Action) ===
                JSON.stringify(['dynamodb:GetItem', 'dynamodb:PutItem']),
          );
        }),
      'the trusted handler has only DynamoDB GetItem and PutItem access',
    ],
    [
      s3Buckets.length === 2 &&
        s3Buckets.every((resource) =>
          /(AmplifyCodegenAssets|modelIntrospectionSchemaBucket)/.test(resource.logicalId),
        ),
      'S3 is limited to Amplify-generated schema/codegen infrastructure (no app Storage)',
    ],
  ];

  const failedChecks = checks.filter(([passed]) => !passed);

  if (failedChecks.length > 0) {
    throw new Error(
      `Amplify backend verification failed:\n${failedChecks
        .map(([, description]) => `- ${description}`)
        .join('\n')}`,
    );
  }

  console.log('Amplify Auth + Data template verification passed:');
  for (const [, description] of checks) {
    console.log(`- ${description}`);
  }
  for (const [, description] of generatedSchemaChecks) {
    console.log(`- ${description}`);
  }
  console.log('- synthesis verifies structure, not deployed authorization enforcement');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
