/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import MockApp from '../../../.storybook/components/MockApp';
import { PaymentConfirmation, PaymentConfirmationProps } from './index';
import { Customer, Profile, Plan } from '../../store/types';
import { PAYPAL_CUSTOMER } from '../../lib/mock-data';
import { MozillaSubscriptionTypes } from 'fxa-shared/subscriptions/types';
import { Meta } from '@storybook/react';
import { FirstInvoicePreview } from 'fxa-shared/dto/auth/payments/invoice';

export default {
  title: 'components/PaymentConfirmation',
  component: PaymentConfirmation,
} as Meta;

const userProfile: Profile = {
  avatar: 'http://placekitten.com/256/256',
  displayName: 'Foxy77',
  email: 'foxy@firefox.com',
  amrValues: ['amrval'],
  avatarDefault: true,
  locale: 'en',
  twoFactorAuthentication: false,
  uid: 'UIDSTRINGHERE',
  metricsEnabled: true,
};

const selectedPlan: Plan = {
  plan_id: '123doneProMonthly',
  product_id: 'fpnID',
  product_name: 'Firefox Private Network Pro',
  currency: 'usd',
  amount: 935,
  interval: 'month' as const,
  interval_count: 1,
  active: true,
  plan_metadata: null,
  product_metadata: null,
};

const selectedPlanWithMetadata: Plan = {
  ...selectedPlan,
  product_metadata: {
    'product:successActionButtonLabel': 'Do something else',
    'product:successActionButtonLabel:xx-pirate': 'Yarr...',
  },
};

const invoice: FirstInvoicePreview = {
  line_items: [
    {
      id: '123doneProMonthly',
      name: 'Pro level',
      currency: 'USD',
      amount: 735,
      period: {
        start: Date.now() / 1000 - 86400 * 31,
        end: Date.now() / 1000 + 86400 * 31,
      },
    },
  ],
  subtotal: 735,
  subtotal_excluding_tax: null,
  total: 735,
  total_excluding_tax: null,
};

const customer: Customer = {
  billing_name: 'Jane Doe',
  payment_provider: 'stripe',
  payment_type: 'credit',
  last4: '5309',
  exp_month: '02',
  exp_year: '2099',
  brand: 'Visa',
  subscriptions: [
    {
      _subscription_type: MozillaSubscriptionTypes.WEB,
      latest_invoice: '628031D-0002',
      latest_invoice_items: invoice,
      subscription_id: 'sub0.28964929339372136',
      plan_id: '123doneProMonthly',
      product_id: 'prod_123',
      product_name: '123 Done Pro',
      status: 'active',
      cancel_at_period_end: false,
      created: Date.now(),
      current_period_end: Date.now() / 10 + 86400 * 31,
      current_period_start: Date.now() / 1000 - 86400 * 31,
      end_at: null,
      promotion_duration: null,
      promotion_end: null,
    },
  ],
};

const productUrl = 'https://mozilla.org';

const storyWithProps = (
  props: PaymentConfirmationProps,
  languages?: readonly string[]
) => {
  const story = () => (
    <MockApp languages={languages}>
      <PaymentConfirmation {...props} />
    </MockApp>
  );

  return story;
};

export const Default = storyWithProps({
  profile: userProfile,
  selectedPlan: selectedPlan,
  customer: customer,
  productUrl: productUrl,
});

export const CustomActionButtonLabel = storyWithProps({
  profile: userProfile,
  selectedPlan: selectedPlanWithMetadata,
  customer: customer,
  productUrl: productUrl,
});

export const CustomActionButtonLabelWithLocalization = storyWithProps(
  {
    profile: userProfile,
    selectedPlan: selectedPlanWithMetadata,
    customer: customer,
    productUrl: productUrl,
  },
  ['xx-pirate']
);

export const Paypal = storyWithProps({
  profile: userProfile,
  selectedPlan: {
    ...selectedPlan,
    plan_id: 'plan_123',
  },
  customer: PAYPAL_CUSTOMER,
  productUrl: productUrl,
});

export const WithPasswordlessAccount = storyWithProps({
  profile: userProfile,
  selectedPlan: {
    ...selectedPlan,
    plan_id: 'plan_123',
  },
  customer: PAYPAL_CUSTOMER,
  productUrl: productUrl,
  accountExists: false,
});

export const WithInvoicePreview = storyWithProps({
  profile: userProfile,
  selectedPlan: {
    ...selectedPlan,
    plan_id: 'plan_123',
  },
  customer: PAYPAL_CUSTOMER,
  productUrl: productUrl,
  invoice: invoice,
});

export const WithoutOrderDetails = storyWithProps({
  profile: userProfile,
  selectedPlan: {
    ...selectedPlan,
    plan_id: 'other_plan',
  },
  customer: PAYPAL_CUSTOMER,
  productUrl: productUrl,
  invoice: invoice,
});
