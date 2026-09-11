import type { ISelectOption, TUSStateCode } from '@turndown/library';
import {
	ACCOUNT_TYPE,
	ServiceTypeOptions,
	US_JURISDICTIONS,
} from '@turndown/library';
import { normalCase } from '@turndown/library/helpers';

export { ServiceTypeOptions };

export const UnitedStatesJurisdictionOptions = Object.entries(
	US_JURISDICTIONS,
).map(([stateCode, stateName]) => ({
	label: stateName,
	value: stateCode,
})) as ISelectOption<TUSStateCode>[];

export const AccountTypeOptions = Object.values(ACCOUNT_TYPE)
	.filter(
		(accountType) =>
			accountType !== ACCOUNT_TYPE.GUEST &&
			accountType !== ACCOUNT_TYPE.TURNDOWN_ADMIN,
	)
	.map((accountType) => ({
		label: normalCase(accountType),
		value: accountType,
	})) as ISelectOption[];
