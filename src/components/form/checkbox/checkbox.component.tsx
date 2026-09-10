import { useEffect, useState } from 'react';

import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { IconStrokeWidths } from '@td/theme/icon-sizes';

import { IconName } from '@td/components/ui/icon/icon-map.types';
import { useFormName } from '../form/form.context';
import { useForm } from '../form/useForm.hook';
import {
	StyledCheckboxButton,
	StyledCheckboxContainer,
	StyledUncheckedBox,
} from './checkbox.styles';
import type { ICheckboxProps } from './checkbox.types';

export const Checkbox = ({
	name,
	label,
	checked,
	defaultValue = false,
	disabled = false,
	ignoreForm = false,
	onChange,
}: ICheckboxProps) => {
	const formName = useFormName();
	const formProxy = useForm({ formName });
	const [internalChecked, setInternalChecked] = useState(
		checked ?? defaultValue,
	);

	const usesFormProxy = Boolean(formName && name && !ignoreForm);

	useEffect(() => {
		if (!usesFormProxy || !name) {
			return;
		}

		formProxy.registerField(name, checked ?? defaultValue);

		const handleValueChange = (nextValue: unknown) => {
			setInternalChecked(Boolean(nextValue));
		};

		formProxy.subscribe(name, handleValueChange);

		return () => {
			formProxy.unsubscribe(name, handleValueChange);
			formProxy.deregisterField(name);
		};
	}, [checked, defaultValue, formProxy, name, usesFormProxy]);

	useEffect(() => {
		if (usesFormProxy) {
			return;
		}

		setInternalChecked(checked ?? defaultValue);
	}, [checked, defaultValue, usesFormProxy]);

	const handlePress = () => {
		if (disabled) {
			return;
		}

		const nextCheckedValue = !internalChecked;

		setInternalChecked(nextCheckedValue);

		if (usesFormProxy && name) {
			formProxy.setValue(name, nextCheckedValue);
		}

		onChange?.(nextCheckedValue);
	};

	return (
		<StyledCheckboxContainer
			disabled={disabled}
			onPress={handlePress}
		>
			<StyledCheckboxButton>
				{internalChecked ? (
					<StyledUncheckedBox>
						<AppIcon
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: [
									{ translateX: '-50%' },
									{ translateY: '-50%' },
								],
							}}
							name={IconName.Checkmark}
							strokeWidth={IconStrokeWidths.Regular}
						/>
					</StyledUncheckedBox>
				) : (
					<StyledUncheckedBox />
				)}
			</StyledCheckboxButton>

			{label ? <Typography>{label}</Typography> : null}
		</StyledCheckboxContainer>
	);
};
