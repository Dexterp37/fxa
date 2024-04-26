/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BaseError } from '@fxa/shared/error';

export class StripeError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, {
      cause,
    });
  }
}

export class CustomerDeletedError extends StripeError {
  constructor() {
    super('Customer deleted');
  }
}

export class CustomerNotFoundError extends StripeError {
  constructor() {
    super('Customer not found');
  }
}

export class PlanIntervalMultiplePlansError extends StripeError {
  constructor() {
    super('Interval has mulitple plans');
  }
}

export class PlanNotFoundError extends StripeError {
  constructor() {
    super('Plan not found');
  }
}

export class StripeNoMinimumChargeAmountAvailableError extends StripeError {
  constructor() {
    super('Currency does not have a minimum charge amount available.');
  }
}
