import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import { Button, Checkbox, useTheme, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';
import type { TPracticeId } from '@77/types/formation/practice.types';

import type { IDailyPracticeSummary } from './daily-practices';
import { FormationHeading } from './formation-ui.component';

const practiceSymbols: Record<TPracticeId, SymbolViewProps['name']> = {
  ReadScripture: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  Pray: { ios: 'hands.sparkles', android: 'self_improvement', web: 'self_improvement' },
  Reflect: { ios: 'doc.text', android: 'description', web: 'description' },
  Movement: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  ServeOrEncourage: { ios: 'person.2', android: 'group', web: 'group' },
  ScriptureMemorization: { ios: 'text.book.closed', android: 'auto_stories', web: 'auto_stories' },
  Gratitude: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  ChristianReading: { ios: 'books.vertical', android: 'library_books', web: 'library_books' },
  Worship: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  Generosity: { ios: 'gift', android: 'redeem', web: 'redeem' },
  FamilyOrHouseholdDevotion: { ios: 'house', android: 'home', web: 'home' },
  IntentionalDiscipline: { ios: 'leaf', android: 'eco', web: 'eco' },
  IntentionalWitness: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
};

export const PracticeIcon = ({ practiceId }: { practiceId: TPracticeId }) => {
  const background =
    practiceId === 'Pray'
      ? '#EAD8B6'
      : practiceId === 'Reflect'
        ? '#D5DEE1'
        : practiceId === 'Movement'
          ? '#E9D5D0'
          : '#DCE5DD';
  const foreground =
    practiceId === 'Pray' ? '#755824' : practiceId === 'Movement' ? '#7D483D' : '#294F42';
  return (
    <YStack
      width={48}
      height={48}
      rounded={24}
      bg={background}
      items="center"
      justify="center"
      shrink={0}
      aria-hidden
    >
      <SymbolView name={practiceSymbols[practiceId]} tintColor={foreground} size={25} />
    </YStack>
  );
};

interface IDailyPracticeRowProps {
  practice: IDailyPracticeSummary;
  isComplete: boolean;
  isSaving: boolean;
  onOpen: (practiceId: TPracticeId) => void;
  onComplete: (practiceId: TPracticeId, isComplete: boolean) => void;
}

export const DailyPracticeRow = ({
  practice,
  isComplete,
  isSaving,
  onOpen,
  onComplete,
}: IDailyPracticeRowProps) => {
  const theme = useTheme();
  const handleOpen = () => onOpen(practice.practiceId);
  const handleComplete = (checked: boolean | 'indeterminate') =>
    onComplete(practice.practiceId, checked === true);
  return (
    <XStack
      gap={4}
      items="center"
      borderWidth={1}
      borderColor={isComplete ? '$accentSoft' : '$borderColor'}
      rounded={18}
      bg={isComplete ? '$surfaceElevated' : '$surface'}
      pr={8}
      minH={100}
    >
      <Button
        unstyled
        flex={1}
        minW={0}
        p={12}
        cursor="pointer"
        onPress={handleOpen}
        disabled={isSaving}
        accessibilityLabel={`Open ${practice.name}`}
        pressStyle={{ opacity: 0.7 }}
        focusStyle={{ outlineColor: '$primary', outlineWidth: 2 }}
      >
        <XStack gap={14} items="center" flex={1}>
          <PracticeIcon practiceId={practice.practiceId} />
          <YStack flex={1} minW={0} gap={4}>
            <FormationHeading fontSize={21} lineHeight={27}>
              {practice.name}
            </FormationHeading>
            <SeventySevenText
              color="$textSecondary"
              fontSize={14}
              lineHeight={20}
              numberOfLines={2}
            >
              {practice.description}
            </SeventySevenText>
          </YStack>
        </XStack>
      </Button>
      <Checkbox
        width={44}
        height={44}
        rounded={13}
        checked={isComplete}
        disabled={isSaving}
        onCheckedChange={handleComplete}
        accessibilityLabel={
          isComplete ? `Mark ${practice.name} incomplete` : `Mark ${practice.name} complete`
        }
        bg={isComplete ? '$primary' : '$surface'}
        borderColor={isComplete ? '$primary' : '$textSecondary'}
        borderWidth={1.5}
      >
        <Checkbox.Indicator>
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={22}
            tintColor={theme.onPrimary.val}
          />
        </Checkbox.Indicator>
      </Checkbox>
    </XStack>
  );
};
