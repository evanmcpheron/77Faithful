import { parseDayNumber } from './day-number';

it('accepts every day in the 77-day route range', () => {
  for (let dayNumber = 1; dayNumber <= 77; dayNumber += 1) {
    expect(parseDayNumber(String(dayNumber))).toBe(dayNumber);
  }
});

it.each([
  { value: undefined },
  { value: [] },
  { value: ['1'] },
  { value: ['1', '2'] },
  { value: '' },
  { value: '0' },
  { value: '-1' },
  { value: '78' },
  { value: '999999999999999999999' },
  { value: '1.5' },
  { value: '1.0' },
  { value: '1e1' },
  { value: '0x10' },
  { value: 'NaN' },
  { value: 'Infinity' },
  { value: 'abc' },
  { value: 'day1' },
  { value: '1/prayer' },
  { value: ' 1' },
  { value: '1 ' },
  { value: '1\n' },
  { value: '+1' },
  { value: '01' },
])('rejects a malformed or noncanonical day parameter: $value', ({ value }) => {
  expect(parseDayNumber(value)).toBeNull();
});
