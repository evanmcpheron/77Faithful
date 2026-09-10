import type {
	ICreateStripeCheckoutSessionRequest,
	ICreateStripeCheckoutSessionResponse,
	IGetBillingProductsResponse,
	IGetCompanyBillingSummaryResponse,
	ISyncAppleSubscriptionRequest,
	ISyncGoogleSubscriptionRequest,
	ISyncStoreSubscriptionResponse,
} from '@turndown/library';

export interface IBillingApiService {
	getBillingProducts: () => Promise<IGetBillingProductsResponse>;
	getCompanyBillingSummary: (
		companyId: string,
	) => Promise<IGetCompanyBillingSummaryResponse>;
	createStripeCheckoutSession: (
		companyId: string,
		request: ICreateStripeCheckoutSessionRequest,
	) => Promise<ICreateStripeCheckoutSessionResponse>;
	syncAppleSubscription: (
		companyId: string,
		request: ISyncAppleSubscriptionRequest,
	) => Promise<ISyncStoreSubscriptionResponse>;
	syncGoogleSubscription: (
		companyId: string,
		request: ISyncGoogleSubscriptionRequest,
	) => Promise<ISyncStoreSubscriptionResponse>;
}
