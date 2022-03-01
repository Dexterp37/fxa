import { APIError } from '../lib/apiClient';

import {
  FetchState,
  Subscription,
  Plan,
  Profile,
  Token,
  Customer,
  CreateSubscriptionResult,
  CreateSubscriptionError,
  UpdateSubscriptionPlanResult,
  CancelSubscriptionResult,
} from './types';

import { actions, ActionPayload } from './actions';
import { SubsequentInvoicePreview } from 'fxa-shared/dto/auth/payments/invoice';

export const defaultState = {
  customer: uninitializedFetch<Customer, APIError>(),
  plans: uninitializedFetch<Array<Plan>, APIError>(),
  profile: uninitializedFetch<Profile, APIError>(),
  subscriptions: uninitializedFetch<Array<Subscription>>(),
  subsequentInvoices: uninitializedFetch<
    Array<SubsequentInvoicePreview>,
    APIError
  >(),
  token: uninitializedFetch<Token>(),
  cancelSubscription: uninitializedFetch<CancelSubscriptionResult>(),
  reactivateSubscription: uninitializedFetch<
    ActionPayload<typeof actions['reactivateSubscription']>,
    APIError
  >(),
  createSubscription: uninitializedFetch<
    CreateSubscriptionResult,
    CreateSubscriptionError
  >(),
  updateSubscriptionPlan: uninitializedFetch<
    UpdateSubscriptionPlanResult,
    APIError
  >(),
  updatePayment: uninitializedFetch<any>(),
};

// https://blog.usejournal.com/writing-better-reducers-with-react-and-typescript-3-4-30697b926ada
export type State = typeof defaultState;

// Utility to construct an uninitialized FetchState with type annotations
// for future fetches
function uninitializedFetch<T = any, E = any>(): FetchState<T, E> {
  return {
    error: null,
    loading: false,
    result: null,
  } as const;
}

export default defaultState;
