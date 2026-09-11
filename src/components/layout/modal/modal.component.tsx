import { Modal as ReactNativeModal, View } from 'react-native';

import { Card } from '@td/components/ui/card/card.component';
import { CardVariant } from '@td/components/ui/card/card.types';
import { ComponentPadding } from '@td/types/ui.types';

import { IconButton } from '@td/components/ui/icon-button/icon-button.component';
import { IconName } from '@td/components/ui/icon/icon-map.types';
import { Typography } from '@td/components/ui/typography/typography.component';
import { IconSizes } from '@td/theme/icon-sizes';
import { TypographySize, TypographyWeight } from '@td/theme/typography';
import {
	StyledModalBackdrop,
	StyledModalBlur,
	StyledModalContent,
	StyledModalRoot,
	StyledModalTintOverlay,
} from './modal.styles';
import type { IModalProps } from './modal.types';

export const Modal = ({ children, open, title, onClose }: IModalProps) => {
	return (
		<ReactNativeModal
			transparent
			statusBarTranslucent
			animationType='fade'
			visible={open}
			onRequestClose={onClose}
		>
			<StyledModalRoot>
				<StyledModalBackdrop
					accessibilityRole='button'
					accessibilityLabel='Close modal'
					onPress={onClose}
				>
					<StyledModalBlur
						intensity={18}
						tint='dark'
					/>
					<StyledModalTintOverlay pointerEvents='none' />
				</StyledModalBackdrop>

				<StyledModalContent>
					<Card
						padding={ComponentPadding.Medium}
						variant={CardVariant.Default}
					>
						<View
							style={{
								alignItems: 'center',
								flexDirection: 'row',
								justifyContent: 'space-between',
							}}
						>
							<Typography
								size={TypographySize.Display}
								weight={TypographyWeight.Bold}
							>
								{title}
							</Typography>
							<IconButton
								name={IconName.XCircleFilled}
								iconSize={IconSizes.XLarge}
								onPress={onClose}
								hasBackground={false}
								accessibilityLabel={'close modal button'}
							/>
						</View>
						{children}
					</Card>
				</StyledModalContent>
			</StyledModalRoot>
		</ReactNativeModal>
	);
};
