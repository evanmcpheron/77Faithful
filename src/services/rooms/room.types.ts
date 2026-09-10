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

export interface IRoomApiService {
	getRooms: (request: IGetRoomsRequest) => Promise<IGetRoomsByPropertyIdResponse>;
	getRoomsByPropertyId: (
		propertyId: string,
	) => Promise<IGetRoomsByPropertyIdResponse>;
	getDetailedRoomsByPropertyId: (
		propertyId: string,
	) => Promise<IGetDetailedRoomsByPropertyIdResponse>;
	createRoom: (request: ICreateRoomRequest) => Promise<ICreateRoomResponse>;
	getRoomById: (roomId: string) => Promise<IGetRoomByIdResponse>;
	updateRoom: (
		roomId: string,
		request: IUpdateRoomRequest,
	) => Promise<IUpdateRoomResponse>;
	deleteRoom: (roomId: string) => Promise<IDeleteRoomResponse>;
}
