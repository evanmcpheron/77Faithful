import { HeaderTopRow } from '@td/components/ui/main-header/components/header-top-row/header-top-row.component';
import { FormationStructure } from '@td/types/formation/formation-course.types';
import { Stack, useRouter } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

const AppLayout = () => {
	const router = useRouter();
	return (
		<Stack
			initialRouteName='(tabs)'
			screenOptions={{ headerShown: false }}
		>
			<Stack.Screen name='(tabs)' />
			{[
				'scripture',
				'prayer',
				'reflection',
				'practices/[practiceId]',
			].map((practice) => (
				<Stack.Screen
					key={practice}
					name={`journeys/[journeyId]/days/[dayNumber]/${practice}`}
					options={({ route }) => {
						const dayNumber =
							route.params && 'dayNumber' in route.params
								? route.params.dayNumber
								: null;
						return {
							headerShown: true,
							headerTransparent: true,
							headerShadowVisible: false,
							header: () => (
								<HeaderTopRow
									canGoBack
									showNotifications={false}
									onBackPress={() => {
										if (router.canGoBack()) {
											router.back();
											return;
										}
										const fromReflections =
											practice === 'reflection' &&
											route.params &&
											'returnTo' in route.params &&
											route.params.returnTo ===
												'reflections';
										router.replace(
											fromReflections
												? '/reflections'
												: '/today',
										);
									}}
									{...(typeof dayNumber === 'string' && {
										progress: {
											value: Number(dayNumber),
											max: FormationStructure.DayCount,
										},
									})}
									title={
										typeof dayNumber === 'string'
											? `${dayNumber} of ${FormationStructure.DayCount}`
											: practice === 'prayer'
												? 'Pray'
												: practice === 'reflection'
													? 'Reflect'
													: practice === 'scripture'
														? 'Scripture'
														: 'Chosen Practice'
									}
								/>
							),
						};
					}}
				/>
			))}
		</Stack>
	);
};

export default AppLayout;
