/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { faker } from '@faker-js/faker';
import {
  CreatePaypalCustomer,
  ResultPaypalCustomer,
  UpdatePaypalCustomer,
} from './paypalCustomer.types';

import { BillingAgreement, BillingAgreementStatus } from '../paypal.types';

export const ResultPaypalCustomerFactory = (
  override?: Partial<ResultPaypalCustomer>
): ResultPaypalCustomer => ({
  uid: faker.string.hexadecimal({
    length: 32,
    prefix: '',
    casing: 'lower',
  }),
  billingAgreementId: faker.string.hexadecimal({
    length: 10,
    prefix: '',
  }),
  status: 'active',
  createdAt: faker.date.recent().getTime(),
  endedAt: null,
  ...override,
});

export const CreatePaypalCustomerFactory = (
  override?: Partial<CreatePaypalCustomer>
): CreatePaypalCustomer => ({
  uid: faker.string.hexadecimal({
    length: 32,
    prefix: '',
    casing: 'lower',
  }),
  billingAgreementId: faker.string.hexadecimal({
    length: 10,
    prefix: '',
  }),
  status: 'active',
  endedAt: null,
  ...override,
});

export const UpdatePaypalCustomerFactory = (
  override?: Partial<UpdatePaypalCustomer>
): UpdatePaypalCustomer => ({
  billingAgreementId: faker.string.hexadecimal({
    length: 10,
    prefix: '',
  }),
  status: 'active',
  endedAt: null,
  ...override,
});

export const BillingAgreementFactory = (
  override?: Partial<BillingAgreement>
): BillingAgreement => ({
  city: faker.location.city(),
  countryCode: faker.location.countryCode(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  state: faker.location.state(),
  status: BillingAgreementStatus.Active,
  street: faker.location.streetAddress(),
  street2: faker.location.streetAddress(),
  zip: faker.location.zipCode(),
  ...override,
});
