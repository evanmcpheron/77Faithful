import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';
import {
	getDaySessionCalendar,
	getDaySessionGeneration,
	getDaySessionRevision,
	subscribeDaySessions,
} from './journey-day-cache';

export const useDaySessionContext = () => {
	useSyncExternalStore(
		subscribeDaySessions,
		getDaySessionRevision,
		getDaySessionRevision,
	);
	const [calendar, setCalendar] = useState(getDaySessionCalendar);
	useFocusEffect(
		useCallback(() => {
			setCalendar(getDaySessionCalendar());
			const interval = setInterval(
				() => setCalendar(getDaySessionCalendar()),
				1000,
			);
			return () => clearInterval(interval);
		}, []),
	);
	return `${getDaySessionGeneration()}:${calendar}`;
};
