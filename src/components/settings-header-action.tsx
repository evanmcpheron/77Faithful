import { Link } from 'expo-router';
import { IconButton } from './icon-button';

export function SettingsHeaderAction() {
  return (
    <Link href="/settings" push asChild>
      <IconButton icon="settings" accessibilityLabel="Settings" accessibilityRole="link" />
    </Link>
  );
}
