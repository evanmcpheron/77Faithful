import {
  addCalendarDays,
  calendarDateAtInstant,
  calendarDaysBetween,
  type CalendarDate,
  type JourneyCalendar,
} from './calendar';
import {
  JOURNEY_DAY_COUNT,
  toJourneyDayNumber,
  type JourneyDayNumber,
  type JourneyState,
} from './invariants';

export function journeyStateOnDate(
  startDate: CalendarDate,
  journeyToday: CalendarDate,
): JourneyState {
  const elapsedDay = calendarDaysBetween(startDate, journeyToday) + 1;
  if (elapsedDay < 1) return { status: 'notStarted' };
  if (elapsedDay > JOURNEY_DAY_COUNT) return { status: 'ended' };
  return { status: 'active', currentDay: toJourneyDayNumber(elapsedDay) };
}

export function journeyStateAtInstant(
  journey: JourneyCalendar,
  epochMilliseconds: number,
): JourneyState {
  return journeyStateOnDate(
    journey.startDate,
    calendarDateAtInstant(epochMilliseconds, journey.timeZone),
  );
}

export function journeyDateForDay(startDate: CalendarDate, day: JourneyDayNumber): CalendarDate {
  return addCalendarDays(startDate, day - 1);
}
