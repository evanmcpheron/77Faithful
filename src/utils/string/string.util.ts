/**
 * String utilities for common text manipulation tasks
 */

/**
 * Adds commas to a number for thousands separators
 * @example formatNumber(1000) => '1,000'
 * @example formatNumber('1234567') => '1,234,567'
 * @example formatNumber(1234567.89) => '1,234,567.89'
 */
export const formatNumber = (value: string | number): string => {
	const str = String(value);
	const [integer, decimal] = str.split('.');
	const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return decimal !== undefined
		? `${formattedInteger}.${decimal}`
		: formattedInteger;
};

export const normalCase = (str?: string): string => {
	if (!str) {
		return '';
	}

	return str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
		.split(/\s+/)
		.map(
			(word: string) =>
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(' ');
};

/**
 * Converts a string to camelCase
 * @example toCamelCase('hello-world') => 'helloWorld'
 * @example toCamelCase('hello_world') => 'helloWorld'
 */
export const toCamelCase = (str: string): string => {
	return str
		.toLowerCase()
		.replace(/[_-\s](.)/g, (_, char) => char.toUpperCase())
		.replace(/^(.)/, (char) => char.toLowerCase());
};

/**
 * Converts a string to kebab-case
 * @example toKebabCase('helloWorld') => 'hello-world'
 * @example toKebabCase('Hello_World') => 'hello-world'
 */
export const toKebabCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[_\s]+/g, '-')
		.toLowerCase();
};

/**
 * Converts a string to snake_case
 * @example toSnakeCase('helloWorld') => 'hello_world'
 * @example toSnakeCase('hello-world') => 'hello_world'
 */
export const toSnakeCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.replace(/[-\s]+/g, '_')
		.toLowerCase();
};

/**
 * Converts a string to PascalCase
 * @example toPascalCase('hello-world') => 'HelloWorld'
 * @example toPascalCase('hello_world') => 'HelloWorld'
 */
export const toPascalCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.toLowerCase()
		.split(/[_-\s]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
};

/**
 * Capitalizes the first character of a string
 * @example capitalize('hello world') => 'Hello world'
 */
export const capitalize = (str: string): string => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalizes the first letter of each word
 * @example titleCase('hello world') => 'Hello World'
 */
