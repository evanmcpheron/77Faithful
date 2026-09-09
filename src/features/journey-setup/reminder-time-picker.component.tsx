import { useId, useState } from 'react';
import { Adapt, Label, Select, Sheet, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const periods = ['AM', 'PM'];

interface ITimePartSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
}

const TimePartSelect = ({ label, value, options, onValueChange }: ITimePartSelectProps) => {
  const selectId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (selectedValue: string) => {
    if (options.includes(selectedValue)) onValueChange(selectedValue);
  };

  return (
    <YStack flex={1} minW={0} gap="$2">
      <Label htmlFor={selectId} unstyled>
        <SeventySevenText color="$textSecondary">{label}</SeventySevenText>
      </Label>
      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={value}
        onValueChange={handleValueChange}
      >
        <Select.Trigger id={selectId} aria-label={label} minH={48} px="$2" bg="$surface">
          <Select.Value />
          <SeventySevenText aria-hidden>⌄</SeventySevenText>
        </Select.Trigger>
        <Adapt platform="touch">
          <>
            {isOpen && (
              <Sheet
                open={isOpen}
                onOpenChange={setIsOpen}
                modal
                dismissOnSnapToBottom
                snapPoints={[50]}
              >
                <Sheet.Overlay bg="$shadowColor" opacity={0.5} />
                <Sheet.Frame bg="$surface" p="$4">
                  <Sheet.Handle />
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
              </Sheet>
            )}
          </>
        </Adapt>
        <Select.Content>
          <Select.ScrollUpButton>
            <SeventySevenText>⌃</SeventySevenText>
          </Select.ScrollUpButton>
          <Select.Viewport minW={100}>
            <Select.Group>
              <Select.Label>{label}</Select.Label>
              {options.map((option, index) => (
                <Select.Item key={option} index={index} value={option} minH={44}>
                  <Select.ItemText>{option}</Select.ItemText>
                  <Select.ItemIndicator>
                    <SeventySevenText>✓</SeventySevenText>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton>
            <SeventySevenText>⌄</SeventySevenText>
          </Select.ScrollDownButton>
        </Select.Content>
      </Select>
    </YStack>
  );
};

interface IReminderTimePickerProps {
  label: string;
  value: string;
  onValueChange: (time: string) => void;
}

export const formatReminderTime = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

export const ReminderTimePicker = ({ label, value, onValueChange }: IReminderTimePickerProps) => {
  const [hour, minute] = value.split(':').map(Number);
  const period = hour < 12 ? 'AM' : 'PM';

  const handleHourChange = (selectedHour: string) => {
    const nextHour = (Number(selectedHour) % 12) + (period === 'PM' ? 12 : 0);
    onValueChange(`${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const handleMinuteChange = (selectedMinute: string) => {
    onValueChange(`${String(hour).padStart(2, '0')}:${selectedMinute}`);
  };

  const handlePeriodChange = (selectedPeriod: string) => {
    const nextHour = (hour % 12) + (selectedPeriod === 'PM' ? 12 : 0);
    onValueChange(`${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  return (
    <YStack gap="$2" role="group" aria-label={label}>
      <SeventySevenText bold>{label}</SeventySevenText>
      <XStack gap="$2">
        <TimePartSelect
          label="Hour"
          value={String(hour % 12 || 12)}
          options={hours}
          onValueChange={handleHourChange}
        />
        <TimePartSelect
          label="Minute"
          value={String(minute).padStart(2, '0')}
          options={minutes}
          onValueChange={handleMinuteChange}
        />
        <TimePartSelect
          label="AM/PM"
          value={period}
          options={periods}
          onValueChange={handlePeriodChange}
        />
      </XStack>
    </YStack>
  );
};
