import { Link } from 'expo-router';

import { TurndownScrollScreen } from '@td/components/layout/screen/screen.component';
import { Card } from '@td/components/ui/card/card.component';
import { Spacer } from '@td/components/ui/spacer/spacer.component';
import { Typography } from '@td/components/ui/typography/typography.component';
import { SurfaceColors } from '@td/theme/colors';
import { Spacing } from '@td/theme/spacing';
import { BibleVersion } from '@td/types/formation/bible-version.types';
import acknowledgments from '../scripture-acknowledgments.json';

export const ScriptureAcknowledgmentsScreen = () => (
	<TurndownScrollScreen
		backgroundColor={SurfaceColors.Screen}
		keyboardEnabled={false}
	>
		<Typography size='H1'>Scripture Acknowledgments</Typography>
		<Spacer size={Spacing.Medium} />
		{acknowledgments.map(({ bibleVersionId, copyright }) => {
			const translation = Object.values(BibleVersion).find(
				(version) => version.bibleVersionId === bibleVersionId,
			);
			return (
				<Card key={bibleVersionId}>
					<Typography size='H2'>
						{translation?.name} ({translation?.abbreviation})
					</Typography>
					<Typography weight='Regular'>{copyright}</Typography>
				</Card>
			);
		})}
		<Spacer size={Spacing.Medium} />
		<Link href='https://api.bible'>
			<Typography>Scripture provided by API.Bible</Typography>
		</Link>
	</TurndownScrollScreen>
);
