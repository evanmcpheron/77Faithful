import type {
	ICreatePropertyRequest,
	ICreatePropertyResponse,
	IDeletePropertyResponse,
	IGetPropertiesByCompanyIdResponse,
	IGetPropertiesRequest,
	IGetPropertiesResponse,
	IGetPropertyAccessInformationResponse,
	IGetPropertyByIdResponse,
	IUpdatePropertyAccessInformationRequest,
	IUpdatePropertyAccessInformationResponse,
	IUpdatePropertyRequest,
	IUpdatePropertyResponse,
} from '@turndown/library';

export interface IPropertyApiService {
	getProperties: (
		request?: IGetPropertiesRequest,
	) => Promise<IGetPropertiesResponse>;
	getCompanyProperties: () => Promise<IGetPropertiesByCompanyIdResponse>;
	getPropertyById: (propertyId: string) => Promise<IGetPropertyByIdResponse>;
	createProperty: (
		request: ICreatePropertyRequest,
	) => Promise<ICreatePropertyResponse>;
	updateProperty: (
		propertyId: string,
		request: IUpdatePropertyRequest,
	) => Promise<IUpdatePropertyResponse>;
	deleteProperty: (propertyId: string) => Promise<IDeletePropertyResponse>;
	getPropertyAccessInformation: (
		propertyId: string,
	) => Promise<IGetPropertyAccessInformationResponse>;
	updatePropertyAccessInformation: (
		propertyId: string,
		request: IUpdatePropertyAccessInformationRequest,
	) => Promise<IUpdatePropertyAccessInformationResponse>;
}
