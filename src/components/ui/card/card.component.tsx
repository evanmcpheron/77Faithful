import { ComponentPadding, ComponentTone } from '@td/types/ui.types';
import { StyledCard } from './card.styles';
import { CardVariant, type ICardProps } from './card.types';

export const Card = ({
	children,
	padding = ComponentPadding.Medium,
	tone = ComponentTone.Neutral,
	onPress,
	variant = CardVariant.Outlined,
	testID,
}: ICardProps) => {
	return (
		<StyledCard
			padding={padding}
			testID={testID}
			onPress={onPress}
			tone={tone}
			variant={variant}
		>
			{children}
		</StyledCard>
	);
};
