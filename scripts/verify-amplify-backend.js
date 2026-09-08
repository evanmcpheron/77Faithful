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
    return Object.values(template.Resources ?? {});
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
      identityPool.Properties.AllowUnauthenticatedIdentities === false,
      'guest identities are disabled',
    ],
  ];

  const forbiddenResourceTypes = new Set([
    'AWS::AppSync::GraphQLApi',
    'AWS::DynamoDB::Table',
    'AWS::Lambda::Function',
    'AWS::S3::Bucket',
  ]);
  const forbiddenResources = resources.filter((resource) =>
    forbiddenResourceTypes.has(resource.Type),
  );

  if (forbiddenResources.length > 0) {
    throw new Error(
      `Unexpected out-of-scope resources: ${forbiddenResources
        .map((resource) => resource.Type)
        .join(', ')}.`,
    );
  }

  const failedChecks = checks.filter(([passed]) => !passed);

  if (failedChecks.length > 0) {
    throw new Error(
      `Amplify Auth verification failed:\n${failedChecks
        .map(([, description]) => `- ${description}`)
        .join('\n')}`,
    );
  }

  console.log('Amplify Auth template verification passed:');
  for (const [, description] of checks) {
    console.log(`- ${description}`);
  }
  console.log('- no Data, DynamoDB, Lambda, or S3 resources are present');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
