import type {
	ICreateRoomRequest,
	ICreateRoomResponse,
	IDeleteRoomResponse,
	IGetDetailedRoomsByPropertyIdResponse,
	IGetRoomByIdResponse,
	IGetRoomsByPropertyIdResponse,
	IGetRoomsRequest,
	IUpdateRoomRequest,
	IUpdateRoomResponse,
} from '@turndown/library';

import { apiClient } from '../api/api-client.instance';
import type { TApiResponse } from '../api/api.types';
import type { IRoomApiService } from './room.types';

class RoomApiService implements IRoomApiService {
	getRooms = async (
		request: IGetRoomsRequest,
	): Promise<IGetRoomsByPropertyIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetRoomsByPropertyIdResponse>
		>('/rooms', {
			params: request,
		});

		return response.data;
	};

	getRoomsByPropertyId = async (
		propertyId: string,
	): Promise<IGetRoomsByPropertyIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetRoomsByPropertyIdResponse>
		>(`/rooms/property/${propertyId}`);

		return response.data;
	};

	getDetailedRoomsByPropertyId = async (
		propertyId: string,
	): Promise<IGetDetailedRoomsByPropertyIdResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetDetailedRoomsByPropertyIdResponse>
		>(`/rooms/property/${propertyId}/detailed`);

		return response.data;
	};

	createRoom = async (
		request: ICreateRoomRequest,
	): Promise<ICreateRoomResponse> => {
		const response = await apiClient.post<
			TApiResponse<ICreateRoomResponse>,
			ICreateRoomRequest
		>('/rooms', request);

		return response.data;
	};

	getRoomById = async (roomId: string): Promise<IGetRoomByIdResponse> => {
		const response = await apiClient.get<TApiResponse<IGetRoomByIdResponse>>(
			`/rooms/${roomId}`,
		);

		return response.data;
	};

	updateRoom = async (
		roomId: string,
		request: IUpdateRoomRequest,
	): Promise<IUpdateRoomResponse> => {
		const response = await apiClient.patch<
			TApiResponse<IUpdateRoomResponse>,
			IUpdateRoomRequest
		>(`/rooms/${roomId}`, request);

		return response.data;
	};

	deleteRoom = async (roomId: string): Promise<IDeleteRoomResponse> => {
		const response = await apiClient.delete<TApiResponse<IDeleteRoomResponse>>(
			`/rooms/${roomId}`,
		);

		return response.data;
	};
}

export const roomApiService = new RoomApiService();
