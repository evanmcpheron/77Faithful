import { useEffect, useRef, useState } from 'react';

import { Notification } from './notification.component';
import { subscribeToNotifications } from './notification.helper';
import type { INotificationPayload } from './notification.types';

export const NotificationHost = () => {
	const [current, setCurrent] = useState<INotificationPayload | null>(null);
	const queueRef = useRef<INotificationPayload[]>([]);
	const showingRef = useRef(false);

	useEffect(() => {
		return subscribeToNotifications((payload) => {
			if (!payload) {
				setCurrent(null);
				showingRef.current = false;
				return;
			}

			if (showingRef.current) {
				queueRef.current.push(payload);
			} else {
				setCurrent(payload);
				showingRef.current = true;
			}
		});
	}, []);

	const handleClose = () => {
		const next = queueRef.current.shift();

		if (next) {
			setCurrent(next);
			showingRef.current = true;
		} else {
			setCurrent(null);
			showingRef.current = false;
		}
	};

	return (
		<Notification
			visible={!!current}
			title={current?.title}
			message={current?.message}
			type={current?.type ?? 'Info'}
			duration={current?.duration ?? 4000}
			onClose={handleClose}
		/>
	);
};
