import { Dropdown } from '@td/components/form/dropdown/dropdown.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { View } from 'react-native';
import { SetupColumn, SetupRow } from './journey-setup.styles';

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = Array.from({ length: 60 }, (_, index) =>
	String(index).padStart(2, '0'),
);
const periods = ['AM', 'PM'];
const TimePartSelect = ({
	label,
	value,
	options,
	onValueChange,
	disabled,
}: {
	label: string;
	value: string;
	options: readonly string[];
	onValueChange: (value: string) => void;
	disabled: boolean;
}) => (
	<View style={{ flex: 1, minWidth: 0 }}>
		<Dropdown
			ignoreForm
			label={label}
			value={value}
			disabled={disabled}
			options={options.map((option) => ({
				label: option,
				value: option,
			}))}
			onSelect={(option) => onValueChange(option.value)}
		/>
	</View>
);

interface IReminderTimePickerProps {
	label: string;
	value: string;
	onValueChange: (time: string) => void;
	disabled: boolean;
}

export const formatReminderTime = (time: string): string => {
	const [hour = 0, minute = 0] = time.split(':').map(Number);
	return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

export const ReminderTimePicker = ({
	label,
	value,
	onValueChange,
	disabled,
}: IReminderTimePickerProps) => {
	const [hour = 0, minute = 0] = value.split(':').map(Number);
	const period = hour < 12 ? 'AM' : 'PM';

	const handleHourChange = (selectedHour: string) => {
		const nextHour =
			(Number(selectedHour) % 12) + (period === 'PM' ? 12 : 0);
		onValueChange(
			`${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
		);
	};

	const handleMinuteChange = (selectedMinute: string) => {
		onValueChange(`${String(hour).padStart(2, '0')}:${selectedMinute}`);
	};

	const handlePeriodChange = (selectedPeriod: string) => {
		const nextHour = (hour % 12) + (selectedPeriod === 'PM' ? 12 : 0);
		onValueChange(
			`${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
		);
	};

	return (
		<SetupColumn accessibilityLabel={label}>
			<Typography weight='Semibold'>{label}</Typography>
			<SetupRow>
				<TimePartSelect
					disabled={disabled}
					label='Hour'
					value={String(hour % 12 || 12)}
					options={hours}
					onValueChange={handleHourChange}
				/>
				<TimePartSelect
					disabled={disabled}
					label='Minute'
					value={String(minute).padStart(2, '0')}
					options={minutes}
					onValueChange={handleMinuteChange}
				/>
				<TimePartSelect
					disabled={disabled}
					label='AM/PM'
					value={period}
					options={periods}
					onValueChange={handlePeriodChange}
				/>
			</SetupRow>
		</SetupColumn>
	);
};
