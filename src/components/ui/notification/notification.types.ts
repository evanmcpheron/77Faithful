import { Dimensions } from 'react-native';

export const NotificationType = {
	Success: 'Success',
	Error: 'Error',
	Warning: 'Warning',
	Info: 'Info',
} as const;

export type TNotificationType =
	(typeof NotificationType)[keyof typeof NotificationType];

export interface INotificationProps {
	visible: boolean;
	title?: string;
	message?: string;
	onClose?: () => void;
	duration?: number;
	type?: TNotificationType;
}

export interface INotificationPayload {
	type: TNotificationType;
	title?: string;
	message?: string;
	duration?: number;
}

export const NOTIFICATION_SCREEN = Dimensions.get('window');
export const NOTIFICATION_IN_DURATION = 220;
export const NOTIFICATION_OUT_DURATION = 180;
