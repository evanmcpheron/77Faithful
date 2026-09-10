export const DividerThickness = {
	Line: 'Line',
} as const;

export type TDividerThickness =
	(typeof DividerThickness)[keyof typeof DividerThickness];

export interface IDividerProps {
	thickness?: TDividerThickness;
}
