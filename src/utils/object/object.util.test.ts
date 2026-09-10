import {
	deepClone,
	flatten,
	getFirstPropertyValue,
	getNestedValue,
	hasOwnProp,
	hasProperties,
	hasProperty,
	removeUndefined,
	setNestedValue,
	unflatten,
} from './object.util';

describe('Object Utilities', () => {
	describe('hasProperties', () => {
		it('should return true for objects with properties', () => {
			expect(hasProperties({ name: 'John' })).toBe(true);
			expect(hasProperties({ a: 1, b: 2, c: 3 })).toBe(true);
		});

		it('should return false for empty objects', () => {
			expect(hasProperties({})).toBe(false);
		});

		it('should return false for null or undefined', () => {
			expect(hasProperties(null)).toBe(false);
			expect(hasProperties(undefined)).toBe(false);
		});

		it('should return false for non-object types', () => {
			expect(hasProperties('string')).toBe(false);
			expect(hasProperties(123)).toBe(false);
			expect(hasProperties(true)).toBe(false);
		});

		it('should work with nested objects', () => {
			expect(hasProperties({ user: { name: 'John' } })).toBe(true);
		});
	});

	describe('hasProperty', () => {
		const testObj = { name: 'John', age: 30, address: { city: 'NYC' } };

		it('should return true for existing properties', () => {
			expect(hasProperty(testObj, 'name')).toBe(true);
			expect(hasProperty(testObj, 'age')).toBe(true);
			expect(hasProperty(testObj, 'address')).toBe(true);
		});

		it('should return false for non-existing properties', () => {
			expect(hasProperty(testObj, 'email')).toBe(false);
			expect(hasProperty(testObj, 'phone')).toBe(false);
		});

		it('should return false for null or undefined objects', () => {
			expect(hasProperty(null, 'name')).toBe(false);
			expect(hasProperty(undefined, 'name')).toBe(false);
		});

		it('should return false for non-object types', () => {
			expect(hasProperty('string', 'name')).toBe(false);
			expect(hasProperty(123, 'name')).toBe(false);
		});

		it('should return false for inherited properties', () => {
			const parent = { inherited: 'value' };
			const child = Object.create(parent);
			expect(hasProperty(child, 'inherited')).toBe(false);
		});
	});

	describe('hasOwnProp', () => {
		const testObj = { name: 'John', age: 30 };

		it('should return true for own properties', () => {
			expect(hasOwnProp(testObj, 'name')).toBe(true);
			expect(hasOwnProp(testObj, 'age')).toBe(true);
		});

		it('should return false for non-existing properties', () => {
			expect(hasOwnProp(testObj, 'email')).toBe(false);
		});

		it('should return false for inherited properties', () => {
			const parent = { inherited: 'value' };
			const child = Object.create(parent);
			expect(hasOwnProp(child, 'inherited')).toBe(false);
		});
	});

	describe('getFirstPropertyValue', () => {
		it('should return the first property value', () => {
			expect(getFirstPropertyValue({ a: 1, b: 2 })).toBe(1);
			expect(getFirstPropertyValue({ name: 'John' })).toBe('John');
		});

		it('should return null for empty objects', () => {
			expect(getFirstPropertyValue({})).toBe(null);
		});

		it('should handle objects with nested values', () => {
			const nested = { user: { name: 'John' } };
			expect(getFirstPropertyValue(nested)).toEqual({ name: 'John' });
		});

		it('should handle objects with various value types', () => {
			expect(getFirstPropertyValue({ a: [1, 2, 3] })).toEqual([1, 2, 3]);
			expect(getFirstPropertyValue({ a: true })).toBe(true);
			expect(getFirstPropertyValue({ a: null })).toBe(null);
		});
	});

	describe('getNestedValue', () => {
		const testObj = {
			user: {
				name: 'John',
				address: {
					city: 'NYC',
					zip: '10001',
				},
			},
			age: 30,
		};

		it('should get top-level values', () => {
			expect(getNestedValue(testObj, 'age')).toBe(30);
		});

		it('should get nested values using dot notation', () => {
			expect(getNestedValue(testObj, 'user.name')).toBe('John');
			expect(getNestedValue(testObj, 'user.address.city')).toBe('NYC');
			expect(getNestedValue(testObj, 'user.address.zip')).toBe('10001');
		});

		it('should return undefined for non-existent paths', () => {
			expect(getNestedValue(testObj, 'user.email')).toBe(undefined);
			expect(getNestedValue(testObj, 'user.address.country')).toBe(
				undefined,
			);
		});

		it('should return undefined when path traverses null/undefined', () => {
			expect(getNestedValue({ user: null }, 'user.name')).toBe(undefined);
			expect(getNestedValue({ user: undefined }, 'user.name')).toBe(
				undefined,
			);
		});

		it('should handle empty strings and special values', () => {
			const obj = { user: { name: '', email: 0, active: false } };
			expect(getNestedValue(obj, 'user.name')).toBe('');
			expect(getNestedValue(obj, 'user.email')).toBe(0);
			expect(getNestedValue(obj, 'user.active')).toBe(false);
		});
	});

	describe('setNestedValue', () => {
		it('should set top-level values', () => {
			const obj = {};
			setNestedValue(obj, 'name', 'John');
			expect(obj).toEqual({ name: 'John' });
		});

		it('should set nested values using dot notation', () => {
			const obj = {};
			setNestedValue(obj, 'user.name', 'John');
			expect(obj).toEqual({ user: { name: 'John' } });
		});

		it('should set deeply nested values', () => {
			const obj = {};
			setNestedValue(obj, 'user.address.city', 'NYC');
			expect(obj).toEqual({ user: { address: { city: 'NYC' } } });
		});

		it('should preserve existing properties', () => {
			const obj = { age: 30 };
			setNestedValue(obj, 'user.name', 'John');
			expect(obj).toEqual({ age: 30, user: { name: 'John' } });
		});

		it('should overwrite existing nested values', () => {
			const obj = { user: { name: 'Jane', age: 25 } };
			setNestedValue(obj, 'user.name', 'John');
			expect(obj).toEqual({ user: { name: 'John', age: 25 } });
		});

		it('should handle various value types', () => {
			const obj = {};
			setNestedValue(obj, 'user.settings.theme', 'dark');
			setNestedValue(obj, 'user.settings.notifications', true);
			setNestedValue(obj, 'user.settings.count', 42);

			expect(obj).toEqual({
				user: {
					settings: {
						theme: 'dark',
						notifications: true,
						count: 42,
					},
				},
			});
		});
	});

	describe('deepClone', () => {
		it('should clone primitive values', () => {
			expect(deepClone('string')).toBe('string');
			expect(deepClone(42)).toBe(42);
			expect(deepClone(true)).toBe(true);
			expect(deepClone(null)).toBe(null);
			expect(deepClone(undefined)).toBe(undefined);
		});

		it('should clone simple objects', () => {
			const obj = { name: 'John', age: 30 };
			const cloned = deepClone(obj);
			expect(cloned).toEqual(obj);
			expect(cloned).not.toBe(obj);
		});

		it('should clone nested objects', () => {
			const obj = {
				user: {
					name: 'John',
					address: {
						city: 'NYC',
					},
				},
			};
			const cloned = deepClone(obj);
			expect(cloned).toEqual(obj);
			expect(cloned).not.toBe(obj);
			expect(cloned.user).not.toBe(obj.user);
			expect(cloned.user.address).not.toBe(obj.user.address);
		});

		it('should clone arrays', () => {
			const arr = [1, 2, 3];
			const cloned = deepClone(arr);
			expect(cloned).toEqual(arr);
			expect(cloned).not.toBe(arr);
		});

		it('should clone nested arrays', () => {
			const obj = { items: [1, [2, 3], { id: 4 }] };
			const cloned = deepClone(obj);
			expect(cloned).toEqual(obj);
			expect(cloned.items).not.toBe(obj.items);
			expect(cloned.items[1]).not.toBe(obj.items[1]);
		});

		it('should clone mixed nested structures', () => {
			const obj = {
				users: [
					{ id: 1, name: 'John', tags: ['admin', 'user'] },
					{ id: 2, name: 'Jane', tags: ['user'] },
				],
				settings: {
					theme: 'dark',
					notifications: true,
				},
			};
			const cloned = deepClone(obj);
			expect(cloned).toEqual(obj);
			expect(cloned).not.toBe(obj);
			expect(cloned.users).not.toBe(obj.users);
			expect(cloned.users[0]).not.toBe(obj.users[0]);
			expect(cloned.users[0].tags).not.toBe(obj.users[0].tags);
		});

		it('should handle special values', () => {
			const obj = {
				empty: '',
				zero: 0,
				false: false,
				NaN: NaN,
			};
			const cloned = deepClone(obj);
			expect(cloned.empty).toBe('');
			expect(cloned.zero).toBe(0);
			expect(cloned.false).toBe(false);
			expect(Number.isNaN(cloned.NaN)).toBe(true);
		});
	});

	describe('removeUndefined', () => {
		it('should remove undefined values', () => {
			const obj = { a: 1, b: undefined, c: 3 };
			const result = removeUndefined(obj);
			expect(result).toEqual({ a: 1, c: 3 });
		});

		it('should keep null values', () => {
			const obj = { a: 1, b: null, c: 3 };
			const result = removeUndefined(obj);
			expect(result).toEqual({ a: 1, b: null, c: 3 });
		});

		it('should keep falsy values (except undefined)', () => {
			const obj = { a: 0, b: false, c: '', d: undefined, e: null };
			const result = removeUndefined(obj);
			expect(result).toEqual({ a: 0, b: false, c: '', e: null });
		});

		it('should handle empty objects', () => {
			expect(removeUndefined({})).toEqual({});
		});

		it('should handle objects with all undefined values', () => {
			const obj = { a: undefined, b: undefined };
			const result = removeUndefined(obj);
			expect(result).toEqual({});
		});

		it('should not remove nested undefined values', () => {
			const obj = { user: { name: 'John', email: undefined } };
			const result = removeUndefined(obj);
			expect(result).toEqual({
				user: { name: 'John', email: undefined },
			});
		});
	});

	describe('flatten', () => {
		it('should flatten simple nested objects', () => {
			const obj = { user: { name: 'John' } };
			const result = flatten(obj);
			expect(result).toEqual({ 'user.name': 'John' });
		});

		it('should flatten deeply nested objects', () => {
			const obj = { user: { address: { city: { name: 'NYC' } } } };
			const result = flatten(obj);
			expect(result).toEqual({ 'user.address.city.name': 'NYC' });
		});

		it('should handle multiple properties at each level', () => {
			const obj = {
				user: {
					name: 'John',
					age: 30,
					address: {
						city: 'NYC',
						zip: '10001',
					},
				},
			};
			const result = flatten(obj);
			expect(result).toEqual({
				'user.name': 'John',
				'user.age': 30,
				'user.address.city': 'NYC',
				'user.address.zip': '10001',
			});
		});

		it('should preserve top-level properties', () => {
			const obj = {
				name: 'John',
				user: { email: 'john@example.com' },
			};
			const result = flatten(obj);
			expect(result).toEqual({
				name: 'John',
				'user.email': 'john@example.com',
			});
		});

		it('should skip arrays and treat them as values', () => {
			const obj = { user: { tags: ['admin', 'user'], name: 'John' } };
			const result = flatten(obj);
			expect(result).toEqual({
				'user.tags': ['admin', 'user'],
				'user.name': 'John',
			});
		});

		it('should handle empty objects', () => {
			expect(flatten({})).toEqual({});
		});

		it('should handle objects with null and undefined', () => {
			const obj = { user: { name: null, email: undefined } };
			const result = flatten(obj);
			expect(result).toEqual({
				'user.name': null,
				'user.email': undefined,
			});
		});

		it('should handle falsy values', () => {
			const obj = { user: { active: false, count: 0, name: '' } };
			const result = flatten(obj);
			expect(result).toEqual({
				'user.active': false,
				'user.count': 0,
				'user.name': '',
			});
		});
	});

	describe('unflatten', () => {
		it('should unflatten simple dot notation objects', () => {
			const obj = { 'user.name': 'John' };
			const result = unflatten(obj);
			expect(result).toEqual({ user: { name: 'John' } });
		});

		it('should unflatten deeply nested dot notation', () => {
			const obj = { 'user.address.city.name': 'NYC' };
			const result = unflatten(obj);
			expect(result).toEqual({
				user: { address: { city: { name: 'NYC' } } },
			});
		});

		it('should unflatten multiple properties', () => {
			const obj = {
				'user.name': 'John',
				'user.age': 30,
				'user.address.city': 'NYC',
				'user.address.zip': '10001',
			};
			const result = unflatten(obj);
			expect(result).toEqual({
				user: {
					name: 'John',
					age: 30,
					address: {
						city: 'NYC',
						zip: '10001',
					},
				},
			});
		});

		it('should handle top-level properties', () => {
			const obj = {
				name: 'John',
				'user.email': 'john@example.com',
			};
			const result = unflatten(obj);
			expect(result).toEqual({
				name: 'John',
				user: {
					email: 'john@example.com',
				},
			});
		});

		it('should handle empty objects', () => {
			expect(unflatten({})).toEqual({});
		});

		it('should handle objects with null and undefined', () => {
			const obj = {
				'user.name': null,
				'user.email': undefined,
			};
			const result = unflatten(obj);
			expect(result).toEqual({
				user: {
					name: null,
					email: undefined,
				},
			});
		});

		it('should be inverse of flatten', () => {
			const original = {
				user: {
					name: 'John',
					age: 30,
					address: {
						city: 'NYC',
						zip: '10001',
					},
				},
			};
			const flattened = flatten(original);
			const unflattened = unflatten(flattened);
			expect(unflattened).toEqual(original);
		});
	});

	describe('Integration Tests', () => {
		it('should handle flatten -> unflatten round trip', () => {
			const complex = {
				users: [{ id: 1 }], // Note: arrays won't flatten recursively
				settings: {
					theme: {
						primary: '#000',
						secondary: '#fff',
					},
					notifications: true,
				},
			};
			const flattened = flatten(complex);
			const unflattened = unflatten(flattened);
			expect(unflattened).toEqual(complex);
		});

		it('should handle clone + nested value setting', () => {
			const original = { user: { name: 'John', age: 30 } };
			const cloned = deepClone(original);
			setNestedValue(cloned, 'user.email', 'john@example.com');

			expect(cloned).toEqual({
				user: { name: 'John', age: 30, email: 'john@example.com' },
			});
			expect(original).toEqual({ user: { name: 'John', age: 30 } });
		});

		it('should handle complex nested operations', () => {
			const obj = {
				users: {
					admin: {
						name: 'Admin User',
						permissions: ['read', 'write'],
					},
					regular: { name: 'Regular User', permissions: undefined },
				},
			};

			const withoutUndefined = removeUndefined(obj.users.regular);
			expect(withoutUndefined).toEqual({ name: 'Regular User' });

			const flattened = flatten(obj);
			expect(flattened['users.admin.name']).toBe('Admin User');
		});
	});
});
