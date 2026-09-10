export interface PublishOptions {
	// Not used in RN. Kept for API compatibility.
	bubbles?: boolean;
	cancelable?: boolean;
}

type TChannelListener<TData> = (data: TData) => void;

const listenerMap: Record<string, Map<symbol, TChannelListener<unknown>>> = {};

/**
 * Returns true if at least one listener is registered for the channel.
 */
export const isChannelActive = (eventName: string) => {
	return !!listenerMap[eventName] && listenerMap[eventName].size > 0;
};

/**
 * Subscribe to a channel. Returns a unique listener id.
 * In RN we do not have DOM events, so we keep an internal bus.
 */
export const subscribeToChannel = async <TData = unknown>(
	channelName: string,
	onMessage: TChannelListener<TData> | null,
): Promise<symbol> => {
	const uniqueListenerId = Symbol();

	if (!listenerMap[channelName]) {
		listenerMap[channelName] = new Map();
	}

	if (onMessage) {
		listenerMap[channelName].set(
			uniqueListenerId,
			onMessage as TChannelListener<unknown>,
		);
	}

	return uniqueListenerId;
};

/**
 * Remove a previously registered listener from a channel.
 */
export const disposeChannel = async (
	channelName: string,
	listenerId: symbol,
) => {
	const channelListeners = listenerMap[channelName];

	if (!channelListeners) {
		return;
	}

	try {
		if (channelListeners.has(listenerId)) {
			channelListeners.delete(listenerId);
		}

		if (channelListeners.size === 0) {
			delete listenerMap[channelName];
		}
	} catch {
		/** noop */
	}
};

/**
 * Publish data to every subscriber on a channel.
 * `PublishOptions` are kept for API parity but have no effect in RN.
 */
export const publishOnChannel = async <TData = unknown>(
	channelName: string,
	data: TData,
	_options?: PublishOptions,
) => {
	const channelListeners = listenerMap[channelName];

	if (!channelListeners) {
		return;
	}

	for (const [, listener] of channelListeners) {
		try {
			(listener as TChannelListener<TData>)(data);
		} catch {
			// Isolate listener failures.
		}
	}
};
