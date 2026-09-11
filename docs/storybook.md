# Storybook

Storybook is configured as a separate Expo entry path so it can run on a
physical iOS or Android device through Expo Go without mounting the normal app
routes or auth provider.

## Run on your phone

```bash
npm install
npm run storybook
```

Then scan the Expo QR code with your phone.

Platform-specific commands are also available:

```bash
npm run storybook:ios
npm run storybook:android
```

## Fix a stale React install

Expo SDK 54 expects React 19.1.0 with React Native 0.81. The React packages are
pinned exactly in `package.json` so a fresh install does not drift to a newer
React release.

If Metro reports a React version mismatch, reset the local install:

```bash
rm -rf node_modules package-lock.json
npm install
npm run storybook
```

## Add a UI component story

Place stories next to reusable UI components:

```txt
src/components/ui/button/button.stories.tsx
```

The Storybook config loads stories from:

```txt
src/components/ui/**/*.stories.?(ts|tsx)
src/features/properties/components/**/*.stories.?(ts|tsx)
```

Use `args` and `argTypes` for props that should be editable on-device. This
keeps the story useful for testing spacing, variants, labels, and disabled
states without changing production screens.

## Generate stories manually

Metro generates Storybook imports when Storybook is enabled. If needed, run the
generator directly:

```bash
npm run storybook:generate
```
