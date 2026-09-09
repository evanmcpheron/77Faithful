export const Severity = {
  Default: 'Default',
  Info: 'Info',
  Success: 'Success',
  Warning: 'Warning',
  Error: 'Error',
} as const;

export type TSeverity = (typeof Severity)[keyof typeof Severity];
