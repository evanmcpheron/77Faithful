import { Link, type LinkProps } from 'expo-router';
import type { ReactNode } from 'react';

import { ScreenHeading } from './screen-heading';
import { ScreenScrollView } from './screen-scroll-view';
import { ScreenSection } from './screen-section';
import { ThemedText } from './themed-text';
import { TextLink } from './text-link';

type NavigationPlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  headerless?: boolean;
  bottomInsetHandled?: boolean;
};

export function NavigationPlaceholder({
  title,
  description,
  children,
  headerless = false,
  bottomInsetHandled = false,
}: NavigationPlaceholderProps) {
  return (
    <ScreenScrollView headerless={headerless} bottomInsetHandled={bottomInsetHandled}>
      <ScreenSection>
        <ScreenHeading title={title} description="Navigation scaffold" />
        <ThemedText>{description}</ThemedText>
        {children}
      </ScreenSection>
    </ScreenScrollView>
  );
}

type PlaceholderLinkProps = Pick<LinkProps, 'href' | 'push' | 'replace' | 'dismissTo'> & {
  children: string;
};

export function PlaceholderLink({ children, ...props }: PlaceholderLinkProps) {
  return (
    <Link {...props} asChild>
      <TextLink>{children}</TextLink>
    </Link>
  );
}
