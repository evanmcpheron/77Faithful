import { TodayScreen } from '@77/features/journey/today-screen.component';
import { useAuth } from '@77/providers/auth-provider';

const TodayRoute = () => {
  const { user } = useAuth();
  return user ? <TodayScreen key={user.uid} userId={user.uid} /> : null;
};

export default TodayRoute;
