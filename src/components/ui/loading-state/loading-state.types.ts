export const LoadingStateSize = {
	Small: 'Small',
	Large: 'Large',
} as const;

export type TLoadingStateSize =
	(typeof LoadingStateSize)[keyof typeof LoadingStateSize];

export interface ILoadingStateProps {
	label?: string;
	size?: TLoadingStateSize;
	testID?: string;
}
