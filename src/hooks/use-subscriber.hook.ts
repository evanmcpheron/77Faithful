import { useEffect, useRef, useState } from 'react';

import { disposeChannel, subscribeToChannel } from '@td/utils/dom/events.util';

export type TSubscriberCallback<TData, TResult> = (
	data: TData,
) => TResult | Promise<TResult>;

export type TMutableSubscriber = <TData = unknown, TResult = TData>(
	channelName: string,
	fn?: TSubscriberCallback<TData, TResult>,
) => TResult | undefined;

export const useSubscriber: TMutableSubscriber = <
	TData = unknown,
	TResult = TData,
>(
	channelName: string,
	fn?: TSubscriberCallback<TData, TResult>,
) => {
	const [channelData, setChannelData] = useState<TResult | undefined>(
		undefined,
	);
	const fnPointer = useRef(fn);
	const listenerIdRef = useRef<symbol | null>(null);

	useEffect(() => {
		fnPointer.current = fn;
	}, [fn]);

	useEffect(() => {
		const subscribe = async () => {
			if (listenerIdRef.current !== null) {
				return;
			}

			const subscriptionListener = async (channelPayload: TData) => {
				if (fnPointer.current) {
					const result = await fnPointer.current(channelPayload);
					setChannelData(result);
					return;
				}

				setChannelData(channelPayload as unknown as TResult);
			};

			listenerIdRef.current = await subscribeToChannel<TData>(
				channelName,
				subscriptionListener,
			);
		};

		void subscribe();

		return () => {
			if (listenerIdRef.current !== null) {
				void disposeChannel(channelName, listenerIdRef.current);
				listenerIdRef.current = null;
			}
		};
	}, [channelName]);

	return channelData;
};
