const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const flush = () => new Promise(setImmediate);
const storageKey = '77faithful.reflectionDraft.owner.journey.1';
const draft = (text, baseRevisionId = null) => ({
  userId: 'owner',
  target: { kind: 'DailyReflection', journeyId: 'journey', dayNumber: 1 },
  text,
  baseRevisionId,
});
const source = ts.transpileModule(
  readFileSync('src/features/journey/reflection-editor.component.tsx', 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  },
).outputText;

const createEditor = ({
  stored = new Map(),
  writing = null,
  save = async (text) => ({ text, revisionId: 'saved', updatedAt: { seconds: 1, nanoseconds: 0 } }),
  writeDraft = async () => {},
  userId = 'owner',
} = {}) => {
  const states = [];
  let stateIndex = 0;
  let hasEffect = false;
  const saves = [];
  const react = {
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] = typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = { current: initial };
      return states[index];
    },
    useEffect: (effect) => {
      if (!hasEffect) {
        hasEffect = true;
        effect();
      }
    },
  };
  const storage = {
    getItem: async (key) => stored.get(key) ?? null,
    setItem: async (key, value) => {
      await writeDraft();
      stored.set(key, value);
    },
    removeItem: async (key) => {
      stored.delete(key);
    },
  };
  const context = {
    exports: {},
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime')
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      if (name === '@react-native-async-storage/async-storage')
        return { __esModule: true, default: storage };
      if (name === 'tamagui') return { YStack: 'Stack', TextArea: 'Input' };
      if (name === '@77/components/core')
        return { SeventySevenButton: 'Button', SeventySevenText: 'Text' };
      if (name === '@77/features/account/device-id.service')
        return { getDeviceId: async () => 'device' };
      throw new Error(`Unexpected import ${name}`);
    },
  };
  vm.runInNewContext(source, context);
  const find = (tree, predicate) => {
    if (!tree || typeof tree !== 'object') return null;
    if (predicate(tree)) return tree.props;
    const children = Array.isArray(tree.props?.children)
      ? tree.props.children.flat()
      : [tree.props?.children];
    for (const child of children) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return null;
  };
  const render = () => {
    stateIndex = 0;
    const tree = context.exports.ReflectionEditor({
      userId,
      journeyId: 'journey',
      dayNumber: 1,
      writing,
      isSaving: false,
      onSave: async (text, revision) => {
        saves.push({ text, revision });
        return save(text, revision);
      },
    });
    return {
      input: find(tree, (node) => node.type === 'Input'),
      button: (label) =>
        find(tree, (node) => node.type === 'Button' && node.props.children === label),
    };
  };
  return { render, stored, saves };
};

test('writing remains a recoverable draft until an explicit successful account save', async () => {
  const editor = createEditor();
  editor.render();
  await flush();
  editor.render().input.onChangeText('My response');
  await flush();
  assert.equal(editor.saves.length, 0);
  assert.equal(JSON.parse(editor.stored.get(storageKey)).text, 'My response');
  await editor.render().button('Save reflection').onPress();
  assert.deepEqual(editor.saves, [{ text: 'My response', revision: null }]);
  assert.equal(editor.stored.has(storageKey), false);
});

test('a failed account save preserves both the text field and its stored draft', async () => {
  const editor = createEditor({ save: async () => null });
  editor.render();
  await flush();
  editor.render().input.onChangeText('Keep this response');
  await flush();
  await editor.render().button('Save reflection').onPress();
  assert.equal(editor.render().input.value, 'Keep this response');
  assert.equal(JSON.parse(editor.stored.get(storageKey)).text, 'Keep this response');
});

test('a save waits for the latest device write and prevents competing edits and double submits', async () => {
  let releaseDraft;
  const gate = new Promise((resolve) => {
    releaseDraft = resolve;
  });
  const editor = createEditor({ writeDraft: () => gate });
  editor.render();
  await flush();
  editor.render().input.onChangeText('The complete draft');
  const submitted = editor.render().button('Save reflection').onPress();
  assert.equal(editor.render().input.disabled, true);
  editor.render().input.onChangeText('A competing edit');
  await editor.render().button('Save reflection').onPress();
  assert.equal(editor.saves.length, 0);
  releaseDraft();
  await submitted;
  assert.deepEqual(editor.saves, [{ text: 'The complete draft', revision: null }]);
  assert.equal(editor.render().input.value, 'The complete draft');
  assert.equal(editor.stored.has(storageKey), false);
});

test('a restored conflicting draft requires a choice before replacing the saved version', async () => {
  const stored = new Map([[storageKey, JSON.stringify(draft('My earlier draft', 'earlier'))]]);
  const editor = createEditor({
    stored,
    writing: { text: 'From another device', revisionId: 'newer' },
  });
  editor.render();
  await flush();
  assert.equal(editor.render().input.value, 'My earlier draft');
  assert.equal(editor.render().button('Save reflection').disabled, true);
  editor.render().button('Keep my draft for the next save').onPress();
  await flush();
  await editor.render().button('Save reflection').onPress();
  assert.deepEqual(editor.saves, [{ text: 'My earlier draft', revision: 'newer' }]);
});

test('drafts stay scoped to their account and reject a mismatched journey target', async () => {
  const stored = new Map([[storageKey, JSON.stringify(draft('Private response'))]]);
  const other = createEditor({ stored, userId: 'other' });
  other.render();
  await flush();
  assert.equal(other.render().input.value, '');
  stored.set(
    storageKey,
    JSON.stringify({
      ...draft('Wrong journey'),
      target: { kind: 'DailyReflection', journeyId: 'different', dayNumber: 1 },
    }),
  );
  const mismatch = createEditor({ stored });
  mismatch.render();
  await flush();
  assert.equal(mismatch.render().input.value, '');
});
