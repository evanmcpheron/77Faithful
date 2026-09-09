import { useState } from 'react';
import { Button, Separator, XStack, YStack } from 'tamagui';

import { SeventySevenText } from '@77/components/core';
import type { ITranslatedScripturePassage } from '@77/types/formation/scripture.types';

import { FormationHeading, formationSerif } from './formation-ui.component';
import type { IJourneyDaySession } from './journey-day-session.types';

const ScripturePassage = ({
  passage,
  fontSize,
}: {
  passage: ITranslatedScripturePassage;
  fontSize: number;
}) => (
  <YStack gap={24}>
    <FormationHeading fontSize={26}>{passage.displayReference}</FormationHeading>
    {passage.versificationNote ? (
      <SeventySevenText color="$textSecondary">{passage.versificationNote}</SeventySevenText>
    ) : null}
    {passage.paragraphs.map((paragraph, paragraphIndex) => (
      <SeventySevenText
        key={paragraphIndex}
        selectable
        fontFamily={formationSerif}
        fontSize={fontSize}
        lineHeight={fontSize * 1.75}
      >
        {paragraph.runs.map((run, runIndex) => (
          <SeventySevenText
            key={runIndex}
            fontFamily={formationSerif}
            fontSize={fontSize}
            lineHeight={fontSize * 1.75}
          >
            {run.verseLabel ? (
              <SeventySevenText fontSize={12} color="$textSecondary">
                {run.verseLabel}
                {'  '}
              </SeventySevenText>
            ) : null}
            {run.text}
            {runIndex < paragraph.runs.length - 1 ? ' ' : ''}
          </SeventySevenText>
        ))}
      </SeventySevenText>
    ))}
  </YStack>
);

export const ScriptureReading = ({ session }: { session: IJourneyDaySession }) => {
  const [fontSize, setFontSize] = useState(21);
  return (
    <YStack gap={28}>
      <XStack items="center" justify="space-between" gap={12} flexWrap="wrap">
        <YStack flex={1} minW={160} gap={4}>
          <SeventySevenText bold>{session.translation.name}</SeventySevenText>
          <SeventySevenText color="$textSecondary" fontSize={14}>
            {session.translation.abbreviation}
          </SeventySevenText>
        </YStack>
        <XStack gap={8}>
          <Button
            minW={44}
            minH={44}
            accessibilityLabel="Decrease Scripture text size"
            disabled={fontSize <= 18}
            onPress={() => setFontSize((size) => size - 2)}
          >
            A−
          </Button>
          <Button
            minW={44}
            minH={44}
            accessibilityLabel="Increase Scripture text size"
            disabled={fontSize >= 31}
            onPress={() => setFontSize((size) => size + 2)}
          >
            A+
          </Button>
        </XStack>
      </XStack>
      {session.scripture ? (
        <>
          <ScripturePassage passage={session.scripture.primaryPassage} fontSize={fontSize} />
          {session.scripture.supportingPassage ? (
            <ScripturePassage passage={session.scripture.supportingPassage} fontSize={fontSize} />
          ) : null}
          {session.acknowledgments.map((acknowledgment) => (
            <SeventySevenText
              key={acknowledgment}
              color="$textSecondary"
              fontSize={12}
              lineHeight={19}
            >
              {acknowledgment}
            </SeventySevenText>
          ))}
        </>
      ) : (
        <SeventySevenText role="alert">{session.scriptureAvailabilityMessage}</SeventySevenText>
      )}
      <Separator borderColor="$borderColor" />
      <YStack gap={12}>
        <SeventySevenText color="$textSecondary" fontSize={12} letterSpacing={1.5}>
          TODAY’S DEVOTIONAL
        </SeventySevenText>
        <FormationHeading>{session.content.title}</FormationHeading>
        <SeventySevenText fontSize={17} lineHeight={28}>
          {session.content.devotional}
        </SeventySevenText>
      </YStack>
    </YStack>
  );
};
