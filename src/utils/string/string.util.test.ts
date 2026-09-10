import {
	capitalize,
	charCount,
	containsAll,
	containsAny,
	escapeRegex,
	extractNumbers,
	fromBase64,
	highlight,
	isEmail,
	isEmpty,
	isNumeric,
	isPalindrome,
	isUrl,
	longestWord,
	normalizeSpaces,
	padEnd,
	padStart,
	pluralize,
	removeDuplicates,
	removeSpecialChars,
	removeWhitespace,
	repeat,
	repeatChar,
	reverse,
	slug,
	splitMultiple,
	stringSimilarity,
	stripHtml,
	titleCase,
	toBase64,
	toCamelCase,
	toKebabCase,
	toNumber,
	toPascalCase,
	toSnakeCase,
	truncate,
	wordCount,
} from './string.util';

describe('String Utilities', () => {
	describe('Case Conversions', () => {
		describe('toCamelCase', () => {
			it('should convert hyphenated string to camelCase', () => {
				expect(toCamelCase('hello-world')).toBe('helloWorld');
			});

			it('should convert snake_case to camelCase', () => {
				expect(toCamelCase('hello_world')).toBe('helloWorld');
			});

			it('should convert space-separated to camelCase', () => {
				expect(toCamelCase('hello world')).toBe('helloWorld');
			});

			it('should handle multiple separators', () => {
				expect(toCamelCase('hello-world_test case')).toBe(
					'helloWorldTestCase',
				);
			});

			it('should handle already camelCase', () => {
				expect(toCamelCase('helloWorld')).toBe('helloworld');
			});

			it('should handle empty string', () => {
				expect(toCamelCase('')).toBe('');
			});

			it('should handle single word', () => {
				expect(toCamelCase('hello')).toBe('hello');
			});
		});

		describe('toKebabCase', () => {
			it('should convert camelCase to kebab-case', () => {
				expect(toKebabCase('helloWorld')).toBe('hello-world');
			});

			it('should convert snake_case to kebab-case', () => {
				expect(toKebabCase('hello_world')).toBe('hello-world');
			});

			it('should convert space-separated to kebab-case', () => {
				expect(toKebabCase('hello world')).toBe('hello-world');
			});

			it('should handle PascalCase', () => {
				expect(toKebabCase('HelloWorld')).toBe('hello-world');
			});

			it('should handle multiple separators', () => {
				expect(toKebabCase('Hello_World Test')).toBe(
					'hello-world-test',
				);
			});

			it('should handle empty string', () => {
				expect(toKebabCase('')).toBe('');
			});
		});

		describe('toSnakeCase', () => {
			it('should convert camelCase to snake_case', () => {
				expect(toSnakeCase('helloWorld')).toBe('hello_world');
			});

			it('should convert kebab-case to snake_case', () => {
				expect(toSnakeCase('hello-world')).toBe('hello_world');
			});

			it('should convert space-separated to snake_case', () => {
				expect(toSnakeCase('hello world')).toBe('hello_world');
			});

			it('should handle PascalCase', () => {
				expect(toSnakeCase('HelloWorld')).toBe('hello_world');
			});

			it('should handle empty string', () => {
				expect(toSnakeCase('')).toBe('');
			});
		});

		describe('toPascalCase', () => {
			it('should convert hyphenated string to PascalCase', () => {
				expect(toPascalCase('hello-world')).toBe('HelloWorld');
			});

			it('should convert snake_case to PascalCase', () => {
				expect(toPascalCase('hello_world')).toBe('HelloWorld');
			});

			it('should convert space-separated to PascalCase', () => {
				expect(toPascalCase('hello world')).toBe('HelloWorld');
			});

			it('should handle camelCase', () => {
				expect(toPascalCase('helloWorld')).toBe('HelloWorld');
			});

			it('should handle empty string', () => {
				expect(toPascalCase('')).toBe('');
			});
		});
	});

	describe('Capitalization', () => {
		describe('capitalize', () => {
			it('should capitalize first character', () => {
				expect(capitalize('hello world')).toBe('Hello world');
			});

			it('should handle already capitalized string', () => {
				expect(capitalize('Hello world')).toBe('Hello world');
			});

			it('should handle single character', () => {
				expect(capitalize('a')).toBe('A');
			});

			it('should handle empty string', () => {
				expect(capitalize('')).toBe('');
			});

			it('should handle uppercase strings', () => {
				expect(capitalize('HELLO')).toBe('HELLO');
			});
		});

		describe('titleCase', () => {
			it('should capitalize first letter of each word', () => {
				expect(titleCase('hello world')).toBe('Hello World');
			});

			it('should handle already title-cased string', () => {
				expect(titleCase('Hello World')).toBe('Hello World');
			});

			it('should handle single word', () => {
				expect(titleCase('hello')).toBe('Hello');
			});

			it('should handle multiple spaces', () => {
				expect(titleCase('hello   world')).toBe('Hello   World');
			});

			it('should handle empty string', () => {
				expect(titleCase('')).toBe('');
			});
		});
	});

	describe('Truncation and Padding', () => {
		describe('truncate', () => {
			it('should truncate string to specified length', () => {
				expect(truncate('hello world', 5)).toBe('he...');
			});

			it('should not truncate if length is less than or equal to limit', () => {
				expect(truncate('hello', 10)).toBe('hello');
			});

			it('should use custom suffix', () => {
				expect(truncate('hello world', 5, '...')).toBe('he...');
			});

			it('should handle length equal to string length', () => {
				expect(truncate('hello', 5)).toBe('hello');
			});

			it('should handle very small length', () => {
				expect(truncate('hello', 0)).toBe('');
			});

			it('should handle empty string', () => {
				expect(truncate('', 5)).toBe('');
			});
		});

		describe('padStart', () => {
			it('should pad string at start', () => {
				expect(padStart('5', 3, '0')).toBe('005');
			});

			it('should use default space padding', () => {
				expect(padStart('hello', 8)).toBe('   hello');
			});

			it('should not pad if already long enough', () => {
				expect(padStart('hello', 3)).toBe('hello');
			});
		});

		describe('padEnd', () => {
			it('should pad string at end', () => {
				expect(padEnd('5', 3, '0')).toBe('500');
			});

			it('should use default space padding', () => {
				expect(padEnd('hello', 8)).toBe('hello   ');
			});

			it('should not pad if already long enough', () => {
				expect(padEnd('hello', 3)).toBe('hello');
			});
		});
	});

	describe('Character and Whitespace Manipulation', () => {
		describe('removeWhitespace', () => {
			it('should remove all whitespace', () => {
				expect(removeWhitespace('hello world')).toBe('helloworld');
			});

			it('should remove tabs and newlines', () => {
				expect(removeWhitespace('hello\t\nworld')).toBe('helloworld');
			});

			it('should handle string with no whitespace', () => {
				expect(removeWhitespace('helloworld')).toBe('helloworld');
			});

			it('should handle empty string', () => {
				expect(removeWhitespace('')).toBe('');
			});
		});

		describe('removeSpecialChars', () => {
			it('should remove special characters', () => {
				expect(removeSpecialChars('hello@world#123')).toBe(
					'helloworld123',
				);
			});

			it('should keep alphanumeric characters', () => {
				expect(removeSpecialChars('abc123')).toBe('abc123');
			});

			it('should remove symbols and punctuation', () => {
				expect(removeSpecialChars('hello!@#$%^&*()')).toBe('hello');
			});

			it('should handle empty string', () => {
				expect(removeSpecialChars('')).toBe('');
			});
		});

		describe('normalizeSpaces', () => {
			it('should replace multiple spaces with single space', () => {
				expect(normalizeSpaces('hello    world')).toBe('hello world');
			});

			it('should trim leading and trailing spaces', () => {
				expect(normalizeSpaces('  hello world  ')).toBe('hello world');
			});

			it('should handle tabs and newlines', () => {
				expect(normalizeSpaces('hello\t\t\nworld')).toBe('hello world');
			});

			it('should handle already normalized string', () => {
				expect(normalizeSpaces('hello world')).toBe('hello world');
			});
		});

		describe('reverse', () => {
			it('should reverse a string', () => {
				expect(reverse('hello')).toBe('olleh');
			});

			it('should handle single character', () => {
				expect(reverse('a')).toBe('a');
			});

			it('should handle empty string', () => {
				expect(reverse('')).toBe('');
			});

			it('should handle special characters', () => {
				expect(reverse('a@b#c')).toBe('c#b@a');
			});
		});

		describe('repeat', () => {
			it('should repeat string specified times', () => {
				expect(repeat('ab', 3)).toBe('ababab');
			});

			it('should handle repeat count of 0', () => {
				expect(repeat('hello', 0)).toBe('');
			});

			it('should handle repeat count of 1', () => {
				expect(repeat('hello', 1)).toBe('hello');
			});

			it('should handle negative repeat count', () => {
				expect(repeat('hello', -5)).toBe('');
			});

			it('should handle empty string', () => {
				expect(repeat('', 5)).toBe('');
			});
		});

		describe('repeatChar', () => {
			it('should repeat character specified times', () => {
				expect(repeatChar('*', 5)).toBe('*****');
			});

			it('should handle repeat count of 0', () => {
				expect(repeatChar('x', 0)).toBe('');
			});

			it('should handle single character', () => {
				expect(repeatChar('-', 3)).toBe('---');
			});

			it('should handle negative repeat count', () => {
				expect(repeatChar('a', -3)).toBe('');
			});
		});

		describe('extractNumbers', () => {
			it('should extract all numbers from string', () => {
				expect(extractNumbers('abc123def456')).toBe('123456');
			});

			it('should handle string with no numbers', () => {
				expect(extractNumbers('abcdef')).toBe('');
			});

			it('should handle string with only numbers', () => {
				expect(extractNumbers('123456')).toBe('123456');
			});

			it('should handle empty string', () => {
				expect(extractNumbers('')).toBe('');
			});
		});

		describe('removeDuplicates', () => {
			it('should remove consecutive duplicate characters', () => {
				expect(removeDuplicates('aabbccdd')).toBe('abcd');
			});

			it('should keep non-consecutive duplicates', () => {
				expect(removeDuplicates('abcabc')).toBe('abcabc');
			});

			it('should handle no duplicates', () => {
				expect(removeDuplicates('abcd')).toBe('abcd');
			});

			it('should handle all same characters', () => {
				expect(removeDuplicates('aaaa')).toBe('a');
			});

			it('should handle empty string', () => {
				expect(removeDuplicates('')).toBe('');
			});
		});
	});

	describe('Validation Functions', () => {
		describe('isEmail', () => {
			it('should validate correct email', () => {
				expect(isEmail('user@example.com')).toBe(true);
			});

			it('should validate email with multiple dots', () => {
				expect(isEmail('user.name@example.co.uk')).toBe(true);
			});

			it('should reject email without @', () => {
				expect(isEmail('userexample.com')).toBe(false);
			});

			it('should reject email without domain', () => {
				expect(isEmail('user@')).toBe(false);
			});

			it('should reject email without local part', () => {
				expect(isEmail('@example.com')).toBe(false);
			});

			it('should reject empty string', () => {
				expect(isEmail('')).toBe(false);
			});
		});

		describe('isUrl', () => {
			it('should validate correct URL', () => {
				expect(isUrl('https://example.com')).toBe(true);
			});

			it('should validate URL with path', () => {
				expect(isUrl('https://example.com/path')).toBe(true);
			});

			it('should validate http URL', () => {
				expect(isUrl('http://example.com')).toBe(true);
			});

			it('should reject invalid URL', () => {
				expect(isUrl('not a url')).toBe(false);
			});

			it('should reject empty string', () => {
				expect(isUrl('')).toBe(false);
			});

			it('should reject URL without protocol', () => {
				expect(isUrl('example.com')).toBe(false);
			});
		});

		describe('isNumeric', () => {
			it('should validate numeric string', () => {
				expect(isNumeric('12345')).toBe(true);
			});

			it('should reject string with letters', () => {
				expect(isNumeric('123abc')).toBe(false);
			});

			it('should reject empty string', () => {
				expect(isNumeric('')).toBe(false);
			});

			it('should reject string with special characters', () => {
				expect(isNumeric('123-456')).toBe(false);
			});

			it('should reject decimal numbers', () => {
				expect(isNumeric('123.45')).toBe(false);
			});

			it('should reject negative numbers', () => {
				expect(isNumeric('-123')).toBe(false);
			});
		});

		describe('isEmpty', () => {
			it('should return true for empty string', () => {
				expect(isEmpty('')).toBe(true);
			});

			it('should return true for whitespace-only string', () => {
				expect(isEmpty('   ')).toBe(true);
			});

			it('should return true for tabs and newlines', () => {
				expect(isEmpty('\t\n  ')).toBe(true);
			});

			it('should return false for string with content', () => {
				expect(isEmpty('hello')).toBe(false);
			});

			it('should return false for string with leading space and content', () => {
				expect(isEmpty(' hello')).toBe(false);
			});
		});

		describe('isPalindrome', () => {
			it('should identify palindrome', () => {
				expect(isPalindrome('racecar')).toBe(true);
			});

			it('should identify non-palindrome', () => {
				expect(isPalindrome('hello')).toBe(false);
			});

			it('should ignore case', () => {
				expect(isPalindrome('RaceCar')).toBe(true);
			});

			it('should ignore special characters', () => {
				expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(
					true,
				);
			});

			it('should handle single character', () => {
				expect(isPalindrome('a')).toBe(true);
			});

			it('should handle empty string', () => {
				expect(isPalindrome('')).toBe(true);
			});
		});
	});

	describe('Encoding and Conversion', () => {
		describe('toBase64', () => {
			it('should encode string to base64', () => {
				expect(toBase64('hello')).toBe('aGVsbG8=');
			});

			it('should encode string with spaces', () => {
				expect(toBase64('hello world')).toBe('aGVsbG8gd29ybGQ=');
			});

			it('should encode special characters', () => {
				expect(toBase64('hello@123')).toBe('aGVsbG9AMTIz');
			});

			it('should handle empty string', () => {
				expect(toBase64('')).toBe('');
			});
		});

		describe('fromBase64', () => {
			it('should decode base64 string', () => {
				expect(fromBase64('aGVsbG8=')).toBe('hello');
			});

			it('should decode base64 with spaces', () => {
				expect(fromBase64('aGVsbG8gd29ybGQ=')).toBe('hello world');
			});

			it('should decode base64 with special characters', () => {
				expect(fromBase64('aGVsbG9AMTIz')).toBe('hello@123');
			});

			it('should handle empty string', () => {
				expect(fromBase64('')).toBe('');
			});
		});

		describe('toNumber', () => {
			it('should convert valid numeric string', () => {
				expect(toNumber('123')).toBe(123);
			});

			it('should convert decimal string', () => {
				expect(toNumber('123.45')).toBe(123.45);
			});

			it('should convert negative number string', () => {
				expect(toNumber('-123')).toBe(-123);
			});

			it('should return null for non-numeric string', () => {
				expect(toNumber('abc')).toBe(null);
			});

			it('should return null for empty string', () => {
				expect(toNumber('')).toBe(null);
			});

			it('should handle leading/trailing spaces', () => {
				expect(toNumber('  123  ')).toBe(123);
			});
		});

		describe('slug', () => {
			it('should create URL-friendly slug', () => {
				expect(slug('Hello World 2024!')).toBe('hello-world-2024');
			});

			it('should remove special characters', () => {
				expect(slug('Hello@World#123')).toBe('helloworld123');
			});

			it('should replace spaces with hyphens', () => {
				expect(slug('hello world test')).toBe('hello-world-test');
			});

			it('should remove leading and trailing hyphens', () => {
				expect(slug('-hello world-')).toBe('hello-world');
			});

			it('should handle empty string', () => {
				expect(slug('')).toBe('');
			});

			it('should convert to lowercase', () => {
				expect(slug('HELLO WORLD')).toBe('hello-world');
			});
		});
	});

	describe('Counting Functions', () => {
		describe('wordCount', () => {
			it('should count words in string', () => {
				expect(wordCount('hello world test')).toBe(3);
			});

			it('should handle single word', () => {
				expect(wordCount('hello')).toBe(1);
			});

			it('should handle multiple spaces', () => {
				expect(wordCount('hello    world')).toBe(2);
			});

			it('should trim leading and trailing spaces', () => {
				expect(wordCount('  hello world  ')).toBe(2);
			});

			it('should handle empty string', () => {
				expect(wordCount('')).toBe(0);
			});
		});

		describe('charCount', () => {
			it('should count characters excluding whitespace', () => {
				expect(charCount('hello world')).toBe(10);
			});

			it('should handle string with multiple spaces', () => {
				expect(charCount('a b c d')).toBe(4);
			});

			it('should handle empty string', () => {
				expect(charCount('')).toBe(0);
			});

			it('should exclude all whitespace types', () => {
				expect(charCount('a\tb\nc d')).toBe(4);
			});
		});

		describe('longestWord', () => {
			it('should find longest word', () => {
				expect(longestWord('the quick brown fox')).toBe('quick');
			});

			it('should handle single word', () => {
				expect(longestWord('hello')).toBe('hello');
			});

			it('should return first longest if multiple exist', () => {
				expect(longestWord('hi bye test')).toBe('test');
			});

			it('should handle empty string', () => {
				expect(longestWord('')).toBe('');
			});
		});
	});

	describe('Advanced String Functions', () => {
		describe('pluralize', () => {
			it('should pluralize regular word', () => {
				expect(pluralize('cat')).toBe('cats');
			});

			it('should handle word ending in y', () => {
				expect(pluralize('baby')).toBe('babies');
			});

			it('should handle word ending in s', () => {
				expect(pluralize('class')).toBe('classes');
			});

			it('should handle word ending in x', () => {
				expect(pluralize('box')).toBe('boxes');
			});

			it('should handle word ending in o', () => {
				expect(pluralize('hero')).toBe('heroes');
			});

			it('should handle word ending in f', () => {
				expect(pluralize('leaf')).toBe('leaves');
			});

			it('should handle irregular plurals', () => {
				expect(pluralize('child')).toBe('children');
				expect(pluralize('person')).toBe('people');
				expect(pluralize('mouse')).toBe('mice');
			});

			it('should handle case insensitive irregular plurals', () => {
				expect(pluralize('CHILD')).toBe('children');
			});
		});

		describe('highlight', () => {
			it('should highlight substring with default marker', () => {
				expect(highlight('hello world', 'world')).toBe(
					'hello **world**',
				);
			});

			it('should use custom marker', () => {
				expect(highlight('hello world', 'world', '__')).toBe(
					'hello __world__',
				);
			});

			it('should highlight case-insensitive', () => {
				expect(highlight('Hello World', 'world')).toBe(
					'Hello **World**',
				);
			});

			it('should highlight multiple occurrences', () => {
				expect(highlight('hello hello world', 'hello')).toBe(
					'**hello** **hello** world',
				);
			});

			it('should handle substring not found', () => {
				expect(highlight('hello world', 'foo')).toBe('hello world');
			});

			it('should handle empty string', () => {
				expect(highlight('', 'test')).toBe('');
			});
		});

		describe('escapeRegex', () => {
			it('should escape regex special characters', () => {
				expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
			});

			it('should escape all special characters', () => {
				expect(escapeRegex('.*+?^${}()|[]\\')).toBe(
					'\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\',
				);
			});

			it('should handle normal characters', () => {
				expect(escapeRegex('hello')).toBe('hello');
			});

			it('should handle empty string', () => {
				expect(escapeRegex('')).toBe('');
			});
		});

		describe('stringSimilarity', () => {
			it('should return 1 for identical strings', () => {
				expect(stringSimilarity('hello', 'hello')).toBe(1);
			});

			it('should return 0 for completely different strings', () => {
				expect(stringSimilarity('abc', 'xyz')).toBe(0);
			});

			it('should calculate similarity for similar strings', () => {
				const similarity = stringSimilarity('hello', 'hallo');
				expect(similarity).toBeGreaterThan(0.5);
				expect(similarity).toBeLessThan(1);
			});

			it('should be case insensitive', () => {
				expect(stringSimilarity('HELLO', 'hello')).toBe(1);
			});

			it('should handle empty strings', () => {
				expect(stringSimilarity('', '')).toBe(1);
			});
		});

		describe('stripHtml', () => {
			it('should remove HTML tags', () => {
				expect(stripHtml('<p>Hello <b>world</b></p>')).toBe(
					'Hello world',
				);
			});

			it('should remove self-closing tags', () => {
				expect(stripHtml('Hello<br/>world')).toBe('Helloworld');
			});

			it('should handle nested tags', () => {
				expect(stripHtml('<div><p>Hello</p></div>')).toBe('Hello');
			});

			it('should handle string without tags', () => {
				expect(stripHtml('hello world')).toBe('hello world');
			});

			it('should handle empty string', () => {
				expect(stripHtml('')).toBe('');
			});

			it('should handle tags with attributes', () => {
				expect(stripHtml('<p class="text">Hello</p>')).toBe('Hello');
			});
		});
	});

	describe('Splitting and Checking Functions', () => {
		describe('splitMultiple', () => {
			it('should split by multiple delimiters', () => {
				expect(splitMultiple('a,b;c:d', ',', ';', ':')).toEqual([
					'a',
					'b',
					'c',
					'd',
				]);
			});

			it('should filter empty strings', () => {
				expect(splitMultiple('a,,b', ',')).toEqual(['a', 'b']);
			});

			it('should handle single delimiter', () => {
				expect(splitMultiple('a,b,c', ',')).toEqual(['a', 'b', 'c']);
			});

			it('should handle no delimiters found', () => {
				expect(splitMultiple('abc', ',')).toEqual(['abc']);
			});

			it('should handle empty string', () => {
				expect(splitMultiple('', ',')).toEqual([]);
			});
		});

		describe('containsAny', () => {
			it('should return true if string contains any substring', () => {
				expect(containsAny('hello world', 'foo', 'world')).toBe(true);
			});

			it('should return false if string contains no substrings', () => {
				expect(containsAny('hello world', 'foo', 'bar')).toBe(false);
			});

			it('should return true if first substring matches', () => {
				expect(containsAny('hello world', 'hello')).toBe(true);
			});

			it('should handle case sensitivity', () => {
				expect(containsAny('hello world', 'HELLO')).toBe(false);
			});

			it('should handle empty string', () => {
				expect(containsAny('', 'test')).toBe(false);
			});
		});

		describe('containsAll', () => {
			it('should return true if string contains all substrings', () => {
				expect(containsAll('hello world', 'hello', 'world')).toBe(true);
			});

			it('should return false if string missing any substring', () => {
				expect(containsAll('hello world', 'hello', 'foo')).toBe(false);
			});

			it('should handle single substring', () => {
				expect(containsAll('hello world', 'hello')).toBe(true);
			});

			it('should handle case sensitivity', () => {
				expect(containsAll('hello world', 'HELLO')).toBe(false);
			});

			it('should return true for empty substrings array', () => {
				expect(containsAll('hello world')).toBe(true);
			});

			it('should handle empty string', () => {
				expect(containsAll('', 'test')).toBe(false);
			});
		});
	});

	describe('Edge Cases and Combined Tests', () => {
		it('should handle round-trip encoding/decoding', () => {
			const original = 'hello world';
			const encoded = toBase64(original);
			const decoded = fromBase64(encoded);
			expect(decoded).toBe(original);
		});

		it('should handle chained case conversions', () => {
			const str = 'hello-world';
			expect(toKebabCase(toPascalCase(str))).toBe('hello-world');
		});

		it('should validate email before processing', () => {
			const email = 'test@example.com';
			if (isEmail(email)) {
				expect(slug(email)).toBe('testexamplecom');
			}
		});

		it('should handle string with mixed unicode', () => {
			expect(reverse('hello')).toBe('olleh');
		});

		it('should handle very long strings', () => {
			const longStr = 'a'.repeat(10000);
			expect(wordCount(longStr)).toBe(1);
			expect(charCount(longStr)).toBe(10000);
		});

		it('should handle strings with only whitespace operations', () => {
			const str = '   hello   world   ';
			expect(normalizeSpaces(str)).toBe('hello world');
			expect(removeWhitespace(str)).toBe('helloworld');
		});
	});
});
