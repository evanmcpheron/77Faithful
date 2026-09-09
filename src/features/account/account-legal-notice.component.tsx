import { SeventySevenText } from '@77/components/core';

import { AccountTextLink } from './account-text-link.component';

interface IAccountLegalNoticeProps {
  action: 'creating an account' | 'signing in';
  disabled?: boolean;
}

export const AccountLegalNotice = ({ action, disabled = false }: IAccountLegalNoticeProps) => (
  <SeventySevenText color="$textSecondary" fontSize="$3" alignment="Center">
    By {action}, you agree to our{' '}
    <AccountTextLink href="/privacy" disabled={disabled}>
      privacy policy
    </AccountTextLink>{' '}
    and{' '}
    <AccountTextLink href="/terms" disabled={disabled}>
      terms of agreement
    </AccountTextLink>
    .
  </SeventySevenText>
);
