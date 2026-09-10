import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import { FeedbackColors, NeutralColors } from '@td/theme/colors';
import { Radius } from '@td/theme/radius';
import { Spacing } from '@td/theme/spacing';

import type { TNotificationType } from './notification.types';

const getNotificationBackgroundColor = (type: TNotificationType): string => {
	switch (type) {
		case 'Success':
			return FeedbackColors.Success;
		case 'Error':
			return FeedbackColors.Error;
		case 'Warning':
			return FeedbackColors.Warning;
		case 'Info':
			return FeedbackColors.Info;
	}
};

export const StyledNotificationWrapper = styled.View({
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	zIndex: 999999,
	justifyContent: 'flex-start',
	paddingHorizontal: Spacing.Small,
	paddingTop: Platform.select({ ios: 56, android: Spacing.Small }) as number,
});

export const StyledNotificationCard = styled(Animated.View)<{
	type: TNotificationType;
}>(({ type }) => ({
	backgroundColor: getNotificationBackgroundColor(type),
	borderRadius: Radius.Large,
	paddingVertical: Spacing.Small,
	paddingHorizontal: Spacing.Small,
	shadowColor: NeutralColors.Black,
	shadowOffset: '0px 6px',
	shadowOpacity: '0.15',
	shadowRadius: '12px',
	elevation: '8',
}));

export const StyledNotificationRow = styled.View({
	flexDirection: 'row',
	alignItems: 'center',
});

export const StyledNotificationTextContainer = styled.View({
	flex: 1,
});

export const StyledNotificationCloseButton = styled.Text({
	fontSize: 22,
	marginLeft: Spacing.XSmall,
	paddingHorizontal: 6,
	paddingVertical: 2,
	color: NeutralColors.White,
});
