import { ScreenHeading } from './screen-heading';

export type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return <ScreenHeading level="section" title={title} description={description} />;
}
