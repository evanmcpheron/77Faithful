// prettier.config.cjs
module.exports = {
	plugins: ['prettier-plugin-organize-imports'],
	useTabs: true,
	tabWidth: 4,
	singleQuote: true,
	jsxSingleQuote: true,
	semi: true,
	trailingComma: 'all',
	printWidth: 80,

	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'always',

	singleAttributePerLine: true,
	objectWrap: 'preserve',

	proseWrap: 'always',
	endOfLine: 'lf',
	embeddedLanguageFormatting: 'auto',
};
