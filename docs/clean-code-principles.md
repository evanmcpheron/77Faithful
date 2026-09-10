# Clean Code Principles: A Practical Guide for Software Engineers

## Purpose of This Document

Clean code is code that is easy to read, easy to reason about, easy to change,
and difficult to misuse.

It is not about making code look clever. It is not about following rules for
their own sake. It is not about making everything abstract, generic, or
reusable. Clean code is about reducing the cost of understanding and safely
changing software over time.

A good developer can make code work. A better developer can make code work in a
way that another developer can maintain without fear.

This document explains the major principles of clean code, what they mean, why
they matter, and how to apply them in real projects.

---

# Table of Contents

1. [What Clean Code Means](#what-clean-code-means)
2. [The Core Goal: Reduce Cognitive Load](#the-core-goal-reduce-cognitive-load)
3. [Naming](#naming)
4. [Functions](#functions)
5. [Variables and State](#variables-and-state)
6. [Types and Interfaces](#types-and-interfaces)
7. [Objects, Classes, and Data Structures](#objects-classes-and-data-structures)
8. [Error Handling](#error-handling)
9. [Comments](#comments)
10. [Duplication and DRY](#duplication-and-dry)
11. [Abstraction](#abstraction)
12. [Separation of Concerns](#separation-of-concerns)
13. [Single Responsibility Principle](#single-responsibility-principle)
14. [Coupling and Cohesion](#coupling-and-cohesion)
15. [Composition Over Inheritance](#composition-over-inheritance)
16. [Immutability](#immutability)
17. [Side Effects](#side-effects)
18. [Control Flow](#control-flow)
19. [Data Validation](#data-validation)
20. [APIs and Boundaries](#apis-and-boundaries)
21. [Testing and Clean Code](#testing-and-clean-code)
22. [Clean Code in React](#clean-code-in-react)
23. [Clean Code in Node.js APIs](#clean-code-in-nodejs-apis)
24. [Clean Code in TypeScript](#clean-code-in-typescript)
25. [File and Folder Organization](#file-and-folder-organization)
26. [Performance and Clean Code](#performance-and-clean-code)
27. [Security and Clean Code](#security-and-clean-code)
28. [Code Reviews](#code-reviews)
29. [Refactoring](#refactoring)
30. [Common Clean Code Mistakes](#common-clean-code-mistakes)
31. [Clean Code Checklist](#clean-code-checklist)
32. [Final Guidance](#final-guidance)

---

# What Clean Code Means

Clean code is code that communicates clearly.

Code is read far more often than it is written. Every unclear name, hidden side
effect, unnecessary abstraction, or confusing function makes future work slower
and riskier.

Clean code should be:

- **Readable**: A developer should understand what the code does without
  excessive digging.
- **Predictable**: The code should behave the way its names and structure
  suggest.
- **Maintainable**: Changes should be localized and safe.
- **Testable**: Important behavior should be easy to verify.
- **Simple**: The solution should avoid unnecessary complexity.
- **Explicit**: Important assumptions should not be hidden.
- **Consistent**: Similar problems should be solved in similar ways.

Clean code does not mean perfect code. Perfect code does not exist. Clean code
means the code is good enough to safely support the product, the team, and
future change.

---

# The Core Goal: Reduce Cognitive Load

The most important idea behind clean code is reducing cognitive load.

Cognitive load is the amount of mental effort required to understand something.

Bad code forces developers to constantly ask questions:

- What does this variable mean?
- Can this value be null?
- Does this function mutate anything?
- Why is this condition here?
- Is this logic duplicated somewhere else?
- Can I safely change this?
- What happens if this request fails?
- Is this component responsible for too much?

Clean code answers these questions through structure, naming, typing, and clear
boundaries.

## Example of High Cognitive Load

```ts
function handle(data: any) {
	if (data && data.u && data.u.s === 1) {
		return data.u.n + ' active';
	}

	return 'inactive';
}
```

Problems:

- `handle` is vague.
- `data` is vague.
- `any` removes useful type information.
- `u`, `s`, and `n` are unclear.
- The meaning of `s === 1` is hidden.
- The return format is unclear.

## Cleaner Version

```ts
type UserStatus = 'Active' | 'Inactive';

interface User {
	name: string;
	status: UserStatus;
}

function formatUserStatus(user: User): string {
	if (user.status === 'Active') {
		return `${user.name} active`;
	}

	return 'inactive';
}
```

This version is not fancy. It is just easier to understand.

That is the point.

---

# Naming

Naming is one of the most important parts of clean code.

Good names reduce the need for comments. Bad names force the reader to
reverse-engineer your intent.

## Names Should Be Specific

Avoid vague names.

Bad:

```ts
const data = await getData();
const result = process(data);
```

Better:

```ts
const customerProfile = await getCustomerProfile(customerId);
const updatedSubscription = renewCustomerSubscription(customerProfile);
```

## Names Should Reveal Intent

A name should explain why something exists, not just what type it is.

Bad:

```ts
const list = users.filter((user) => user.active);
```

Better:

```ts
const activeUsers = users.filter((user) => user.active);
```

## Avoid Abbreviations Unless They Are Standard

Bad:

```ts
const usr = getUser();
const cfg = getConfig();
const addr = getAddress();
```

Better:

```ts
const user = getUser();
const configuration = getConfiguration();
const address = getAddress();
```

Acceptable standard abbreviations:

```ts
const id = user.id;
const url = request.url;
const html = renderPage();
const json = response.json();
```

## Boolean Names Should Read Like True or False Statements

Bad:

```ts
const loading = true;
const permission = false;
const errors = true;
```

Better:

```ts
const isLoading = true;
const hasPermission = false;
const hasErrors = true;
const canEditProfile = true;
const shouldRetryRequest = false;
```

## Function Names Should Describe Actions

Functions do things. Their names should usually start with verbs.

Good examples:

```ts
getUserById();
createInvoice();
validatePassword();
sendPasswordResetEmail();
calculateMonthlyRevenue();
formatPhoneNumber();
```

## Avoid Names That Lie

This is worse than a vague name.

Bad:

```ts
function getUser(id: string): User {
	return database.users.delete(id);
}
```

A function named `getUser` should not delete a user.

Names create expectations. Violating those expectations makes code dangerous.

## Avoid Encoding Implementation Details Into Names

Bad:

```ts
const userArray = getUsers();
const customerObject = getCustomer();
```

Better:

```ts
const users = getUsers();
const customer = getCustomer();
```

Only include the implementation detail if it matters to the domain or behavior.

## Use Domain Language

Use names that match the business domain.

If the business calls something a `LeaseApplication`, do not randomly call it a
`Form`, `Record`, or `Item` in code.

Consistent domain language makes the code easier to connect to product
requirements.

---

# Functions

Functions are the primary unit of behavior in most codebases.

A clean function should do one clear thing, have a meaningful name, accept
understandable inputs, and return predictable output.

## Functions Should Be Small Enough to Understand

There is no universal line limit, but a function should fit comfortably in your
head.

If a function does several things, split it.

Bad:

```ts
async function submitApplication(application: Application) {
	if (!application.customerId) {
		throw new Error('Missing customer');
	}

	if (!application.unitId) {
		throw new Error('Missing unit');
	}

	const customer = await database.customers.findById(application.customerId);
	const unit = await database.units.findById(application.unitId);

	if (!customer) {
		throw new Error('Customer not found');
	}

	if (!unit) {
		throw new Error('Unit not found');
	}

	const creditCheck = await creditService.run(customer);
	const backgroundCheck = await backgroundService.run(customer);

	const lease = await database.leases.create({
		customerId: customer.id,
		unitId: unit.id,
		creditStatus: creditCheck.status,
		backgroundStatus: backgroundCheck.status,
	});

	await emailService.sendLeaseCreatedEmail(customer.email, lease.id);

	return lease;
}
```

Better:

```ts
async function submitApplication(application: Application): Promise<Lease> {
	validateApplication(application);

	const customer = await findRequiredCustomer(application.customerId);
	const unit = await findRequiredUnit(application.unitId);
	const screeningResult = await runApplicantScreening(customer);
	const lease = await createLease(customer, unit, screeningResult);

	await notifyCustomerLeaseCreated(customer, lease);

	return lease;
}
```

The second version makes the workflow obvious.

Each helper can then handle its own details.

## A Function Should Have One Primary Responsibility

A function should not validate input, transform data, save to the database, send
notifications, update analytics, and format the response all at once.

That creates a function that is hard to test and dangerous to change.

## Avoid Hidden Side Effects

A side effect is when a function changes something outside itself.

Examples:

- Updating a database
- Mutating an object passed into the function
- Writing to a file
- Sending an email
- Logging
- Updating global state
- Calling an external API

Side effects are not always bad. They are necessary. But they should be obvious.

Bad:

```ts
function calculateTotal(order: Order): number {
	order.lastCalculatedAt = new Date();
	return order.items.reduce((total, item) => total + item.price, 0);
}
```

The name says it calculates a total, but it also mutates the order.

Better:

```ts
function calculateOrderTotal(order: Order): number {
	return order.items.reduce((total, item) => total + item.price, 0);
}

function markOrderTotalCalculated(order: Order): Order {
	return {
		...order,
		lastCalculatedAt: new Date(),
	};
}
```

## Prefer Fewer Parameters

Functions with too many parameters are hard to use correctly.

Bad:

```ts
createUser('Evan', 'McPheron', true, false, 'Admin', null, true);
```

Better:

```ts
createUser({
	firstName: 'Evan',
	lastName: 'McPheron',
	isActive: true,
	role: 'Admin',
	requiresPasswordReset: true,
});
```

Use an object parameter when:

- There are more than two or three parameters.
- Several parameters are optional.
- Boolean parameters are involved.
- The order of arguments is not obvious.

## Avoid Boolean Flag Parameters

Boolean flags often mean the function does more than one thing.

Bad:

```ts
function sendNotification(user: User, urgent: boolean) {
	if (urgent) {
		sendSms(user.phoneNumber);
	} else {
		sendEmail(user.email);
	}
}
```

Better:

```ts
function sendUrgentNotification(user: User) {
	sendSms(user.phoneNumber);
}

function sendStandardNotification(user: User) {
	sendEmail(user.email);
}
```

## Return Early to Reduce Nesting

Deep nesting makes code harder to read.

Bad:

```ts
function getDiscount(customer: Customer): number {
	if (customer.isActive) {
		if (customer.hasPaidInvoices) {
			if (customer.yearsActive > 3) {
				return 20;
			}

			return 10;
		}
	}

	return 0;
}
```

Better:

```ts
function getDiscount(customer: Customer): number {
	if (!customer.isActive) {
		return 0;
	}

	if (!customer.hasPaidInvoices) {
		return 0;
	}

	if (customer.yearsActive > 3) {
		return 20;
	}

	return 10;
}
```

## Do Not Mix Levels of Abstraction

A function should not combine high-level business workflow with low-level
implementation details.

Bad:

```ts
async function registerUser(input: RegisterUserInput) {
	if (!input.email.includes('@')) {
		throw new Error('Invalid email');
	}

	const passwordHash = await bcrypt.hash(input.password, 10);

	const user = await database.query(
		'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
		[input.email, passwordHash],
	);

	await sendgrid.send({
		to: input.email,
		from: 'support@example.com',
		subject: 'Welcome',
		text: 'Welcome to the app',
	});

	return user;
}
```

Better:

```ts
async function registerUser(input: RegisterUserInput): Promise<User> {
	validateRegisterUserInput(input);

	const passwordHash = await hashPassword(input.password);
	const user = await createUserAccount(input.email, passwordHash);

	await sendWelcomeEmail(user.email);

	return user;
}
```

The top-level function now reads like a business process.

---

# Variables and State

Variables should make code easier to understand. They should not create
confusion or hide behavior.

## Use Variables to Name Important Concepts

Bad:

```ts
if (user.age >= 18 && user.country === 'US' && !user.hasOpenFraudCase) {
	approveApplication(user);
}
```

Better:

```ts
const isEligibleAdultApplicant =
	user.age >= 18 && user.country === 'US' && !user.hasOpenFraudCase;

if (isEligibleAdultApplicant) {
	approveApplication(user);
}
```

The variable gives meaning to the condition.

## Keep Variable Scope Small

Declare variables close to where they are used.

Bad:

```ts
function processOrder(order: Order) {
	let discount = 0;

	validateOrder(order);
	sendOrderReceivedEvent(order);
	reserveInventory(order);

	discount = calculateDiscount(order);

	return applyDiscount(order, discount);
}
```

Better:

```ts
function processOrder(order: Order) {
	validateOrder(order);
	sendOrderReceivedEvent(order);
	reserveInventory(order);

	const discount = calculateDiscount(order);

	return applyDiscount(order, discount);
}
```

## Prefer `const` Over `let`

Use `const` by default. Use `let` only when reassignment is necessary.

Bad:

```ts
let total = calculateTotal(order);
return total;
```

Better:

```ts
const total = calculateTotal(order);
return total;
```

This communicates that the value should not change.

## Avoid Reusing Variables for Different Meanings

Bad:

```ts
let value = getUserInput();
value = value.trim();
value = parseInt(value, 10);
value = value + 1;
```

Better:

```ts
const rawInput = getUserInput();
const trimmedInput = rawInput.trim();
const parsedNumber = parseInt(trimmedInput, 10);
const incrementedNumber = parsedNumber + 1;
```

Each variable has one clear meaning.

## Avoid Global Mutable State

Global mutable state makes behavior harder to predict.

Bad:

```ts
let currentUser: User | null = null;

function setCurrentUser(user: User) {
	currentUser = user;
}

function canEditSettings() {
	return currentUser?.role === 'Admin';
}
```

Better:

```ts
function canEditSettings(user: User): boolean {
	return user.role === 'Admin';
}
```

Passing dependencies explicitly makes code easier to test and reason about.

---

# Types and Interfaces

Types are a major part of clean code in TypeScript.

Good types document the shape of data, prevent invalid states, and make code
easier to refactor.

## Avoid `any`

`any` removes the benefits of TypeScript.

Bad:

```ts
function createLease(input: any) {
	return leaseService.create(input);
}
```

Better:

```ts
interface CreateLeaseInput {
	applicantId: string;
	propertyId: string;
	unitId: string;
	startDate: string;
}

function createLease(input: CreateLeaseInput): Promise<Lease> {
	return leaseService.create(input);
}
```

Use `unknown` instead of `any` when the type is truly unknown.

```ts
function parseApiResponse(response: unknown): ApiResponse {
	return validateApiResponse(response);
}
```

## Make Invalid States Impossible When Practical

Bad:

```ts
interface Payment {
	status: 'Pending' | 'Paid' | 'Failed';
	paidAt?: Date;
	failureReason?: string;
}
```

This allows invalid combinations, such as a failed payment with `paidAt`.

Better:

```ts
type Payment =
	| {
			status: 'Pending';
	  }
	| {
			status: 'Paid';
			paidAt: Date;
	  }
	| {
			status: 'Failed';
			failureReason: string;
	  };
```

Now the type system helps enforce correctness.

## Prefer Specific Types Over Loose Strings

Bad:

```ts
function updateApplicationStatus(status: string) {
	// ...
}
```

Better:

```ts
type ApplicationStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

function updateApplicationStatus(status: ApplicationStatus) {
	// ...
}
```

## Separate Domain Types From API Types When Needed

External API data often differs from internal application data.

Do not blindly use API response types throughout the application.

Example:

```ts
interface ApplicantApiResponse {
	id: string;
	first_name: string;
	last_name: string;
	created_at: string;
}

interface Applicant {
	id: string;
	firstName: string;
	lastName: string;
	createdAt: Date;
}

function mapApplicantApiResponse(response: ApplicantApiResponse): Applicant {
	return {
		id: response.id,
		firstName: response.first_name,
		lastName: response.last_name,
		createdAt: new Date(response.created_at),
	};
}
```

This keeps external data shape from leaking everywhere.

## Do Not Overuse Generics

Generics are useful when they improve type safety without making the code harder
to understand.

Bad:

```ts
function process<TInput, TOutput, TContext, TOptions>(
	input: TInput,
	context: TContext,
	options: TOptions,
): TOutput {
	// ...
}
```

This is generic but not necessarily useful.

Better:

```ts
function mapArray<TInput, TOutput>(
	items: TInput[],
	mapItem: (item: TInput) => TOutput,
): TOutput[] {
	return items.map(mapItem);
}
```

The generic types have a clear reason to exist.

---

# Objects, Classes, and Data Structures

Objects and classes should model meaningful concepts and keep related data and
behavior together.

## Use Plain Objects for Simple Data

Not every concept needs a class.

Good:

```ts
interface Address {
	street: string;
	city: string;
	state: string;
	postalCode: string;
}
```

This does not need to be a class unless there is meaningful behavior attached to
it.

## Use Classes When They Encapsulate Behavior and Invariants

A class is useful when it protects rules around state.

Example:

```ts
class Money {
	private constructor(
		public readonly amountInCents: number,
		public readonly currency: string,
	) {}

	static create(amountInCents: number, currency: string): Money {
		if (amountInCents < 0) {
			throw new Error('Amount cannot be negative');
		}

		return new Money(amountInCents, currency);
	}

	add(other: Money): Money {
		if (this.currency !== other.currency) {
			throw new Error('Cannot add money with different currencies');
		}

		return Money.create(
			this.amountInCents + other.amountInCents,
			this.currency,
		);
	}
}
```

This class protects important business rules.

## Avoid Anemic Classes With No Behavior

Bad:

```ts
class User {
	id: string;
	email: string;
	role: string;
}
```

This is just a data shape. In TypeScript, an interface is usually better.

## Avoid God Objects

A God object knows too much and does too much.

Bad:

```ts
class ApplicationService {
	createUser() {}
	deleteUser() {}
	createLease() {}
	runCreditCheck() {}
	sendEmail() {}
	generateReport() {}
	processPayment() {}
}
```

Better:

```ts
class UserService {}
class LeaseService {}
class ScreeningService {}
class EmailService {}
class PaymentService {}
class ReportingService {}
```

Each service owns a narrower responsibility.

---

# Error Handling

Clean error handling makes failures understandable and recoverable.

Bad error handling creates confusing bugs and poor user experiences.

## Do Not Ignore Errors

Bad:

```ts
try {
	await saveUser(user);
} catch (error) {}
```

This hides failure.

Better:

```ts
try {
	await saveUser(user);
} catch (error) {
	logger.error('Failed to save user', { error, userId: user.id });
	throw error;
}
```

## Throw Errors With Useful Context

Bad:

```ts
throw new Error('Failed');
```

Better:

```ts
throw new Error(`Failed to create lease for applicant ${applicantId}`);
```

Do not include sensitive data in error messages.

## Use Domain-Specific Errors When Helpful

```ts
class ApplicantNotFoundError extends Error {
	constructor(applicantId: string) {
		super(`Applicant not found: ${applicantId}`);
		this.name = 'ApplicantNotFoundError';
	}
}
```

This makes errors easier to handle intentionally.

```ts
try {
	const applicant = await findApplicant(applicantId);
	return applicant;
} catch (error) {
	if (error instanceof ApplicantNotFoundError) {
		return null;
	}

	throw error;
}
```

## Do Not Use Exceptions for Normal Control Flow

Bad:

```ts
try {
	const user = findUserByEmail(email);
	return user;
} catch {
	return null;
}
```

Better:

```ts
function findUserByEmail(email: string): User | null {
	return users.find((user) => user.email === email) ?? null;
}
```

Exceptions should represent exceptional or failure conditions, not ordinary
branching.

## Handle Errors at the Correct Layer

Not every function should catch errors.

A lower-level function should often throw the error and let a higher-level layer
decide what to do.

Example:

```ts
async function getApplicantById(applicantId: string): Promise<Applicant> {
	const applicant = await applicantRepository.findById(applicantId);

	if (!applicant) {
		throw new ApplicantNotFoundError(applicantId);
	}

	return applicant;
}
```

Then an API route can translate that into an HTTP response.

```ts
app.get('/applicants/:id', async (request, response) => {
	try {
		const applicant = await getApplicantById(request.params.id);
		response.json(applicant);
	} catch (error) {
		if (error instanceof ApplicantNotFoundError) {
			response.status(404).json({ message: 'Applicant not found' });
			return;
		}

		throw error;
	}
});
```

---

# Comments

Comments should explain intent, tradeoffs, or non-obvious decisions.

Comments should not compensate for unclear code.

## Good Comments Explain Why

Good:

```ts
// The provider requires the applicant ID to be stable across retries.
// Do not regenerate it after a failed submission.
const applicantId = existingApplicantId ?? createApplicantId();
```

This explains a rule that may not be obvious.

## Bad Comments Repeat What the Code Already Says

Bad:

```ts
// Get the user by ID
const user = getUserById(userId);
```

The comment adds no value.

## Comments Can Document External Constraints

Good:

```ts
// Stripe expects amounts in cents, not dollars.
const amountInCents = dollarsToCents(paymentAmount);
```

## Comments Can Mark Intentional Workarounds

Good:

```ts
// React Native measures this view incorrectly on first render unless the height is explicit.
// Revisit this after upgrading React Native.
const containerHeight = screenHeight;
```

## Avoid Leaving Dead Comments

Bad:

```ts
// TODO: remove this temporary workaround
```

If a TODO is needed, make it actionable.

Better:

```ts
// TODO: Remove this fallback after API v2 is fully deployed.
```

Even better, include an issue or ticket reference if your team uses one.

---

# Duplication and DRY

DRY means “Don’t Repeat Yourself.”

It does not mean “never write similar-looking code twice.”

The real goal is to avoid duplicating knowledge.

## Duplicate Knowledge Is Dangerous

Bad:

```ts
const minimumPasswordLength = 8;

function validatePassword(password: string): boolean {
	return password.length >= 8;
}
```

The rule exists in two places.

Better:

```ts
const minimumPasswordLength = 8;

function validatePassword(password: string): boolean {
	return password.length >= minimumPasswordLength;
}
```

## Do Not Create Abstractions Too Early

Bad:

```ts
function renderThing(type: 'User' | 'Product' | 'Invoice', data: unknown) {
	// Giant generic rendering function
}
```

This kind of abstraction often becomes hard to maintain.

Sometimes this is better:

```ts
renderUserCard(user);
renderProductCard(product);
renderInvoiceCard(invoice);
```

Similar structure is not always harmful duplication.

## Prefer Duplication Over Bad Abstraction

Bad abstraction is worse than duplication because it spreads complexity
everywhere.

A good rule:

- Duplicate once if the pattern is not stable.
- Extract when the repeated code has the same reason to change.
- Do not extract just because two blocks look similar.

## Same Shape Does Not Mean Same Meaning

Example:

```ts
const applicantOptions = applicants.map((applicant) => ({
	label: applicant.fullName,
	value: applicant.id,
}));

const propertyOptions = properties.map((property) => ({
	label: property.name,
	value: property.id,
}));
```

These look similar, but they may not need an abstraction yet.

An abstraction is justified if this option-shaping pattern is common and stable.

```ts
function mapToSelectOptions<TItem>(
	items: TItem[],
	getLabel: (item: TItem) => string,
	getValue: (item: TItem) => string,
): SelectOption[] {
	return items.map((item) => ({
		label: getLabel(item),
		value: getValue(item),
	}));
}
```

This abstraction is reasonable if used often and consistently.

---

# Abstraction

Abstraction means hiding unnecessary details behind a simpler interface.

Good abstraction makes code easier to use. Bad abstraction makes code harder to
understand.

## A Good Abstraction Has a Clear Purpose

Good:

```ts
async function getCurrentUser(): Promise<User> {
	return apiClient.get('/me');
}
```

The caller does not need to know the endpoint details.

## A Bad Abstraction Hides Too Much

Bad:

```ts
async function doUserStuff(input: unknown): Promise<unknown> {
	// Validates user, updates database, sends emails, logs metrics,
	// formats response, and retries failed operations.
}
```

This hides behavior that callers probably need to understand.

## Abstractions Should Be Easier Than What They Replace

If the abstraction is harder to understand than the original code, it is
probably a bad abstraction.

## Avoid Generic Names for Abstractions

Bad:

```ts
Manager;
Processor;
Handler;
Helper;
Util;
Service;
```

These names are sometimes acceptable, but often too vague.

Better:

```ts
LeaseApplicationService;
ApplicantScreeningProcessor;
PasswordResetEmailBuilder;
SubscriptionRenewalScheduler;
```

## Do Not Abstract Based on Imaginary Future Requirements

Bad:

```ts
interface MultiProviderDynamicNotificationGatewayFactoryStrategy {
	// ...
}
```

If there is only one notification provider and no realistic plan to add another,
this is overengineering.

Design for real change, not imaginary change.

---

# Separation of Concerns

Separation of concerns means different parts of the system should handle
different responsibilities.

A module should not know everything.

## Example Concerns

In a typical application, separate concerns may include:

- UI rendering
- Form state
- Validation
- API communication
- Authentication
- Authorization
- Business rules
- Database access
- Logging
- Error handling
- External service integration

## Bad Example

```tsx
function RegisterScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!email.includes('@')) {
			setError('Invalid email');
			return;
		}

		if (password.length < 8) {
			setError('Password too short');
			return;
		}

		const response = await fetch('https://api.example.com/register', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			setError('Registration failed');
			return;
		}

		// More logic...
	}

	return <Form />;
}
```

The component owns too much.

## Better Example

```tsx
function RegisterScreen() {
	const registerUser = useRegisterUser();

	return <RegisterForm onSubmit={registerUser} />;
}
```

Then separate modules handle validation, API calls, and error mapping.

---

# Single Responsibility Principle

The Single Responsibility Principle says a unit of code should have one reason
to change.

This does not mean every function must do only one tiny operation. It means each
function, class, or module should own one clear responsibility.

## Bad

```ts
class UserService {
	validateUserInput() {}
	hashPassword() {}
	saveUserToDatabase() {}
	sendWelcomeEmail() {}
	renderUserHtml() {}
}
```

This class has too many reasons to change.

## Better

```ts
class UserInputValidator {}
class PasswordHasher {}
class UserRepository {}
class WelcomeEmailSender {}
class UserHtmlRenderer {}
```

Each class has a narrower purpose.

## Do Not Split Code Too Aggressively

Single responsibility does not mean every line needs its own function.

Bad:

```ts
function getUserEmail(user: User): string {
	return user.email;
}
```

This kind of function usually adds noise.

Split code when it improves clarity, testability, reuse, or change safety.

---

# Coupling and Cohesion

## Coupling

Coupling is how much one part of the code depends on another.

High coupling means changes in one place often force changes elsewhere.

Bad:

```ts
function createInvoice(order: Order) {
	const taxRate = globalApplicationConfig.billing.tax.us.tennessee.rate;
	// ...
}
```

This function is tightly coupled to global configuration structure.

Better:

```ts
function createInvoice(order: Order, taxRate: number) {
	// ...
}
```

## Cohesion

Cohesion is how closely related the code inside a module is.

High cohesion is good.

Bad:

```ts
// user.utils.ts
export function formatUserName() {}
export function calculateInvoiceTotal() {}
export function parseJwt() {}
export function buildCalendarEvent() {}
```

This file has low cohesion.

Better:

```ts
// user-formatting.ts
export function formatUserName() {}

// invoice-calculation.ts
export function calculateInvoiceTotal() {}

// auth-token.ts
export function parseJwt() {}

// calendar-event-builder.ts
export function buildCalendarEvent() {}
```

---

# Composition Over Inheritance

Inheritance can be useful, but it is often overused.

Composition means building behavior by combining smaller pieces.

## Inheritance Example

```ts
class Animal {
	eat() {}
}

class Dog extends Animal {
	bark() {}
}
```

This is fine for simple examples, but real systems become harder when
inheritance trees get deep.

## Problems With Inheritance

Inheritance can create:

- Tight coupling between parent and child classes
- Fragile base classes
- Confusing override behavior
- Deep hierarchies that are hard to understand
- Forced relationships that do not really fit

## Composition Example

```ts
interface Logger {
	info(message: string): void;
	error(message: string): void;
}

class UserService {
	constructor(private readonly logger: Logger) {}

	createUser(input: CreateUserInput) {
		this.logger.info('Creating user');
		// ...
	}
}
```

`UserService` does not inherit logging behavior. It receives a logger
dependency.

This is easier to test and easier to replace.

---

# Immutability

Immutability means not changing existing values after they are created.

In JavaScript and TypeScript, immutability helps avoid accidental side effects.

## Bad: Mutating Input

```ts
function applyDiscount(order: Order): Order {
	order.total = order.total * 0.9;
	return order;
}
```

The caller may not expect the original order to change.

## Better: Return a New Object

```ts
function applyDiscount(order: Order): Order {
	return {
		...order,
		total: order.total * 0.9,
	};
}
```

## Use `readonly` When Appropriate

```ts
interface User {
	readonly id: string;
	readonly email: string;
}
```

This communicates that the fields should not be reassigned.

## Do Not Force Immutability Everywhere

Immutability is useful, but do not make code awkward just to avoid all mutation.

Local mutation inside a small function can be acceptable.

```ts
function groupUsersByRole(users: User[]): Record<string, User[]> {
	const usersByRole: Record<string, User[]> = {};

	for (const user of users) {
		usersByRole[user.role] ??= [];
		usersByRole[user.role].push(user);
	}

	return usersByRole;
}
```

This is readable and contained.

---

# Side Effects

Side effects are actions that affect something outside a function.

They include:

- Network requests
- Database writes
- File writes
- Console logging
- Updating shared state
- Mutating arguments
- Sending emails

Side effects should be isolated and intentional.

## Pure Function

```ts
function calculateTax(amount: number, taxRate: number): number {
	return amount * taxRate;
}
```

Same input always produces same output.

## Function With Side Effect

```ts
async function saveInvoice(invoice: Invoice): Promise<void> {
	await database.invoices.insert(invoice);
}
```

This is necessary, but it should be obvious from the name.

## Keep Side Effects Near Boundaries

Business logic is easier to test when side effects are kept at the edges.

Better:

```ts
function buildInvoice(order: Order, taxRate: number): Invoice {
	const tax = calculateTax(order.total, taxRate);

	return {
		orderId: order.id,
		total: order.total + tax,
		tax,
	};
}

async function createInvoice(order: Order): Promise<Invoice> {
	const taxRate = await taxRateRepository.getTaxRate(order.state);
	const invoice = buildInvoice(order, taxRate);

	await invoiceRepository.save(invoice);

	return invoice;
}
```

`buildInvoice` is pure. `createInvoice` handles side effects.

---

# Control Flow

Control flow should be easy to follow.

Complex branching is one of the fastest ways to make code hard to maintain.

## Prefer Guard Clauses

Guard clauses handle invalid or special cases early.

```ts
function calculateShipping(order: Order): number {
	if (order.items.length === 0) {
		return 0;
	}

	if (order.isDigitalOnly) {
		return 0;
	}

	if (order.total > 100) {
		return 0;
	}

	return 9.99;
}
```

## Avoid Deep Nesting

Bad:

```ts
if (user) {
	if (user.isActive) {
		if (user.role === 'Admin') {
			// ...
		}
	}
}
```

Better:

```ts
if (!user) {
	return;
}

if (!user.isActive) {
	return;
}

if (user.role !== 'Admin') {
	return;
}

// ...
```

## Extract Complex Conditions

Bad:

```ts
if (
	application.status === 'Submitted' &&
	application.creditCheckStatus === 'Passed' &&
	application.backgroundCheckStatus === 'Passed' &&
	!application.hasOpenDispute
) {
	approveApplication(application);
}
```

Better:

```ts
const isApplicationReadyForApproval =
	application.status === 'Submitted' &&
	application.creditCheckStatus === 'Passed' &&
	application.backgroundCheckStatus === 'Passed' &&
	!application.hasOpenDispute;

if (isApplicationReadyForApproval) {
	approveApplication(application);
}
```

Even better if reused:

```ts
function isApplicationReadyForApproval(application: Application): boolean {
	return (
		application.status === 'Submitted' &&
		application.creditCheckStatus === 'Passed' &&
		application.backgroundCheckStatus === 'Passed' &&
		!application.hasOpenDispute
	);
}
```

## Prefer Polymorphism or Lookup Maps Over Large Switches When Appropriate

A switch statement is not automatically bad.

But repeated switch statements across the codebase are usually a problem.

Bad:

```ts
function getNotificationMessage(type: NotificationType): string {
	switch (type) {
		case 'LeaseCreated':
			return 'Your lease has been created.';
		case 'PaymentFailed':
			return 'Your payment failed.';
		case 'ScreeningComplete':
			return 'Your screening is complete.';
		default:
			return 'You have a new notification.';
	}
}
```

Better for simple mappings:

```ts
const notificationMessages: Record<NotificationType, string> = {
	LeaseCreated: 'Your lease has been created.',
	PaymentFailed: 'Your payment failed.',
	ScreeningComplete: 'Your screening is complete.',
};

function getNotificationMessage(type: NotificationType): string {
	return notificationMessages[type];
}
```

---

# Data Validation

Clean code does not blindly trust input.

Validate data at system boundaries.

## Boundaries That Need Validation

- HTTP request bodies
- Query parameters
- Route parameters
- Environment variables
- External API responses
- User input
- Database records if the schema is weak or legacy
- File input

## Validate Early

Bad:

```ts
async function createApplicant(input: unknown) {
	const applicant = input as CreateApplicantInput;
	return applicantRepository.create(applicant);
}
```

Better:

```ts
async function createApplicant(input: unknown) {
	const createApplicantInput = validateCreateApplicantInput(input);
	return applicantRepository.create(createApplicantInput);
}
```

## Do Not Let Invalid Data Travel Through the App

Once data is validated, convert it into a trusted internal type.

```ts
const input = validateCreateLeaseRequest(request.body);
const lease = await createLease(input);
```

The service layer should not need to constantly defend against malformed request
bodies if the route layer already validated them.

---

# APIs and Boundaries

A boundary is where one part of the system talks to another.

Examples:

- Frontend to backend
- Backend to database
- Backend to external service
- App to environment variables
- UI component to form library

Boundaries need extra care because assumptions often break there.

## Keep Boundary Code Isolated

Bad:

```tsx
function ApplicantCard({ applicant }: { applicant: ApplicantApiResponse }) {
	return (
		<Text>
			{applicant.first_name} {applicant.last_name}
		</Text>
	);
}
```

This leaks API response shape into the UI.

Better:

```tsx
function ApplicantCard({ applicant }: { applicant: Applicant }) {
	return <Text>{applicant.fullName}</Text>;
}
```

Map the API response elsewhere.

## Make API Clients Predictable

Good API clients should:

- Use consistent error handling
- Handle authentication consistently
- Avoid duplicating fetch logic everywhere
- Return typed data
- Avoid leaking low-level HTTP details unless needed

Example:

```ts
class ApiClient {
	async get<TResponse>(path: string): Promise<TResponse> {
		const response = await fetch(`${this.baseUrl}${path}`);

		if (!response.ok) {
			throw await ApiError.fromResponse(response);
		}

		return response.json() as Promise<TResponse>;
	}
}
```

Do not spread raw `fetch` calls throughout the app unless the app is very small.

---

# Testing and Clean Code

Testable code is usually cleaner code.

If code is hard to test, it often has one of these problems:

- Too many responsibilities
- Hidden dependencies
- Hidden side effects
- Tight coupling
- Poor boundaries
- Unclear input/output

## Prefer Testing Behavior Over Implementation Details

Bad:

```ts
expect(service.privateHelperWasCalled).toBe(true);
```

Better:

```ts
expect(result.status).toBe('Approved');
```

Test what the code does, not how it does it.

## Make Dependencies Injectable

Bad:

```ts
async function sendWelcomeEmail(user: User) {
	await sendgrid.send({ to: user.email });
}
```

Better:

```ts
interface EmailClient {
	send(input: SendEmailInput): Promise<void>;
}

async function sendWelcomeEmail(user: User, emailClient: EmailClient) {
	await emailClient.send({ to: user.email, template: 'Welcome' });
}
```

This is easier to test because you can pass a fake email client.

## Do Not Over-Mock

Mock external systems and hard dependencies.

Do not mock every internal function. Excessive mocking makes tests brittle.

## Good Unit Tests Are Clear

A clean test usually follows this structure:

1. Arrange
2. Act
3. Assert

```ts
it('returns free shipping for orders over 100 dollars', () => {
	const order = createOrder({ total: 125 });

	const shippingCost = calculateShipping(order);

	expect(shippingCost).toBe(0);
});
```

## Tests Are Also Code

Test code should be clean too.

Avoid:

- Huge test setup blocks
- Unclear mock data
- Copy-pasted tests with tiny differences
- Tests that depend on execution order
- Tests that verify implementation details

---

# Clean Code in React

React code becomes messy when components take on too much responsibility.

A component should usually focus on rendering UI and coordinating user
interaction.

## Keep Components Focused

Bad:

```tsx
function PropertiesScreen() {
	// Fetches data
	// Handles loading
	// Handles errors
	// Contains filtering logic
	// Contains sorting logic
	// Contains formatting logic
	// Renders every UI detail
}
```

Better:

```tsx
function PropertiesScreen() {
	const propertiesState = usePropertiesScreenState();

	return <PropertiesView {...propertiesState} />;
}
```

The hook can own data loading and screen behavior. The view can focus on
rendering.

## Separate Container and Presentational Concerns When Useful

```tsx
function PropertiesScreen() {
	const { properties, isLoading, error } = useProperties();

	return (
		<PropertiesContent
			properties={properties}
			isLoading={isLoading}
			error={error}
		/>
	);
}
```

## Avoid Massive Components

A component is probably too large if:

- It has many unrelated pieces of state.
- It has several `useEffect` calls doing unrelated things.
- It contains complex business logic.
- It renders many unrelated sections.
- It is difficult to test.
- You keep scrolling to understand it.

## Extract Components for Meaning, Not Just Size

Bad extraction:

```tsx
function TopPart() {}
function MiddlePart() {}
function BottomPart() {}
```

Better extraction:

```tsx
function ApplicantSummaryCard() {}
function LeaseTermsSection() {}
function ScreeningStatusBanner() {}
```

Names should describe the UI concept.

## Keep Hooks Focused

Bad:

```ts
function useEverythingForDashboard() {
	// User fetching
	// Property fetching
	// Notifications
	// Filters
	// Navigation
	// Analytics
}
```

Better:

```ts
function useCurrentUser() {}
function useProperties() {}
function useDashboardFilters() {}
function useNotifications() {}
```

Then compose them where needed.

## Avoid Unnecessary `useEffect`

Many `useEffect` calls are unnecessary.

Bad:

```tsx
const [fullName, setFullName] = useState('');

useEffect(() => {
	setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Better:

```tsx
const fullName = `${firstName} ${lastName}`;
```

Use `useEffect` for synchronizing with external systems, not for simple derived
values.

## Avoid Prop Drilling When It Becomes Painful

Passing props through one or two layers is fine.

Passing props through many layers that do not use them is a sign you may need:

- Component composition
- Context
- A dedicated state management solution
- Better component boundaries

Do not reach for global state too early.

---

# Clean Code in Node.js APIs

Backend code should have clear boundaries between routing, validation, business
logic, and persistence.

## Keep Routes Thin

Bad:

```ts
app.post('/leases', async (request, response) => {
	// Validate request
	// Run business rules
	// Query database
	// Call external services
	// Send emails
	// Format response
});
```

Better:

```ts
app.post('/leases', async (request, response) => {
	const input = validateCreateLeaseRequest(request.body);
	const lease = await leaseService.createLease(input);

	response.status(201).json(lease);
});
```

Routes should coordinate HTTP concerns. They should not own business logic.

## Separate Layers

A common backend structure:

```txt
routes/controllers -> services/use-cases -> repositories -> database
```

Responsibilities:

- **Routes/controllers**: HTTP request and response handling
- **Validation**: Input parsing and validation
- **Services/use-cases**: Business workflow
- **Repositories**: Data access
- **External clients**: Third-party API communication

## Do Not Put Business Logic in Repositories

Bad:

```ts
class LeaseRepository {
	async createLeaseAndRunScreening() {
		// business workflow
	}
}
```

Better:

```ts
class LeaseService {
	async createLease() {
		// business workflow
	}
}

class LeaseRepository {
	async create() {
		// database insert only
	}
}
```

Repositories should focus on persistence.

## Keep External Services Behind Clients

Bad:

```ts
await fetch('https://screening-provider.example.com/checks', {
	method: 'POST',
	body: JSON.stringify(applicant),
});
```

scattered across multiple services.

Better:

```ts
class ScreeningClient {
	async runScreening(applicant: Applicant): Promise<ScreeningResult> {
		// provider-specific HTTP call
	}
}
```

This keeps provider details isolated.

---

# Clean Code in TypeScript

TypeScript clean code means using the type system to make behavior clearer and
safer.

## Avoid Type Assertions Unless Necessary

Bad:

```ts
const user = response.data as User;
```

This tells TypeScript to trust you, even if you are wrong.

Better:

```ts
const user = validateUserResponse(response.data);
```

## Avoid Non-Null Assertions

Bad:

```ts
const email = user.email!;
```

Better:

```ts
if (!user.email) {
	throw new Error('User email is required');
}

const email = user.email;
```

## Prefer Narrow Types

Bad:

```ts
interface ButtonProps {
	variant: string;
}
```

Better:

```ts
type ButtonVariant = 'Primary' | 'Secondary' | 'Danger';

interface ButtonProps {
	variant: ButtonVariant;
}
```

## Use Exhaustive Checks

```ts
type ApplicationStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

function getStatusLabel(status: ApplicationStatus): string {
	switch (status) {
		case 'Draft':
			return 'Draft';
		case 'Submitted':
			return 'Submitted';
		case 'Approved':
			return 'Approved';
		case 'Rejected':
			return 'Rejected';
		default: {
			const exhaustiveCheck: never = status;
			return exhaustiveCheck;
		}
	}
}
```

This helps catch missing cases when the union changes.

## Prefer Explicit Return Types for Public Functions

For internal small functions, inference is often fine.

For exported functions, explicit return types improve clarity.

```ts
export function calculateInvoiceTotal(invoice: Invoice): number {
	return invoice.lineItems.reduce((total, item) => total + item.amount, 0);
}
```

## Avoid Overly Clever Type Programming

Advanced types can be useful, but they can also make code hard to maintain.

If a type takes significant effort to understand, ask whether the benefit is
worth it.

---

# File and Folder Organization

Good organization makes code easier to find and change.

There is no perfect structure. The best structure is one that fits the size and
shape of the project.

## Organize by Feature When the App Grows

For larger applications, feature-based organization is often better than
file-type-based organization.

Less ideal for large apps:

```txt
components/
hooks/
services/
types/
utils/
```

Better for larger apps:

```txt
features/
	applicants/
		components/
		hooks/
		services/
		types/
	properties/
		components/
		hooks/
		services/
		types/
shared/
	components/
	utils/
	api/
```

This keeps related code close together.

## Avoid Dumping Everything Into `utils`

A `utils` folder often becomes a junk drawer.

Bad:

```txt
utils/
	format.ts
	helpers.ts
	stuff.ts
	common.ts
```

Better:

```txt
shared/
	date/
		format-date.ts
	currency/
		format-currency.ts
	validation/
		validate-email.ts
```

## File Names Should Be Clear

Bad:

```txt
helper.ts
common.ts
misc.ts
manager.ts
```

Better:

```txt
format-phone-number.ts
create-lease-application.ts
applicant-screening.client.ts
use-current-user.ts
```

## Keep Index Files Under Control

Index files can simplify imports, but they can also hide dependencies and create
circular import problems.

Use them carefully.

---

# Performance and Clean Code

Clean code and performant code are not opposites.

In most business applications, clear code should come first. Then optimize where
measurement shows a problem.

## Do Not Optimize Blindly

Bad:

```ts
// Complex optimization with no evidence that it matters
```

Better:

1. Write clear code.
2. Measure performance.
3. Identify the bottleneck.
4. Optimize the bottleneck.
5. Keep the optimized code understandable.

## Performance Problems Often Come From Design

Common real-world causes:

- Repeated unnecessary API calls
- Large unnecessary re-renders
- Missing database indexes
- Fetching too much data
- Doing expensive work in render functions
- Recomputing values unnecessarily
- Blocking the main thread
- Loading large bundles

## Clean Performance-Oriented Code Is Explicit

```ts
const filteredProperties = useMemo(() => {
	return properties.filter((property) => property.status === selectedStatus);
}, [properties, selectedStatus]);
```

Use this when filtering is expensive or causes unnecessary renders. Do not add
`useMemo` everywhere by default.

---

# Security and Clean Code

Security should be part of clean code.

Code that is readable but insecure is not clean.

## Validate Inputs

Never trust client input.

Validate:

- Types
- Required fields
- String lengths
- Allowed values
- Numeric ranges
- Ownership and permissions

## Avoid Leaking Sensitive Information

Bad:

```ts
logger.error('Login failed', { password });
```

Better:

```ts
logger.error('Login failed', { email });
```

Do not log passwords, tokens, secrets, credit card numbers, or sensitive
personal information.

## Authorization Belongs on the Server

Frontend checks improve user experience, but they do not provide real security.

Bad assumption:

```ts
// Hiding the button is enough
{isAdmin && <DeleteUserButton />}
```

The backend must also verify permission.

## Keep Secrets Out of Code

Bad:

```ts
const apiKey = 'hard-coded-secret';
```

Better:

```ts
const apiKey = getRequiredEnvironmentVariable('API_KEY');
```

## Fail Safely

When permission is unclear, deny access.

When validation fails, reject the request.

When an external service behaves unexpectedly, do not silently continue as if
everything succeeded.

---

# Code Reviews

Code review is one of the best tools for maintaining clean code.

A good review focuses on correctness, clarity, maintainability, and risk.

## What to Look For

- Does the code solve the actual problem?
- Is the logic understandable?
- Are names clear?
- Are responsibilities separated?
- Are edge cases handled?
- Are errors handled properly?
- Are types useful and accurate?
- Is there unnecessary abstraction?
- Is there risky duplication?
- Are tests sufficient?
- Is this secure?
- Will this be painful to maintain?

## Good Review Feedback Is Specific

Bad:

```txt
This is confusing.
```

Better:

```txt
This function validates input, updates the database, and sends emails. I would split the validation and email sending into separate functions so the main workflow is easier to follow and test.
```

## Do Not Nitpick What Tooling Can Enforce

Formatting, import order, and simple style rules should be handled by tools
where possible.

Use code review time for things that require engineering judgment.

---

# Refactoring

Refactoring means changing code structure without changing external behavior.

Good refactoring reduces future cost.

## Refactor When There Is a Reason

Good reasons:

- You need to add a feature and the current code makes it hard.
- You found duplicated business rules.
- A function is too large to safely modify.
- Tests are hard to write because dependencies are tangled.
- Naming is misleading.
- A module has too many responsibilities.

Bad reasons:

- Personal preference only.
- Making code look clever.
- Adding abstractions for imaginary future needs.
- Rewriting stable code without a clear benefit.

## Refactor in Small Steps

Safer refactoring usually looks like this:

1. Add tests around current behavior if needed.
2. Rename unclear variables or functions.
3. Extract obvious helper functions.
4. Separate responsibilities.
5. Improve types.
6. Remove duplication.
7. Re-run tests after each meaningful step.

## Do Not Mix Large Refactors With Feature Work

Large refactors and new features together increase risk.

If possible, separate them into different pull requests.

---

# Common Clean Code Mistakes

## Mistake 1: Thinking Clean Code Means Short Code

Short code is not always clean.

Bad:

```ts
const x = u?.a?.b?.c?.filter((y) => y.z).map((q) => q.v)[0];
```

This is short but unclear.

Clean code values clarity over cleverness.

## Mistake 2: Over-Abstraction

Too many abstractions make code harder to follow.

Symptoms:

- You must jump through many files to understand simple behavior.
- Interfaces exist with only one implementation and no meaningful reason.
- Generic types are more complex than the runtime behavior.
- The abstraction name is vague.
- The abstraction hides important behavior.

## Mistake 3: Under-Abstraction

No abstraction can also be a problem.

Symptoms:

- Business rules are duplicated.
- API calls are copied everywhere.
- Error handling is inconsistent.
- Components repeat the same logic.
- Changes require editing many unrelated files.

## Mistake 4: Poor Naming

Bad names create constant confusion.

Examples:

```ts
doThing();
handleData();
processItem();
manager;
helper;
result;
```

These may be acceptable in very small scopes, but they are usually too vague.

## Mistake 5: Too Much Logic in UI Components

UI components should not own complex business rules.

Move business logic into services, hooks, or pure helper functions.

## Mistake 6: Weak Types

Using `any`, loose strings, and broad object types makes TypeScript less useful.

## Mistake 7: Silent Failure

Silent failure is dangerous.

Bad:

```ts
try {
	await updatePaymentMethod(input);
} catch {}
```

At minimum, log the error or surface it appropriately.

## Mistake 8: Comments Instead of Clear Code

Bad:

```ts
// Check if user can edit the lease
if (u.r === 'A' || u.p.includes('LEASE_EDIT')) {
	// ...
}
```

Better:

```ts
const canEditLease =
	user.role === 'Admin' || user.permissions.includes('Lease.Edit');

if (canEditLease) {
	// ...
}
```

## Mistake 9: Ignoring Boundaries

External data should be validated and mapped before spreading through the app.

## Mistake 10: Treating Clean Code as a One-Time Task

Clean code is ongoing. Codebases drift unless teams keep maintaining boundaries,
names, tests, and patterns.

---

# Clean Code Checklist

Use this checklist before opening a pull request.

## Naming

- Are variable names specific?
- Do function names describe actions?
- Do boolean names read clearly as true or false?
- Are domain terms used consistently?
- Are abbreviations avoided unless standard?

## Functions

- Does each function have a clear responsibility?
- Are functions small enough to understand?
- Are side effects obvious?
- Are there too many parameters?
- Are boolean flag parameters avoided?
- Is nesting kept under control?

## Types

- Is `any` avoided?
- Are public functions typed clearly?
- Are union types used where they help?
- Are invalid states prevented where practical?
- Are API types separated from domain types when needed?

## Components

- Are React components focused?
- Is business logic kept out of rendering where practical?
- Are hooks focused and named clearly?
- Are derived values calculated directly instead of stored unnecessarily?

## Error Handling

- Are errors handled intentionally?
- Are errors logged with useful but safe context?
- Are domain errors represented clearly?
- Are failures surfaced instead of hidden?

## Abstraction

- Does each abstraction have a clear purpose?
- Is the abstraction easier than the code it replaces?
- Is there duplicated knowledge that should be extracted?
- Is there premature abstraction that should be removed?

## Data and Boundaries

- Is external input validated?
- Are API responses mapped where needed?
- Are environment variables validated?
- Are external services isolated behind clients?

## Security

- Is authorization enforced server-side?
- Are secrets kept out of code?
- Are sensitive values excluded from logs?
- Are invalid requests rejected safely?

## Tests

- Are important behaviors tested?
- Are tests focused on behavior instead of implementation details?
- Are dependencies mocked only where appropriate?
- Are edge cases covered?

## Maintainability

- Can another developer understand this without explanation?
- Can this be changed safely later?
- Are responsibilities separated?
- Is the file organization clear?
- Is the code consistent with the rest of the project?

---

# Final Guidance

Clean code is not about rigid rules. It is about engineering judgment.

The best clean code is usually boring, direct, and predictable. It uses clear
names, simple functions, useful types, explicit boundaries, and intentional
abstractions.

When deciding whether code is clean, ask these questions:

1. **Can I understand what this does quickly?**
2. **Can I explain why it exists?**
3. **Can I change it without breaking unrelated behavior?**
4. **Are important assumptions explicit?**
5. **Does the structure match the problem?**
6. **Is this simpler than the alternatives?**
7. **Would I be comfortable maintaining this six months from now?**

Clean code is not the same as clever code. Clever code often impresses the
author and punishes the maintainer.

Prefer code that is obvious.

Obvious code is professional code.
