export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			EXPO_PUBLIC_BASE_URL?: string;
			EXPO_PUBLIC_STORYBOOK_ENABLED?: string;
			EXPO_PUBLIC_COMMUNITIES_ENABLED?: string;
		}
	}
}
