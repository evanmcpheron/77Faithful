import { Card } from '@td/components/ui/card/card.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import type { IPracticeDefinition } from '@td/types/formation/practice.types';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { SetupColumn, SetupRow } from './journey-setup.styles';
import { SetupCheckboxChoice } from './setup-checkbox-choice.component';

export const SetupPracticeChoice = ({
	practice,
	checked,
	disabled,
	onChange,
}: {
	practice: IPracticeDefinition;
	checked: boolean;
	disabled: boolean;
	onChange: (checked: boolean) => void;
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<Card variant={checked ? 'Muted' : 'Outlined'}>
			<SetupColumn>
				<SetupRow>
					<SetupCheckboxChoice
						label={practice.name}
						checked={checked}
						disabled={disabled}
						onChange={onChange}
					/>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} ${practice.name} guidance`}
						accessibilityState={{ expanded: isExpanded }}
						onPress={() => setIsExpanded(!isExpanded)}
						style={{
							minWidth: 44,
							minHeight: 44,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<AppIcon name='Arrow' />
					</Pressable>
				</SetupRow>
				{isExpanded && (
					<SetupColumn>
						<Typography>{practice.purpose}</Typography>
						<Typography tone='Muted'>
							{practice.examples.join(' ')}
						</Typography>
						<Typography
							tone='Muted'
							size='Body2'
						>
							{practice.boundaries}
						</Typography>
					</SetupColumn>
				)}
			</SetupColumn>
		</Card>
	);
};
