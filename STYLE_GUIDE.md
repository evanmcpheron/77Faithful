# 77Faithful Code Style Guide

## Goal

Write TypeScript and React Native code that is easy to understand, safe to
modify, and unsurprising to another engineer or coding agent.

Clarity is more important than cleverness. The codebase should look
intentionally maintained rather than generated from a collection of unrelated
patterns.

## Core philosophy

Prefer:

- explicit behavior over hidden behavior;
- descriptive names over short names;
- strong types over assertions;
- small focused functions over long procedures;
- small focused components over all-purpose screens;
- composition over inheritance;
- straightforward control flow over abstraction for its own sake;
- existing project patterns over a new pattern introduced for one task;
- a small amount of duplication over a premature abstraction;
- a shared abstraction once repetition has a stable meaning.

Do not optimize for the fewest lines of code.

## Naming

Use names that explain intent.

### Variables and functions

Use `camelCase`.

Good:

```ts
const selectedPracticeIds = [];
const calculateJourneyDayNumber = () => {};
const hasConfirmedEmail = true;
```

Avoid names such as:

```ts
const x = [];
const d = 12;
const doThing = () => {};
```

Short names are acceptable only when the abbreviation is universally understood
in context.

### Components, classes, and types

Use `PascalCase`.

```ts
interface IJourneyDayProps {}
type TJourneyStatus = 'active' | 'completed' | 'endedEarly';
class JourneyRepository {}
```

### Constants

Use descriptive immutable names. Use `SCREAMING_SNAKE_CASE` for true
module-level constants when that improves recognition.

```ts
const JOURNEY_DAY_COUNT = 77;
```

Do not use constant-style names for ordinary local values.

## Types and interfaces

### Prefer precise domain types

Do not use `string` when a narrow union or branded domain value materially
improves correctness.

```ts
type TJourneyStatus = 'active' | 'completed' | 'endedEarly';
type TPracticeId =
	'readScripture' | 'pray' | 'reflect' | 'movement' | 'serveOrEncourage';
```

Do not invent a narrow type that provides no practical safety.

### Interface and type naming

For project domain contracts, use the established `I` / `T` convention
consistently:

```ts
interface IJourneyDocument {}
type TCalendarDate = string;
```

Do not mix conventions within the same domain.

### Avoid `any`

Use `unknown` at untrusted boundaries and narrow it.

```ts
const parsePayload = (payload: unknown): IStartJourneyRequest => {
	// validate and return
};
```

Use `any` only when an external library genuinely makes a safer type
impractical, and isolate it.

### Avoid casual assertions

An assertion should not be used to silence a compiler error caused by missing
validation.

Bad:

```ts
const request = payload as IStartJourneyRequest;
```

Prefer runtime validation at external boundaries.

### Use `as const` deliberately

Use immutable literal collections when they define a stable domain catalog.

```ts
const FOUNDATIONAL_PRACTICE_IDS = ['readScripture', 'pray', 'reflect'] as const;
```

## Functions

Prefer arrow functions for module functions and callbacks unless a declaration
meaningfully improves the file.

Keep functions focused. A function should have one coherent reason to change.

Prefer early returns when they make invalid states obvious:

```ts
const getDayAccess = (dayNumber: number, reachedDayNumber: number) => {
	if (dayNumber < 1 || dayNumber > 77) {
		return 'invalid';
	}

	if (dayNumber > reachedDayNumber) {
		return 'future';
	}

	return 'available';
};
```

Do not compress meaningful branches into nested ternaries.

### Parameters

Prefer a single object parameter when a function has several related arguments
or when positional meaning is not obvious.

```ts
interface ICreateJourneyDateRangeInput {
	startDate: TCalendarDate;
	timeZoneId: TIanaTimeZoneId;
}

const createJourneyDateRange = ({
	startDate,
	timeZoneId,
}: ICreateJourneyDateRangeInput) => {};
```

Avoid parameter objects for trivial two-argument utilities when positional
meaning is already clear.

## React and React Native

Use functional components and hooks.

Keep route modules thin. A route should usually resolve route-specific
parameters and compose a feature screen rather than contain substantial domain
behavior.

Keep domain calculations outside presentation components.

Prefer:

```tsx
const TodayScreen = () => {
	const journeyDay = useJourneyDay();

	return <TodayView journeyDay={journeyDay} />;
};
```

over a screen that combines navigation, Firestore access, date calculations,
business rules, and rendering in one file.

### Component responsibilities

A component should primarily own one of:

- presentation;
- local interaction state;
- a focused workflow;
- orchestration of a small number of child components.

If a component becomes difficult to name without `And`, review its
responsibilities.

### Props

