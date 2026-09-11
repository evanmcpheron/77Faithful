/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/**/*.test.ts'],
	moduleNameMapper: {
		'^@td/assets/(.*)$': '<rootDir>/src/assets/$1',
		'^@td/components/(.*)$': '<rootDir>/src/components/$1',
		'^@td/features/(.*)$': '<rootDir>/src/features/$1',
		'^@td/services/(.*)$': '<rootDir>/src/services/$1',
		'^@td/providers/(.*)$': '<rootDir>/src/providers/$1',
		'^@td/navigation/(.*)$': '<rootDir>/src/navigation/$1',
		'^@td/hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^@td/utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@td/constants/(.*)$': '<rootDir>/src/constants/$1',
		'^@td/types/(.*)$': '<rootDir>/src/types/$1',
		'^@td/theme/(.*)$': '<rootDir>/src/theme/$1',
	},
};
