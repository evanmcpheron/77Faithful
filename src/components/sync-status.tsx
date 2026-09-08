import { FeedbackText } from './ui/feedback-text';

const statusLabels = {
  synced: 'Saved and synced',
  pending: 'Saved locally · Pending sync',
  'sync-failed': 'Failed to sync · Saved locally',
  'save-failed': 'Failed to save · Changes are not saved',
  offline: 'Offline',
} as const;

export type SyncStatusProps = {
  status: keyof typeof statusLabels;
  offline?: boolean;
};

export function SyncStatus({ status, offline = false }: SyncStatusProps) {
  const failed = status === 'sync-failed' || status === 'save-failed';
  const label = `${statusLabels[status]}${offline && status !== 'offline' ? ' · Offline' : ''}`;

  return (
    <FeedbackText error={failed} themeColor={failed ? 'error' : 'textSecondary'}>
      {label}
    </FeedbackText>
  );
}
