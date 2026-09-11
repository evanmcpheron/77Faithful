const { getDefaultConfig } = require('expo/metro-config');
const {
	withStorybook,
} = require('@storybook/react-native/metro/withStorybook');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath =
	require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter(
	(ext) => ext !== 'svg',
);
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = withStorybook(config, {
	enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
});
