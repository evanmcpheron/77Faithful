module.exports = {
	root: true,
	extends: ['expo', 'plugin:prettier/recommended'],
	ignorePatterns: ['.expo/', 'coverage/', 'dist/', 'node_modules/'],
	rules: {
		'prettier/prettier': [
			'error',
			{},
			{
				usePrettierrc: true,
			},
		],
	},
};
