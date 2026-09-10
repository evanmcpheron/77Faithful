import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Animated,
	Modal,
	useWindowDimensions,
	type ViewStyle,
} from 'react-native';

import type { ISelectOption } from '@turndown/library';

import { Checkbox } from '@td/components/form/checkbox/checkbox.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { BrandColors, TextColors } from '@td/theme/colors';
import { IconSizes, IconStrokeWidths } from '@td/theme/icon-sizes';
import { Spacing } from '@td/theme/spacing';

import { useFormErrors, useFormName } from '../form/form.context';
import { getErrorMessage } from '../form/form.helpers';
import { useForm } from '../form/useForm.hook';
import {
	StyledDropdownBackdrop,
	StyledDropdownCheckboxOptionRow,
	StyledDropdownEmptyState,
	StyledDropdownFieldContainer,
	StyledDropdownMenu,
	StyledDropdownMenuScrollView,
	StyledDropdownModalRoot,
	StyledDropdownSingleOptionRow,
	StyledDropdownTag,
	StyledDropdownTagRemoveButton,
	StyledDropdownTagsContainer,
	StyledDropdownTrigger,
	StyledDropdownValueContainer,
} from './dropdown.styles';
import type { IDropdownProps } from './dropdown.types';

const DEFAULT_MAX_VISIBLE_OPTIONS = 5;
const MENU_OFFSET = Spacing.XSmall;
const MENU_ITEM_HEIGHT = Spacing.XXLarge;
const VIEWPORT_PADDING = Spacing.XSmall;

interface IMeasurableNode {
	measureInWindow: (
		callback: (x: number, y: number, width: number, height: number) => void,
	) => void;
}

