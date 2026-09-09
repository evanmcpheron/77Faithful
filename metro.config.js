const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const tamaguiEntryPath = require.resolve('tamagui');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Nested portal copies create separate contexts from TamaguiProvider's context.
  if (moduleName === '@tamagui/portal') {
    return context.resolveRequest(
      { ...context, originModulePath: tamaguiEntryPath },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
