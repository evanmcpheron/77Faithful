import { TurndownButton } from '@td/components/ui/button/button.component';
import { ProgressBar } from '@td/components/ui/progress-bar/progress-bar.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SetupColumn, SetupRow } from './journey-setup.styles';

interface IJourneySetupStepperProps {
	children: ReactNode;
	currentStep: number;
	totalSteps: number;
	stepTitle: string;
	stepDescription: string;
	isOptional: boolean;
	isContinueDisabled: boolean;
	isBusy: boolean;
	primaryActionLabel: string;
	onContinue: () => void;
	onBack?: (() => void) | undefined;
	onSkip?: (() => void) | undefined;
}
export const JourneySetupStepper = ({
	children,
	currentStep,
	totalSteps,
	stepTitle,
	stepDescription,
	isOptional,
	isContinueDisabled,
	isBusy,
	primaryActionLabel,
	onContinue,
	onBack,
	onSkip,
}: IJourneySetupStepperProps) => (
	<SetupColumn>
		<SetupRow>
			<Typography tone='Muted'>
				Step {currentStep} of {totalSteps}
			</Typography>
			{isOptional && <Typography tone='Muted'>Optional</Typography>}
		</SetupRow>
		<View
			accessibilityRole='progressbar'
			accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
			accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
		>
			<ProgressBar
				value={currentStep}
				max={totalSteps}
			/>
		</View>
		<Typography
			size='H1'
			weight='Semibold'
		>
			{stepTitle}
		</Typography>
		<Typography tone='Muted'>{stepDescription}</Typography>
		{children}
		<TurndownButton
			testID='journey-setup-continue'
			disabled={isContinueDisabled || isBusy}
			onPress={onContinue}
		>
			{primaryActionLabel}
		</TurndownButton>
		{onSkip && (
			<TurndownButton
				variant='Outline'
				disabled={isBusy}
				onPress={onSkip}
			>
				Skip for now
			</TurndownButton>
		)}
		{onBack && (
			<TurndownButton
				variant='Ghost'
				disabled={isBusy}
				onPress={onBack}
			>
				Back
			</TurndownButton>
		)}
	</SetupColumn>
);