interface ITriggerFrame {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface IDropdownMenuPosition {
	left: number;
	top: number;
	width: number;
	maxHeight: number;
}

const getResolvedSelectedValues = ({
	multiSelect,
	value,
}: {
	multiSelect?: boolean;
	value?: string | string[] | undefined;
}): string[] => {
	if (multiSelect) {
		return Array.isArray(value) ? value : [];
	}

	if (typeof value === 'string' && value.length > 0) {
		return [value];
	}

	return [];
};

const getDropdownMenuPosition = ({
	triggerFrame,
	windowHeight,
	windowWidth,
	optionCount,
	maxVisibleOptions,
}: {
	triggerFrame: ITriggerFrame;
	windowHeight: number;
	windowWidth: number;
	optionCount: number;
	maxVisibleOptions: number;
}): IDropdownMenuPosition => {
	const estimatedMenuHeight =
		Math.min(optionCount, maxVisibleOptions) * MENU_ITEM_HEIGHT +
		Spacing.Small;
	const spaceAbove = triggerFrame.y - VIEWPORT_PADDING;
	const spaceBelow =
		windowHeight -
		(triggerFrame.y + triggerFrame.height) -
		VIEWPORT_PADDING;
	const shouldOpenUpward =
		spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
	const availableHeight = Math.max(
		MENU_ITEM_HEIGHT,
		shouldOpenUpward ? spaceAbove : spaceBelow,
	);
	const maxHeight = Math.min(estimatedMenuHeight, availableHeight);
	const width = Math.min(
		triggerFrame.width,
		windowWidth - VIEWPORT_PADDING * 2,
	);
	const left = Math.min(
		Math.max(VIEWPORT_PADDING, triggerFrame.x),
		windowWidth - width - VIEWPORT_PADDING,
	);
	const top = shouldOpenUpward
		? Math.max(VIEWPORT_PADDING, triggerFrame.y - maxHeight - MENU_OFFSET)
		: Math.min(
				triggerFrame.y + triggerFrame.height + MENU_OFFSET,
				windowHeight - maxHeight - VIEWPORT_PADDING,
			);

	return {
		left,
		top,
		width,
		maxHeight,
	};
};

const getNextMultiSelectValue = ({
	checked,
	optionValue,
	selectedValues,
}: {
	checked: boolean;
	optionValue: string;
	selectedValues: string[];
}): string[] => {
	if (checked) {
		return Array.from(new Set([...selectedValues, optionValue]));
	}

	return selectedValues.filter(
		(selectedValue: string) => selectedValue !== optionValue,
	);
};

export const Dropdown = <T extends string = string>({
	name,
	label,
	options,
	multiSelect = false,
	placeholder = 'Select',
	value,
	defaultValue,
	disabled = false,
	ignoreForm = false,
	maxVisibleOptions = DEFAULT_MAX_VISIBLE_OPTIONS,
	testID,
	onChange,
	onSelect,
}: IDropdownProps<T>) => {
	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const formName = useFormName();
	const formErrors = useFormErrors();
	const formProxy = useForm({ formName });
	const triggerNodeRef = useRef<IMeasurableNode | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [internalValue, setInternalValue] = useState<T | T[] | undefined>(
		value ?? defaultValue,
	);
	const [menuPosition, setMenuPosition] =
		useState<IDropdownMenuPosition | null>(null);
	const [arrowAnimation] = useState(() => new Animated.Value(0));

	const usesFormProxy = Boolean(formName && name && !ignoreForm);
	const resolvedValue = usesFormProxy
		? internalValue
		: (value ?? internalValue);
	const formErrorMessage =
		formErrors?.form === formName && name
			? getErrorMessage(formErrors.errors ?? {}, name)
			: undefined;

	const selectedValues = useMemo(() => {
		return getResolvedSelectedValues({
			multiSelect,
			value: resolvedValue,
		});
	}, [multiSelect, resolvedValue]);

	const selectedValueSet = useMemo(() => {
		return new Set(selectedValues);
	}, [selectedValues]);

	const selectedOptions = useMemo(() => {
		return options.filter((option) => selectedValueSet.has(option.value));
	}, [options, selectedValueSet]);

	const isValueSelected = selectedOptions.length > 0;
	const selectedSingleOption = multiSelect
		? null
		: (selectedOptions[0] ?? null);

	const closeDropdown = useCallback(() => {
		setIsOpen(false);
	}, []);

	const measureDropdownPosition = useCallback(() => {
		triggerNodeRef.current?.measureInWindow(
			(x: number, y: number, width: number, height: number) => {
				const nextTriggerFrame = {
					x,
					y,
					width,
					height,
				};

				setMenuPosition(
					getDropdownMenuPosition({
						triggerFrame: nextTriggerFrame,
						windowHeight,
						windowWidth,
						optionCount: options.length,
						maxVisibleOptions,
					}),
				);
			},
		);
	}, [maxVisibleOptions, options.length, windowHeight, windowWidth]);

	const setDropdownValue = (nextValue: T | T[]) => {
		setInternalValue(nextValue);

		if (usesFormProxy && name) {
			formProxy.setValue(name, nextValue);
		}

		onChange?.(nextValue);
	};

	const openDropdown = useCallback(() => {
		if (disabled) {
			return;
		}

		measureDropdownPosition();
		setIsOpen(true);
	}, [disabled, measureDropdownPosition]);

	const handleTriggerPress = () => {
		if (isOpen) {
			closeDropdown();
			return;
		}

		openDropdown();
	};

	const handleSingleSelect = (option: ISelectOption) => {
		setDropdownValue(option.value as T);
		onSelect?.(option);
		closeDropdown();
	};

	const handleCheckboxChange = (optionValue: string, checked: boolean) => {
		setDropdownValue(
			getNextMultiSelectValue({
				checked,
				optionValue,
				selectedValues,
			}) as T[],
		);
	};

	const handleRemoveSelectedOption = (optionValue: string) => {
		if (!multiSelect) {
			return;
		}

		setDropdownValue(
			selectedValues.filter(
				(selectedValue: string) => selectedValue !== optionValue,
			) as T[],
		);
	};

	useEffect(() => {
		if (!usesFormProxy || !name) {
			return;
		}

		formProxy.registerField(name, defaultValue ?? (multiSelect ? [] : ''));

		const handleValueChange = (nextValue: unknown) => {
			setInternalValue(nextValue as T | T[] | undefined);
		};

		formProxy.subscribe(name, handleValueChange);

		return () => {
			formProxy.unsubscribe(name, handleValueChange);
			formProxy.deregisterField(name);
		};
	}, [defaultValue, formProxy, multiSelect, name, usesFormProxy]);

	const [previousValueProps, setPreviousValueProps] = useState({
		value,
		defaultValue,
		usesFormProxy,
	});

	if (
		!Object.is(previousValueProps.value, value) ||
		!Object.is(previousValueProps.defaultValue, defaultValue) ||
		previousValueProps.usesFormProxy !== usesFormProxy
	) {
		setPreviousValueProps({ value, defaultValue, usesFormProxy });
		if (!usesFormProxy) {
			setInternalValue(value ?? defaultValue);
		}
	}

	useEffect(() => {
		Animated.timing(arrowAnimation, {
			toValue: isOpen ? 1 : 0,
			duration: 180,
			useNativeDriver: true,
		}).start();
	}, [arrowAnimation, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		measureDropdownPosition();
	}, [isOpen, measureDropdownPosition, windowHeight, windowWidth]);

	const arrowAnimatedStyle = {
		transform: [
			{
				rotate: arrowAnimation.interpolate({
					inputRange: [0, 1],
					outputRange: ['180deg', '0deg'],
				}),
			},
		],
	};

	const dropdownMenuStyle: ViewStyle | undefined = menuPosition
		? {
				left: menuPosition.left,
				top: menuPosition.top,
				width: menuPosition.width,
				maxHeight: menuPosition.maxHeight,
			}
		: undefined;

	return (
		<StyledDropdownFieldContainer>
			<Typography
				size='H3'
				weight='Semibold'
			>
				{label}
			</Typography>

			<StyledDropdownTrigger
				ref={(node: unknown) => {
					triggerNodeRef.current =
						node as unknown as IMeasurableNode | null;
				}}
				accessibilityRole='button'
				accessibilityLabel={label}
				accessibilityState={{
					disabled,
					expanded: isOpen,
					selected: isValueSelected,
				}}
				disabled={disabled}
				isOpen={isOpen}
				onPress={handleTriggerPress}
				testID={testID}
			>
				<StyledDropdownValueContainer>
					{multiSelect ? (
						isValueSelected ? (
							<StyledDropdownTagsContainer>
								{selectedOptions.map(
									(option: ISelectOption) => (
										<StyledDropdownTag key={option.value}>
											<Typography size='Body'>
												{option.label}
											</Typography>

											<StyledDropdownTagRemoveButton
												accessibilityRole='button'
												accessibilityLabel={`Remove ${option.label}`}
												onPress={() =>
													handleRemoveSelectedOption(
														option.value,
													)
												}
											>
												<AppIcon
													size={Spacing.Medium}
													name='XCircle'
												/>
											</StyledDropdownTagRemoveButton>
										</StyledDropdownTag>
									),
								)}
							</StyledDropdownTagsContainer>
						) : (
							<Typography tone='Disabled'>
								{placeholder}
							</Typography>
						)
					) : selectedSingleOption ? (
						<Typography>{selectedSingleOption.label}</Typography>
					) : (
						<Typography tone='Disabled'>{placeholder}</Typography>
					)}
				</StyledDropdownValueContainer>

				<Animated.View style={arrowAnimatedStyle}>
					<AppIcon
						name='Arrow'
						color={
							isOpen ? BrandColors.Primary : TextColors.Secondary
						}
						size={IconSizes.Small}
						strokeWidth={IconStrokeWidths.Regular}
					/>
				</Animated.View>
			</StyledDropdownTrigger>

			{formErrorMessage ? (
				<Typography
					size='Body2'
					tone='Error'
				>
					{formErrorMessage}
				</Typography>
			) : null}

			<Modal
				transparent
				statusBarTranslucent
				animationType='none'
				visible={isOpen}
				onRequestClose={closeDropdown}
			>
				<StyledDropdownModalRoot>
					<StyledDropdownBackdrop onPress={closeDropdown} />

					{dropdownMenuStyle ? (
						<StyledDropdownMenu style={dropdownMenuStyle}>
							<StyledDropdownMenuScrollView
								keyboardShouldPersistTaps='handled'
								showsVerticalScrollIndicator={false}
							>
								{options.length === 0 ? (
									<StyledDropdownEmptyState>
										<Typography tone='Disabled'>
											No options available
										</Typography>
									</StyledDropdownEmptyState>
								) : (
									options.map((option: ISelectOption) => {
										const isSelected = selectedValueSet.has(
											option.value,
										);

										if (multiSelect) {
											return (
												<StyledDropdownCheckboxOptionRow
													key={option.value}
												>
													<Checkbox
														key={`${option.value}-${isSelected}`}
														label={option.label}
														checked={isSelected}
														onChange={(checked) =>
															handleCheckboxChange(
																option.value,
																checked,
															)
														}
													/>
												</StyledDropdownCheckboxOptionRow>
											);
										}

										return (
											<StyledDropdownSingleOptionRow
												key={option.value}
												accessibilityRole='button'
												accessibilityState={{
													selected: isSelected,
												}}
												isSelected={isSelected}
												onPress={() =>
													handleSingleSelect(option)
												}
											>
												<Typography size='H2'>
													{option.label}
												</Typography>
											</StyledDropdownSingleOptionRow>
										);
									})
								)}
							</StyledDropdownMenuScrollView>
						</StyledDropdownMenu>
					) : null}
				</StyledDropdownModalRoot>
			</Modal>
		</StyledDropdownFieldContainer>
	);
};
