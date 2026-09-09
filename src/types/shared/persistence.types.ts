/** A settled timestamp; compatible with both Firestore SDKs, without importing either. */
export interface IPersistedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

export interface IDocumentTimestamps {
  readonly createdAt: IPersistedTimestamp;
  readonly updatedAt: IPersistedTimestamp;
}

// Validate Gregorian YYYY-MM-DD and HH:mm at boundaries; templates alone cannot do so.
export type TCalendarDate = `${number}-${number}-${number}`;
export type TLocalClockTime = `${number}:${number}`;

/** A validated IANA identifier, such as America/New_York; never a UTC offset. */
export type TIanaTimeZoneId = string;

export const DomainSchemaVersion = {
  Current: 1,
} as const;

export type TDomainSchemaVersion = (typeof DomainSchemaVersion)[keyof typeof DomainSchemaVersion];
