import { Fragment } from 'react';

import { AppIcon } from '@td/components/ui/icon/icon.component';
import { IconName } from '@td/components/ui/icon/icon.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { IconSizes } from '@td/theme/icon-sizes';
import { TypographySize, TypographyWeight } from '@td/theme/typography';
import { ComponentTone } from '@td/types/ui.types';

import {
	StyledNavigationActionList,
	StyledNavigationActionListChevron,
	StyledNavigationActionListIconContainer,
	StyledNavigationActionListItem,
	StyledNavigationActionListSeparator,
	StyledNavigationActionListTitleContainer,
} from './navigation-action-list.styles';
import type {
	INavigationActionListItem,
	INavigationActionListProps,
} from './navigation-action-list.types';

const normalizeNavigationActionListItems = (
	actions: INavigationActionListProps['actions'],
): readonly INavigationActionListItem[] => {
	return Array.isArray(actions) ? actions : [actions];
};

export const NavigationActionList = ({
	actions,
	testID,
}: INavigationActionListProps) => {
	const navigationActionListItems =
		normalizeNavigationActionListItems(actions);

	const handleItemPress = (item: INavigationActionListItem) => {
		if (item.disabled || !item.onPress) {
			return;
		}

		item.onPress(item);
	};

	return (
		<StyledNavigationActionList testID={testID}>
			{navigationActionListItems.map((item, itemIndex) => {
				const isLastItem =
					itemIndex === navigationActionListItems.length - 1;
				const isPressable = Boolean(item.onPress) && !item.disabled;

				return (
					<Fragment key={item.id}>
						<StyledNavigationActionListItem
							accessibilityLabel={
								item.accessibilityLabel ?? item.title
							}
							accessibilityRole={
								isPressable ? 'button' : undefined
							}
							accessibilityState={{ disabled: item.disabled }}
							disabled={item.disabled}
							onPress={
								isPressable
									? () => handleItemPress(item)
									: undefined
							}
						>
							<StyledNavigationActionListIconContainer>
								<AppIcon
									name={item.iconName}
									size={IconSizes.Large}
									tone={ComponentTone.Neutral}
								/>
							</StyledNavigationActionListIconContainer>

							<StyledNavigationActionListTitleContainer>
								<Typography
									numberOfLines={1}
									size={TypographySize.H1}
									weight={TypographyWeight.Semibold}
								>
									{item.title}
								</Typography>
							</StyledNavigationActionListTitleContainer>

							<StyledNavigationActionListChevron>
								<AppIcon
									name={IconName.Arrow}
									size={IconSizes.Medium}
									tone={ComponentTone.Neutral}
								/>
							</StyledNavigationActionListChevron>
						</StyledNavigationActionListItem>

						{!isLastItem ? (
							<StyledNavigationActionListSeparator />
						) : null}
					</Fragment>
				);
			})}
		</StyledNavigationActionList>
	);
};
