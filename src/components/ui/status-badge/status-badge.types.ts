import type { TStatus } from '@td/types/global.types';
import { StyleProp, ViewStyle } from 'react-native';

export interface IStatusBadgeProps {
	status: TStatus;
	label?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}
