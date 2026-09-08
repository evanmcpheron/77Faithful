import Constants from 'expo-constants';
import { Amplify } from 'aws-amplify';

type AmplifyAuthOutputs = {
  aws_region: string;
  user_pool_client_id: string;
  user_pool_id: string;
};

type AmplifyOutputs = {
  auth: AmplifyAuthOutputs;
  version: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isAmplifyOutputs(value: unknown): value is AmplifyOutputs {
  if (
    !isRecord(value) ||
    typeof value.version !== 'string' ||
    !/^1(?:\.[1-5])?$/.test(value.version) ||
    !isRecord(value.auth)
  ) {
    return false;
  }

  return (
    typeof value.auth.aws_region === 'string' &&
    typeof value.auth.user_pool_id === 'string' &&
    typeof value.auth.user_pool_client_id === 'string'
  );
}

export function configureAmplify(outputs: unknown): boolean {
  if (!isAmplifyOutputs(outputs)) {
    return false;
  }

  Amplify.configure(outputs);
  return true;
}

configureAmplify(Constants.expoConfig?.extra?.amplifyOutputs);