Define explicit props types. Pass the narrowest data required.

Do not pass entire account, journey, or Firestore documents into a leaf
component that needs two fields.

### Hooks

Hooks should expose behavior or state with a clear domain meaning.

Avoid hooks that hide large amounts of mutation and navigation behind vague
names.

Good:

```ts
useJourneyDay();
useStartJourney();
useAccountAccessState();
```

Avoid:

```ts
useEverything();
useAppStuff();
```

## Services and repositories

Use a class only when state, lifecycle, substitution, or dependency injection
makes it useful. Do not create classes as static utility containers.

Keep Firebase SDK concerns behind focused adapters or repositories where doing
so prevents SDK-specific types from spreading through the application.

A service may coordinate a workflow; it should not become a global dumping
ground.

## Async code

Use `async` / `await` for sequential asynchronous workflows.

Handle expected errors at the layer that can make a useful decision.

Do not catch an error merely to log it and rethrow it unless the added context
is materially useful.

Bad:

```ts
try {
	return await saveReflection();
} catch (error) {
	console.error(error);
	throw error;
}
```

Prefer either letting the error propagate or converting it to a meaningful
domain result.

## Error handling

Differentiate:

- validation errors;
- authentication/authorization errors;
- unavailable network;
- conflict/concurrency errors;
- not-found states;
- unexpected server errors.

Do not show raw Firebase error strings to participants.

Participant-facing errors must follow the voice guide and should explain the
next useful action when one exists.

## State and data flow

Prefer the smallest owner of state.

Do not duplicate the same server-backed value in several state containers unless
each copy has a clear lifecycle and reconciliation rule.

Derived values should normally be calculated rather than persisted.

Examples of values that should usually be derived:

- current journey day number;
- completed-practice count;
- complete-day status;
- week number;
- current streak;
- Day 77 date.

Persist a derived value only when there is a clear performance, audit, or query
requirement and a defined source of truth.

## Object handling

Prefer explicit object construction at trust boundaries.

Avoid spreading large untrusted or persistent objects into outward-facing DTOs:

```ts
return {
	journeyId,
	dayNumber,
	status,
};
```

instead of:

```ts
return {
	...firestoreDocument,
};
```

This reduces accidental data exposure and contract drift.

## Files and modules

Organize by domain and responsibility rather than by arbitrary file size.

A practical target structure may include:

```text
src/
  app/
  components/
  features/
  lib/
  providers/
  types/
```

This is an intended organization, not proof that those directories exist.

Keep shared components genuinely shared. Keep feature-specific components near
the feature until their reuse is established.

Avoid generic `utils.ts` files containing unrelated functions. Name utility
modules after the concept they own.

## Comments

Comments should explain intent, constraints, or non-obvious tradeoffs.

Good:

```ts
// A day is calendar-based. Do not calculate this as elapsed 24-hour blocks.
```

Avoid comments that restate syntax:

```ts
// Increment the count
count += 1;
```

Remove comments that no longer match the code.

## Reuse and abstraction

Create an abstraction when repeated code represents the same concept and is
likely to change together.

Do not create a component factory, generic repository base class, registry, or
configuration-driven mini-framework for a single use case.

When two implementations are similar but have different domain rules,
duplication can be safer than forcing them behind a false shared abstraction.

## Testing

Tests should protect product behavior, not merely execute lines.

Prioritize:

- permanent product invariants;
- date and time-zone rules;
- route access;
- authentication and authorization;
- concurrency/idempotency;
- writing conflict protection;
- Firestore Security Rules;
- destructive actions;
- offline reconciliation behavior;
- accessibility-critical state where practical.

Use descriptive test names:

```ts
it('does not create a second active journey for a repeated start request', ...)
```

Avoid vague names such as `works` or `handles case`.

## Generated-code warning signs

Review code that contains:

- unnecessary commentary on obvious syntax;
- multiple abstraction layers introduced together without a concrete need;
- generic names such as `Manager`, `Processor`, or `Handler` with broad
  responsibilities;
- repeated type assertions;
- defensive branches for impossible states without a documented reason;
- several helper functions used only once where direct code is clearer;
- inconsistent naming between adjacent files;
- UI components with arbitrary one-off styling instead of shared tokens.

## Completion checklist

Before considering a code change ready:

- behavior matches the owning product document;
- names describe intent;
- domain rules are not duplicated unnecessarily;
- new persistent data has an explicit contract;
- external inputs are validated;
- private fields are not leaked;
- expected error states are handled;
- UI text follows the voice guide;
- UI follows the visual guide;
- formatter, linter, type checks, and relevant tests have been run when
  configured;
- the work report distinguishes local code from deployed behavior.
