import { CommunitySafetyReviewDetailScreen } from '@td/features/communities/screens/community-safety-review-detail.screen';
import { useLocalSearchParams } from 'expo-router';

export default function SafetyReportDetailRoute() {
	const { reportId } = useLocalSearchParams<{ reportId?: string }>();
	return (
		<CommunitySafetyReviewDetailScreen
			reportId={typeof reportId === 'string' ? reportId : null}
		/>
	);
}
