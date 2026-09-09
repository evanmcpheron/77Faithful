import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, YStack } from 'tamagui';

import {
  SeventySevenText,
  SeventySevenTextAlignment,
  SeventySevenTextSize,
} from '@77/components/core';
import {
  SeventySevenFormCheckbox,
  SeventySevenFormRadioButton,
  SeventySevenFormRadioGroup,
  SeventySevenFormTextInput,
  SeventySevenFormTextInputType,
} from '@77/components/form';

export default function HomeScreen() {
  const [emailAddress, setEmailAddress] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('formation77');
  const [reflection, setReflection] = useState('');
  const [shouldRememberReflection, setShouldRememberReflection] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('Daily');

  return (
    <ScrollView flex={1} bg="$background">
      <YStack width="100%" maxW={600} self="center" justify="center" gap="$6" px="$5" py="$8">
        <YStack gap="$2">
          <SeventySevenText
            size={SeventySevenTextSize.HeadingLarge}
            alignment={SeventySevenTextAlignment.Center}
          >
            Form components
          </SeventySevenText>
          <SeventySevenText alignment={SeventySevenTextAlignment.Center} color="$color10">
            Inputs, selections, and validation states.
          </SeventySevenText>
        </YStack>

        <YStack gap="$5">
          <SeventySevenFormTextInput placeholder="Input without a label" />

          <SeventySevenFormTextInput
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            value={emailAddress}
            onChangeText={setEmailAddress}
          />

          <SeventySevenFormTextInput
            label="Age"
            placeholder="Enter your age"
            type={SeventySevenFormTextInputType.Number}
            value={age}
            onChangeText={setAge}
          />

          <SeventySevenFormTextInput
            label="Password"
            placeholder="Enter your password"
            type={SeventySevenFormTextInputType.Password}
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />

          <SeventySevenFormTextInput
            label="Required field"
            placeholder="This field is required"
            errorMessage="Please fill out this field."
          />

          <SeventySevenFormTextInput
            label="Reflection"
            placeholder="Write a few thoughts about today..."
            isLongForm
            value={reflection}
            onChangeText={setReflection}
          />

          <SeventySevenFormTextInput label="Disabled field" value="Unavailable" disabled />

          <SeventySevenFormCheckbox
            label="Remember this reflection"
            checked={shouldRememberReflection}
            onCheckedChange={setShouldRememberReflection}
          />

          <SeventySevenFormCheckbox
            label="Disabled checkbox"
            checked={false}
            disabled
            onCheckedChange={setShouldRememberReflection}
          />

          <SeventySevenFormRadioGroup
            label="Reminder frequency"
            value={reminderFrequency}
            onValueChange={setReminderFrequency}
          >
            <SeventySevenFormRadioButton label="Daily" value="Daily" />
            <SeventySevenFormRadioButton label="Weekly" value="Weekly" />
            <SeventySevenFormRadioButton label="Never" value="Never" disabled />
          </SeventySevenFormRadioGroup>
        </YStack>

        <StatusBar style="auto" />
      </YStack>
    </ScrollView>
  );
}
