import type {
	ICreateStripeCheckoutSessionRequest,
	ICreateStripeCheckoutSessionResponse,
	IGetBillingProductsResponse,
	IGetCompanyBillingSummaryResponse,
	ISyncAppleSubscriptionRequest,
	ISyncGoogleSubscriptionRequest,
	ISyncStoreSubscriptionResponse,
} from '@turndown/library';

import { apiClient } from '@td/services/api/api-client.instance';
import type { TApiResponse } from '@td/services/api/api.types';

import type { IBillingApiService } from './billing.types';

class BillingApiService implements IBillingApiService {
	getBillingProducts = async (): Promise<IGetBillingProductsResponse> => {
		const response =
			await apiClient.get<TApiResponse<IGetBillingProductsResponse>>(
				'/billing/products',
			);

		return response.data;
	};

	getCompanyBillingSummary = async (
		companyId: string,
	): Promise<IGetCompanyBillingSummaryResponse> => {
		const response = await apiClient.get<
			TApiResponse<IGetCompanyBillingSummaryResponse>
		>(`/billing/companies/${companyId}/summary`);

		return response.data;
	};

	createStripeCheckoutSession = async (
		companyId: string,
		request: ICreateStripeCheckoutSessionRequest,
	): Promise<ICreateStripeCheckoutSessionResponse> => {
		const response = await apiClient.post<
			TApiResponse<ICreateStripeCheckoutSessionResponse>,
			ICreateStripeCheckoutSessionRequest
		>(`/billing/companies/${companyId}/checkout/stripe`, request);

		return response.data;
	};

	syncAppleSubscription = async (
		companyId: string,
		request: ISyncAppleSubscriptionRequest,
	): Promise<ISyncStoreSubscriptionResponse> => {
		const response = await apiClient.post<
			TApiResponse<ISyncStoreSubscriptionResponse>,
			ISyncAppleSubscriptionRequest
		>(`/billing/companies/${companyId}/iap/apple/sync`, request);

		return response.data;
	};

	syncGoogleSubscription = async (
		companyId: string,
		request: ISyncGoogleSubscriptionRequest,
	): Promise<ISyncStoreSubscriptionResponse> => {
		const response = await apiClient.post<
			TApiResponse<ISyncStoreSubscriptionResponse>,
			ISyncGoogleSubscriptionRequest
		>(`/billing/companies/${companyId}/iap/google/sync`, request);

		return response.data;
	};
}

export const billingApiService = new BillingApiService();
