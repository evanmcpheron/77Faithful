import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const outputsPath = resolve(__dirname, 'amplify_outputs.json');

function loadAmplifyOutputs(): unknown | undefined {
  if (!existsSync(outputsPath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(outputsPath, 'utf8')) as unknown;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) {
    throw new Error('The static Expo configuration must define name and slug.');
  }

  const amplifyOutputs = loadAmplifyOutputs();

  return {
    ...config,
    name: config.name,
    slug: config.slug,
    extra: {
      ...config.extra,
      ...(amplifyOutputs === undefined ? {} : { amplifyOutputs }),
    },
  };
};
