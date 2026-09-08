export type ParticipantStage =
  { status: 'incomplete' } | { status: 'complete' } | { status: 'loading' } | { status: 'error' };

export function getParticipantStage(): ParticipantStage {
  // No application Data exists yet. A Cognito account cannot establish completed onboarding.
  return { status: 'incomplete' };
}

export function postAuthDestination(stage: ParticipantStage) {
  switch (stage.status) {
    case 'incomplete':
      return '/onboarding';
    case 'complete':
      return '/today';
    case 'loading':
    case 'error':
      return null;
  }
}