export const titleCase = (str: string): string => {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Truncates a string to a specified length and adds ellipsis
 * @example truncate('hello world', 5) => 'he...'
 */
export const truncate = (
	str: string,
	length: number,
	suffix = '...',
): string => {
	if (str.length <= length) {
		return str;
	}
	const maxLength = Math.max(0, length - suffix.length);
	if (maxLength === 0) {
		return '';
	}
	return str.slice(0, maxLength) + suffix;
};

/**
 * Removes all whitespace from a string
 * @example removeWhitespace('hello world') => 'helloworld'
 */
export const removeWhitespace = (str: string): string => {
	return str.replace(/\s+/g, '');
};

/**
 * Removes all non-alphanumeric characters
 * @example removeSpecialChars('hello@world#123') => 'helloworld123'
 */
export const removeSpecialChars = (str: string): string => {
	return str.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Generates a URL-friendly slug from a string
 * @example slug('Hello World 2024!') => 'hello-world-2024'
 */
export const slug = (str: string): string => {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

/**
 * Validates if a string is a valid email
 * @example isEmail('user@example.com') => true
 */
export const isEmail = (str: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(str);
};

/**
 * Validates if a string is a valid URL
 * @example isUrl('https://example.com') => true
 */
export const isUrl = (str: string): boolean => {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
};

/**
 * Validates if a string contains only numbers
 * @example isNumeric('12345') => true
 * @example isNumeric('123abc') => false
 */
export const isNumeric = (str: string): boolean => {
	return /^\d+$/.test(str);
};

/**
 * Checks if a string is empty or contains only whitespace
 * @example isEmpty('  ') => true
 * @example isEmpty('hello') => false
 */
export const isEmpty = (str: string): boolean => {
	return str.trim().length === 0;
};

/**
 * Reverses a string
 * @example reverse('hello') => 'olleh'
 */
export const reverse = (str: string): string => {
	return str.split('').reverse().join('');
};

/**
 * Repeats a string a specified number of times
 * @example repeat('ab', 3) => 'ababab'
 */
export const repeat = (str: string, times: number): string => {
	return str.repeat(Math.max(0, times));
};

/**
 * Pads a string to a specified length
 * @example padStart('5', 3, '0') => '005'
 * @example padEnd('5', 3, '0') => '500'
 */
export const padStart = (
	str: string,
	length: number,
	padChar = ' ',
): string => {
	return str.padStart(length, padChar);
};

export const padEnd = (str: string, length: number, padChar = ' '): string => {
	return str.padEnd(length, padChar);
};

/**
 * Encodes a string to Base64
 * @example toBase64('hello') => 'aGVsbG8='
 */
export const toBase64 = (str: string): string => {
	return Buffer.from(str).toString('base64');
};

/**
 * Decodes a Base64 string
 * @example fromBase64('aGVsbG8=') => 'hello'
 */
export const fromBase64 = (str: string): string => {
	return Buffer.from(str, 'base64').toString('utf-8');
};

/**
 * Counts the number of words in a string
 * @example wordCount('hello world test') => 3
 */
export const wordCount = (str: string): number => {
	return str
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
};

/**
 * Counts the number of characters (excluding whitespace)
 * @example charCount('hello world') => 10
 */
export const charCount = (str: string): number => {
	return str.replace(/\s/g, '').length;
};

/**
 * Repeats a character a specified number of times
 * @example repeatChar('*', 5) => '*****'
 */
export const repeatChar = (char: string, times: number): string => {
	return char.repeat(Math.max(0, times));
};

/**
 * Extracts numbers from a string
 * @example extractNumbers('abc123def456') => '123456'
 */
export const extractNumbers = (str: string): string => {
	return str.replace(/\D/g, '');
};

/**
 * Removes duplicate consecutive characters
 * @example removeDuplicates('aabbccdd') => 'abcd'
 */
export const removeDuplicates = (str: string): string => {
	return str.replace(/(.)\1+/g, '$1');
};

/**
 * Checks if a string is a palindrome
 * @example isPalindrome('racecar') => true
 * @example isPalindrome('hello') => false
 */
export const isPalindrome = (str: string): boolean => {
	const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
	return cleaned === cleaned.split('').reverse().join('');
};

/**
 * Finds the longest word in a string
 * @example longestWord('the quick brown fox') => 'quick'
 */
export const longestWord = (str: string): string => {
	const words = str.split(/\s+/);
	return words.reduce(
		(longest, word) => (word.length > longest.length ? word : longest),
		'',
	);
};

/**
 * Pluralizes a word (simple implementation)
 * @example pluralize('cat') => 'cats'
 * @example pluralize('box') => 'boxes'
 */
export const pluralize = (word: string): string => {
	const exceptions: Record<string, string> = {
		child: 'children',
		person: 'people',
		man: 'men',
		woman: 'women',
		tooth: 'teeth',
		foot: 'feet',
		mouse: 'mice',
	};

	if (exceptions[word.toLowerCase()]) {
		return exceptions[word.toLowerCase()];
	}

	if (word.endsWith('y')) {
		return word.slice(0, -1) + 'ies';
	}
	if (
		word.endsWith('s') ||
		word.endsWith('ss') ||
		word.endsWith('x') ||
		word.endsWith('z')
	) {
		return word + 'es';
	}
	if (word.endsWith('o')) {
		return word + 'es';
	}
	if (word.endsWith('f')) {
		return word.slice(0, -1) + 'ves';
	}
	if (word.endsWith('fe')) {
		return word.slice(0, -2) + 'ves';
	}

	return word + 's';
};

/**
 * Highlights a substring within a string by wrapping it with markers
 * @example highlight('hello world', 'world', '**') => 'hello **world**'
 */
export const highlight = (
	str: string,
	substring: string,
	marker = '**',
): string => {
	return str.replace(
		new RegExp(`(${substring})`, 'gi'),
		`${marker}$1${marker}`,
	);
};

/**
 * Converts a string to a regex-safe string
 * @example escapeRegex('a.b*c') => 'a\\.b\\*c'
 */
export const escapeRegex = (str: string): string => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Finds the similarity between two strings (Levenshtein distance based)
 * Returns a value between 0 and 1 (1 being identical)
 * @example stringSimilarity('hello', 'hallo') => 0.8
 */
export const stringSimilarity = (str1: string, str2: string): number => {
	const s1 = str1.toLowerCase();
	const s2 = str2.toLowerCase();
	const longer = s1.length > s2.length ? s1 : s2;
	const shorter = s1.length > s2.length ? s2 : s1;

	if (longer.length === 0) {
		return 1;
	}

	const editDistance = getEditDistance(longer, shorter);
	return (longer.length - editDistance) / longer.length;
};

/**
 * Helper function to calculate edit distance (Levenshtein distance)
 */
const getEditDistance = (s1: string, s2: string): number => {
	const costs: number[] = [];
	for (let i = 0; i <= s1.length; i++) {
		let lastValue = i;
		for (let j = 0; j <= s2.length; j++) {
			if (i === 0) {
				costs[j] = j;
			} else if (j > 0) {
				let newValue = costs[j - 1];
				if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
					newValue =
						Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
				}
				costs[j - 1] = lastValue;
				lastValue = newValue;
			}
		}
		if (i > 0) {
			costs[s2.length] = lastValue;
		}
	}
	return costs[s2.length];
};

/**
 * Strips HTML tags from a string
 * @example stripHtml('<p>Hello <b>world</b></p>') => 'Hello world'
 */
export const stripHtml = (str: string): string => {
	return str.replace(/<[^>]*>/g, '');
};

/**
 * Replaces multiple spaces with a single space
 * @example normalizeSpaces('hello    world') => 'hello world'
 */
export const normalizeSpaces = (str: string): string => {
	return str.replace(/\s+/g, ' ').trim();
};

/**
 * Converts a string to a number, returns null if not valid
 * @example toNumber('123') => 123
 * @example toNumber('abc') => null
 */
export const toNumber = (str: string): number | null => {
	if (str.trim() === '') {
		return null;
	}
	const num = Number(str);
	return isNaN(num) ? null : num;
};

/**
 * Splits a string by multiple delimiters
 * @example splitMultiple('a,b;c:d', ',', ';', ':') => ['a', 'b', 'c', 'd']
 */
export const splitMultiple = (
	str: string,
	...delimiters: string[]
): string[] => {
	let result = [str];
	for (const delimiter of delimiters) {
		result = result.flatMap((part) => part.split(delimiter));
	}
	return result.filter((part) => part.length > 0);
};

/**
 * Checks if a string contains any of the provided substrings
 * @example containsAny('hello world', 'foo', 'world') => true
 */
export const containsAny = (str: string, ...substrings: string[]): boolean => {
	return substrings.some((substring) => str.includes(substring));
};

/**
 * Checks if a string contains all of the provided substrings
 * @example containsAll('hello world', 'hello', 'world') => true
 */
export const containsAll = (str: string, ...substrings: string[]): boolean => {
	return substrings.every((substring) => str.includes(substring));
};

export interface Address {
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	stateCode?: string;
	postalCode?: string;
}

export const formatAddress = (address: Address): string => {
	const parts = [
		address.addressLine1,
		address.addressLine2,
		address.city,
		address.stateCode,
		address.postalCode,
	].filter(Boolean);

	return parts.join(', ');
};
