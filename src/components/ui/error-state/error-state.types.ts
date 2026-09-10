import type { TIconName } from '@td/components/ui/icon/icon.types';

export interface IErrorStateProps {
	title?: string;
	message?: string;
	iconName?: TIconName;
	retryLabel?: string;
	testID?: string;
	onRetry?: () => void;
}
