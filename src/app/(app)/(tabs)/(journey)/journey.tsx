import { JourneyScreen } from '@77/features/journey/journey-screen.component';
import { useAuth } from '@77/providers/auth-provider';

const JourneyRoute = () => {
  const { user } = useAuth();
  return user ? <JourneyScreen key={user.uid} userId={user.uid} /> : null;
};

export default JourneyRoute;
