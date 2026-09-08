import { useCallback, useLayoutEffect, useRef, type Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type Props = TextInputProps & { ref?: Ref<TextInput> };

function fitContent(node: unknown) {
  if (!(node instanceof HTMLTextAreaElement)) return;
  // Clear the previous height so deleting text can shrink the editor as well as grow it.
  node.style.height = 'auto';
  const border = node.offsetHeight - node.clientHeight;
  node.style.height = `${node.scrollHeight + border}px`;
}

export function FormTextInput({
  ref,
  multiline,
  scrollEnabled,
  onChange,
  onLayout,
  ...props
}: Props) {
  const input = useRef<TextInput | null>(null);
  const grows = multiline && scrollEnabled === false;
  // A stable ref avoids detaching the caller's ref on every keystroke.
  const setRef = useCallback(
    (node: TextInput | null) => {
      input.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  useLayoutEffect(() => {
    if (grows) fitContent(input.current);
  });

  return (
    <TextInput
      {...props}
      ref={setRef}
      multiline={multiline}
      scrollEnabled={scrollEnabled}
      onChange={(event) => {
        if (grows) fitContent(input.current);
        onChange?.(event);
      }}
      onLayout={(event) => {
        if (grows) fitContent(input.current);
        onLayout?.(event);
      }}
    />
  );
}
