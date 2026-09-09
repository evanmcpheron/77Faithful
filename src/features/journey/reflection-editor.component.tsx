import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { TextArea, YStack } from 'tamagui';

import { SeventySevenButton, SeventySevenText } from '@77/components/core';
import { getDeviceId } from '@77/features/account/device-id.service';
import type { ILocalWritingDraft } from '@77/types/journey/journey-local.types';
import type { IWritingHead } from '@77/types/journey/journey-writing.types';

interface IReflectionEditorProps {
  userId: string;
  journeyId: string;
  dayNumber: number;
  writing: IWritingHead | null;
  isSaving: boolean;
  isPreview?: boolean;
  onSave: (text: string, expectedRevisionId: string | null) => Promise<IWritingHead | null>;
}

export const ReflectionEditor = ({
  userId,
  journeyId,
  dayNumber,
  writing,
  isSaving,
  isPreview = false,
  onSave,
}: IReflectionEditorProps) => {
  const [text, setText] = useState(writing?.text ?? '');
  const [isReady, setIsReady] = useState(isPreview);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [hasDraftError, setHasDraftError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompetingWriting, setHasCompetingWriting] = useState(false);
  const loadedRevisionId = useRef(writing?.revisionId ?? null);
  const pendingSubmission = useRef(false);
  const baseRevisionId = useRef(writing?.revisionId ?? null);
  const draftQueue = useRef(Promise.resolve());
  const storageKey = `77faithful.reflectionDraft.${userId}.${journeyId}.${dayNumber}`;

  useEffect(() => {
    if (isPreview) return;
    let isCurrent = true;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!isCurrent || !stored) return;
        const draft: unknown = JSON.parse(stored);
        if (
          typeof draft !== 'object' ||
          draft === null ||
          !('userId' in draft) ||
          draft.userId !== userId ||
          !('text' in draft) ||
          typeof draft.text !== 'string' ||
          draft.text.length > 10000 ||
          !('baseRevisionId' in draft) ||
          (draft.baseRevisionId !== null && typeof draft.baseRevisionId !== 'string') ||
          !('target' in draft) ||
          typeof draft.target !== 'object' ||
          draft.target === null ||
          !('kind' in draft.target) ||
          draft.target.kind !== 'DailyReflection' ||
          !('journeyId' in draft.target) ||
          draft.target.journeyId !== journeyId ||
          !('dayNumber' in draft.target) ||
          draft.target.dayNumber !== dayNumber
        ) {
          throw new Error('The saved draft is invalid.');
        }
        setText(draft.text);
        baseRevisionId.current = draft.baseRevisionId;
        setHasCompetingWriting(draft.baseRevisionId !== loadedRevisionId.current);
        setDraftMessage('Your draft was restored from this device.');
      })
      .catch(() => {
        if (!isCurrent) return;
        setHasDraftError(true);
        setDraftMessage('We couldn’t restore your draft. Keep this page open while you write.');
      })
      .finally(() => {
        if (isCurrent) setIsReady(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [storageKey, userId, journeyId, dayNumber, isPreview]);

  const handleTextChange = (nextText: string) => {
    if (pendingSubmission.current) return;
    setText(nextText);
    setDraftMessage(null);
    if (isPreview) return;
    draftQueue.current = draftQueue.current
      .then(async () => {
        const draft: ILocalWritingDraft = {
          userId,
          deviceId: await getDeviceId(),
          target: { kind: 'DailyReflection', journeyId, dayNumber },
          baseRevisionId: baseRevisionId.current,
          text: nextText,
          draftSavedOnDeviceAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(draft));
        setHasDraftError(false);
        setDraftMessage('Draft saved on this device.');
      })
      .catch(() => {
        setHasDraftError(true);
        setDraftMessage(
          'We couldn’t save the draft on this device. Keep this page open and try Save reflection.',
        );
      });
  };

  const handleSave = async () => {
    if (pendingSubmission.current || hasCompetingWriting) return;
    pendingSubmission.current = true;
    setIsSubmitting(true);
    try {
      await draftQueue.current;
      const savedWriting = await onSave(text, baseRevisionId.current);
      if (!savedWriting) return;
      baseRevisionId.current = savedWriting.revisionId;
      setDraftMessage(
        isPreview ? 'Reflection saved for this preview.' : 'Reflection saved to your account.',
      );
      setHasDraftError(false);
      if (!isPreview) {
        try {
          await AsyncStorage.removeItem(storageKey);
        } catch {
          setDraftMessage(
            'Reflection saved to your account. The draft is also still on this device.',
          );
        }
      }
    } finally {
      pendingSubmission.current = false;
      setIsSubmitting(false);
    }
  };

  const handleKeepDraft = () => {
    baseRevisionId.current = writing?.revisionId ?? null;
    setHasCompetingWriting(false);
    handleTextChange(text);
  };

  const handleUseSavedWriting = () => {
    baseRevisionId.current = writing?.revisionId ?? null;
    setHasCompetingWriting(false);
    handleTextChange(writing?.text ?? '');
  };

  return (
    <YStack gap={12}>
      <SeventySevenText bold>
        Your reflection <SeventySevenText color="$textSecondary">(optional)</SeventySevenText>
      </SeventySevenText>
      <TextArea
        value={text}
        onChangeText={handleTextChange}
        disabled={!isReady || isSaving || isSubmitting}
        minH={190}
        maxLength={10000}
        placeholder="Write what’s on your heart…"
        accessibilityLabel="Your private reflection"
        fontSize={17}
        lineHeight={27}
        p={16}
        rounded={16}
        bg="$surface"
        borderColor="$borderColor"
        color="$color"
        textAlignVertical="top"
      />
      <SeventySevenText color="$textSecondary" fontSize={14}>
        Writing is optional. You can mark Reflect complete without saving a response.
      </SeventySevenText>
      {hasCompetingWriting ? (
        <YStack gap={12} p={16} bg="$surfaceElevated" rounded={16}>
          <SeventySevenText bold>Your saved reflection has changed.</SeventySevenText>
          <SeventySevenText>
            Your draft is above. The version saved to your account is:
          </SeventySevenText>
          <SeventySevenText>{writing?.text || 'No written response.'}</SeventySevenText>
          <SeventySevenButton appearance="Outlined" onPress={handleUseSavedWriting}>
            Use saved reflection
          </SeventySevenButton>
          <SeventySevenButton appearance="Outlined" onPress={handleKeepDraft}>
            Keep my draft for the next save
          </SeventySevenButton>
        </YStack>
      ) : null}
      {draftMessage ? (
        <SeventySevenText
          role={hasDraftError ? 'alert' : undefined}
          aria-live="polite"
          color="$textSecondary"
          fontSize={14}
        >
          {draftMessage}
        </SeventySevenText>
      ) : null}
      <SeventySevenButton
        appearance="Outlined"
        disabled={!isReady || isSaving || isSubmitting || hasCompetingWriting}
        onPress={handleSave}
      >
        Save reflection
      </SeventySevenButton>
    </YStack>
  );
};
