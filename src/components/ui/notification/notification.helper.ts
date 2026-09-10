import type {
	INotificationPayload,
	TNotificationType,
} from './notification.types';

type TNotificationListener = (payload: INotificationPayload | null) => void;

const listeners = new Set<TNotificationListener>();

export const subscribeToNotifications = (listener: TNotificationListener) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const showNotification = (payload: INotificationPayload) => {
	for (const listener of Array.from(listeners)) {
		listener(payload);
	}
};

export const hideNotification = () => {
	for (const listener of Array.from(listeners)) {
		listener(null);
	}
};

const createNotificationShortcut =
	(type: TNotificationType, defaultTitle: string) =>
	(message: string, title?: string, duration?: number) => {
		showNotification({
			type,
			message,
			title: title ?? defaultTitle,
			duration,
		});
	};

export const showSuccessNotification = createNotificationShortcut(
	'Success',
	'Success',
);

export const showErrorNotification = createNotificationShortcut(
	'Error',
	'Something went wrong',
);

export const showInfoNotification = createNotificationShortcut(
	'Info',
	'Notice',
);

export const showWarningNotification = createNotificationShortcut(
	'Warning',
	'Warning',
);
