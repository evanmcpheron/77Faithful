import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';

import { Text } from 'tamagui';

interface IAccountTextLinkProps {
  href: Href;
  children: ReactNode;
  disabled?: boolean;
}

export const AccountTextLink = ({ href, children, disabled = false }: IAccountTextLinkProps) => {
  const linkText = (
    <Text
      color="$accent"
      fontWeight="700"
      textDecorationLine="underline"
      opacity={disabled ? 0.5 : 1}
      accessibilityState={{ disabled }}
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
