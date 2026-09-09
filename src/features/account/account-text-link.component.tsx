import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

import { Text } from 'tamagui';

interface IAccountTextLinkProps {
  href: Href;
  children: ReactNode;
  disabled?: boolean;
}

export const AccountTextLink = ({ href, children, disabled = false }: IAccountTextLinkProps) => {
  const linkText = (
    <Text
      color="$link"
      fontFamily="$body"
      fontWeight="600"
      textDecorationLine="underline"
      opacity={disabled ? 0.5 : 1}
      aria-disabled={disabled}
      {...(Platform.OS !== 'web' ? { accessibilityState: { disabled } } : {})}
    >
      {children}
    </Text>
  );

  if (disabled) return linkText;

  return (
    <Link href={href} asChild>
      {linkText}
    </Link>
  );
};
