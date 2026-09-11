# 12. Testing guidelines

## Test meaningful behavior

Test:

- button press/disabled/loading
- checkbox controlled change
- dropdown open/select/close
- tabs selection
- screen empty/loading/error branches
- validation utilities
- job assignment modal switching
- checklist customization prompt actions

Avoid over-testing:

- static styled wrappers
- theme token objects
- route files that only export screens
- visual-only variants without behavior

## Recommended test locations

```txt
src/components/ui/button/button.test.tsx
src/components/form/dropdown/dropdown.test.tsx
src/features/jobs/components/job-assignment-modal.test.tsx
```

Add `.test.tsx` support deliberately when component testing setup is in scope.
