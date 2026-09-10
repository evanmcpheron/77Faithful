import type { SharedValue } from 'react-native-reanimated';

export interface IHeaderScrollContextValue {
	scrollOffset: SharedValue<number>;
	resetScrollOffset: () => void;
}
