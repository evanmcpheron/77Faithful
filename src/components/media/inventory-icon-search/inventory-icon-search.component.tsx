import { useMemo, useState } from 'react';

import { Input } from '@td/components/form/input/input.component';
import { Chip } from '@td/components/ui/chip/chip.component';
import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { AppIcon } from '@td/components/ui/icon/icon.component';
import type {
	IInventoryIconOption,
	TIconName,
	TIconVariant,
} from '@td/components/ui/icon/icon.types';
import {
	IconName,
	IconVariant,
	inventoryIconOptions,
} from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { IconSizes } from '@td/theme/icon-sizes';
import { TypographySize, TypographyWeight } from '@td/theme/typography';
import { ComponentTone } from '@td/types/ui.types';

import { Row } from '@td/components/layout/row/row.component';
import { TurndownButton } from '@td/components/ui/button/button.component';
import {
	StyledInventoryIconCategorySlot,
	StyledInventoryIconEmptyState,
	StyledInventoryIconGrid,
	StyledInventoryIconLabelSlot,
	StyledInventoryIconMeta,
	StyledInventoryIconOptionButton,
	StyledInventoryIconPreview,
	StyledInventoryIconResults,
	StyledInventoryIconSearch,
	StyledInventoryIconSearchControls,
	StyledInventoryIconSearchInput,
	StyledInventoryIconTypeFilters,
} from './inventory-icon-search.styles';
import type { IInventoryIconSearchProps } from './inventory-icon-search.types';

const IconVariantOptions = Object.values(IconVariant) as TIconVariant[];

const normalizeSearchValue = (value: string): string => {
	return value.trim().toLowerCase();
};

const getSearchableIconText = (
	inventoryIconOption: IInventoryIconOption,
): string => {
	return normalizeSearchValue(
		`${inventoryIconOption.label} ${inventoryIconOption.name} ${inventoryIconOption.category}`,
	);
};

export const InventoryIconSearch = ({
	defaultVariant = IconVariant.Regular,
	selectedIconName,
	testID,
	onSave,
	onCancel,
	onSelect,
}: IInventoryIconSearchProps) => {
	const [searchText, setSearchText] = useState('');
	const [selectedVariant, setSelectedVariant] =
		useState<TIconVariant>(defaultVariant);
	const [showTypeFilters, setShowTypeFilters] = useState(false);
	const [internalSelectedIconName, setInternalSelectedIconName] =
		useState<TIconName | null>(selectedIconName ?? null);

	const normalizedSearchText = normalizeSearchValue(searchText);
	const resolvedSelectedIconName =
		selectedIconName ?? internalSelectedIconName;

	const filteredIconOptions = useMemo(() => {
		if (!normalizedSearchText) {
			return inventoryIconOptions;
		}

		return inventoryIconOptions.filter((inventoryIconOption) => {
			return getSearchableIconText(inventoryIconOption).includes(
				normalizedSearchText,
			);
		});
	}, [normalizedSearchText]);

	const handleIconSelect = (inventoryIconOption: IInventoryIconOption) => {
		setInternalSelectedIconName(inventoryIconOption.name);
		onSelect?.(inventoryIconOption, selectedVariant);
	};

	const handleFilterButtonPress = () => {
		setShowTypeFilters((currentValue) => !currentValue);
	};

	return (
		<StyledInventoryIconSearch testID={testID}>
			<StyledInventoryIconSearchControls>
				<StyledInventoryIconSearchInput>
					<Input
						ignoreForm
						leadingIconName={IconName.Search}
						placeholder='Search inventory icons'
						value={searchText}
						onChange={setSearchText}
					/>
				</StyledInventoryIconSearchInput>

				<IconButton
					accessibilityLabel='Filter icon type'
					hasBackground
					name={IconName.Filter}
					tone={
						showTypeFilters
							? ComponentTone.Brand
							: ComponentTone.Neutral
					}
					onPress={handleFilterButtonPress}
				/>
			</StyledInventoryIconSearchControls>

			{showTypeFilters ? (
				<StyledInventoryIconTypeFilters>
					{IconVariantOptions.map((iconVariant) => (
						<Chip
							key={iconVariant}
							selected={selectedVariant === iconVariant}
							tone={
								selectedVariant === iconVariant
									? ComponentTone.Brand
									: ComponentTone.Neutral
							}
							onPress={() => setSelectedVariant(iconVariant)}
						>
							{iconVariant}
						</Chip>
					))}
				</StyledInventoryIconTypeFilters>
			) : null}

			<StyledInventoryIconMeta>
				<Typography
					size={TypographySize.H3}
					weight={TypographyWeight.Semibold}
				>
					{filteredIconOptions.length} icons
				</Typography>
			</StyledInventoryIconMeta>

			{filteredIconOptions.length > 0 ? (
				<StyledInventoryIconResults
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
				>
					<StyledInventoryIconGrid>
						{filteredIconOptions.map((inventoryIconOption) => {
							const isSelected =
								resolvedSelectedIconName ===
								inventoryIconOption.name;

							return (
								<StyledInventoryIconOptionButton
									accessibilityLabel={`Select ${inventoryIconOption.label} icon`}
									accessibilityRole='button'
									accessibilityState={{
										selected: isSelected,
									}}
									key={inventoryIconOption.name}
									selected={isSelected}
									onPress={() =>
										handleIconSelect(inventoryIconOption)
									}
								>
									<StyledInventoryIconPreview>
										<AppIcon
											name={inventoryIconOption.name}
											size={IconSizes.Large}
											variant={selectedVariant}
										/>
									</StyledInventoryIconPreview>

									<StyledInventoryIconLabelSlot>
										<Typography
											align='center'
											numberOfLines={2}
											size={TypographySize.Body2}
											weight={TypographyWeight.Semibold}
										>
											{inventoryIconOption.label}
										</Typography>
									</StyledInventoryIconLabelSlot>

									<StyledInventoryIconCategorySlot>
										<Typography
											align='center'
											numberOfLines={1}
											size={TypographySize.Body2}
											tone='Muted'
										>
											{inventoryIconOption.category}
										</Typography>
									</StyledInventoryIconCategorySlot>
								</StyledInventoryIconOptionButton>
							);
						})}
					</StyledInventoryIconGrid>
				</StyledInventoryIconResults>
			) : (
				<StyledInventoryIconEmptyState>
					<AppIcon
						name={IconName.Search}
						size={IconSizes.Large}
						tone={ComponentTone.Neutral}
					/>
					<Typography
						align='center'
						size={TypographySize.H3}
						weight={TypographyWeight.Semibold}
					>
						No icons found
					</Typography>
					<Typography
						align='center'
						size={TypographySize.Body2}
						tone='Muted'
					>
						Try a different inventory item name.
					</Typography>
				</StyledInventoryIconEmptyState>
			)}
			<Row>
				<TurndownButton
					onPress={() => {
						if (!resolvedSelectedIconName || !selectedVariant) {
							return;
						}
						const selectedOption = inventoryIconOptions.find(
							(option) =>
								option.name === resolvedSelectedIconName,
						);
						if (!selectedOption) {
							return;
						}
						onSave?.(selectedOption, selectedVariant);
					}}
				>
					Save
				</TurndownButton>
				<TurndownButton
					onPress={() => onCancel?.()}
					tone={ComponentTone.Neutral}
				>
					Cancel
				</TurndownButton>
			</Row>
		</StyledInventoryIconSearch>
	);
};
