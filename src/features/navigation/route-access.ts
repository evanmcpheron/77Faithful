interface IRouteAccess {
  routeName: string;
  isSignedIn: boolean;
  isEmailVerified: boolean;
  hasJourney: boolean;
}

export const isAccountRoute = (routeName: string): boolean => {
  return [
    'index',
    'sign-in',
    'register',
    'recover-access',
    'confirm-email',
    'onboarding',
    '(app)',
  ].includes(routeName);
};

export const getRouteRedirect = ({
  routeName,
  isSignedIn,
  isEmailVerified,
  hasJourney,
}: IRouteAccess): '/' | '/confirm-email' | '/onboarding' | '/today' | null => {
  if (!isAccountRoute(routeName)) return null;

  if (!isSignedIn) {
    return routeName === 'onboarding' || routeName === '(app)' ? '/' : null;
  }

  if (!isEmailVerified) {
    return routeName === 'confirm-email' ? null : '/confirm-email';
  }

  if (hasJourney) {
    return routeName === '(app)' ? null : '/today';
  }

  return routeName === 'onboarding' ? null : '/onboarding';
};
