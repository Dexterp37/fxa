/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use server';

import { plainToClass } from 'class-transformer';
import { app } from '../nestapp/app';
import {
  CheckoutCartWithStripeActionArgs,
  CheckoutCartWithStripeActionCustomerData,
} from '../nestapp/validators/CheckoutCartWithStripeActionArgs';

export const checkoutCartWithStripe = async (
  cartId: string,
  version: number,
  paymentMethodId: string,
  customerData: CheckoutCartWithStripeActionCustomerData
) => {
  await app.getActionsService().checkoutCartWithStripe(
    plainToClass(CheckoutCartWithStripeActionArgs, {
      cartId,
      version,
      customerData,
      paymentMethodId,
    })
  );
};
