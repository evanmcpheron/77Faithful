/**
 * A plain object with string keys and unknown values — the appropriate
 * "real" type for the object utilities in this file, which accept any
 * record-shaped input without caring about its concrete schema.
 */
type PlainObject = Record<string, unknown>;

/**
 * Check if an object has any own properties
 */
export const hasProperties = (obj: unknown): boolean => {
	if (!obj || typeof obj !== 'object') {
		return false;
	}
	return Object.keys(obj).length > 0;
};

/**
 * Check if an object has a specific property
 */
export const hasProperty = (obj: unknown, prop: string): boolean => {
	if (!obj || typeof obj !== 'object') {
		return false;
	}
	return Object.prototype.hasOwnProperty.call(obj, prop);
};

/**
 * Check if an object has a specific property
 */
export const hasOwnProp = (obj: unknown, prop: string): boolean => {
	return Object.prototype.hasOwnProperty.call(obj, prop);
};

/**
 * Get the first property value from an object
 */
export const getFirstPropertyValue = <T extends PlainObject>(
	obj: T | null | undefined,
): T[keyof T] | null => {
	if (!hasProperties(obj)) {
		return null;
	}
	const source = obj as T;
	const keys = Object.keys(source) as (keyof T)[];
	return source[keys[0]];
};

/**
 * Get nested value from object using dot notation
 * @example getValue({ user: { name: 'John' } }, 'user.name')
 * @returns 'John'
 */
export const getNestedValue = (obj: PlainObject, path: string): unknown => {
	const keys = path.split('.');
	let current: unknown = obj;

	for (const key of keys) {
		if (current === null || current === undefined) {
			return undefined;
		}
		current = (current as PlainObject)[key];
	}
	return current;
};

/**
 * Set nested value in object using dot notation
 * @example setNestedValue({}, 'user.name', 'John')
 */
export const setNestedValue = (
	obj: PlainObject,
	path: string,
	value: unknown,
): void => {
	const keys = path.split('.');
	let current: PlainObject = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (!current[key] || typeof current[key] !== 'object') {
			current[key] = {};
		}
		current = current[key] as PlainObject;
	}

	current[keys[keys.length - 1]] = value;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(deepClone) as unknown as T;
	}
	const cloned: PlainObject = {};

	for (const key in obj) {
		if (hasOwnProp(obj, key)) {
			cloned[key] = deepClone((obj as PlainObject)[key]);
		}
	}

	return cloned as T;
};

/**
 * Remove undefined values from an object
 */
export const removeUndefined = <T extends PlainObject>(
	object: T,
): Partial<T> => {
	const result: Partial<T> = {};
	for (const key in object) {
		if (object[key] !== undefined) {
			result[key] = object[key];
		}
	}
	return result;
};

/**
 * Flatten nested object to dot notation
 * @example flatten({ user: { name: 'John' } })
 * @returns { 'user.name': 'John' }
 */
export const flatten = (obj: PlainObject, prefix = ''): PlainObject => {
	const result: PlainObject = {};

	for (const key in obj) {
		if (hasOwnProp(obj, key)) {
			const value = obj[key];
			const newKey = prefix ? `${prefix}.${key}` : key;

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				Object.assign(result, flatten(value as PlainObject, newKey));
			} else {
				result[newKey] = value;
			}
		}
	}
	return result;
};

/**
 * Unflatten dot notation object to nested object
 * @example unflatten({ 'user.name': 'John' })
 * @returns { user: { name: 'John' } }
 */
export const unflatten = (obj: PlainObject): PlainObject => {
	const result: PlainObject = {};

	for (const key in obj) {
		if (hasOwnProp(obj, key)) {
			setNestedValue(result, key, obj[key]);
		}
	}
	return result;
};
