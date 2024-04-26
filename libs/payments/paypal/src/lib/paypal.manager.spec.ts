/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';

import {
  StripeApiListFactory,
  StripeCustomerFactory,
  StripeInvoiceFactory,
  StripeManager,
  StripeResponseFactory,
  StripeSubscription,
  StripeSubscriptionFactory,
} from '@fxa/payments/stripe';
import {
  AccountDbProvider,
  MockAccountDatabaseNestFactory,
} from '@fxa/shared/db/mysql/account';

import {
  NVPCreateBillingAgreementResponseFactory,
  NVPBAUpdateTransactionResponseFactory,
  NVPSetExpressCheckoutResponseFactory,
} from './factories';
import { PayPalClient } from './paypal.client';
import { PayPalManager } from './paypal.manager';
import { BillingAgreementStatus } from './paypal.types';
import {
  AmountExceedsPayPalCharLimitError,
  PaypalManagerError,
} from './paypal.error';
import { PaypalCustomerMultipleRecordsError } from './paypalCustomer/paypalCustomer.error';
import { ResultPaypalCustomerFactory } from './paypalCustomer/paypalCustomer.factories';
import { PaypalCustomerManager } from './paypalCustomer/paypalCustomer.manager';

describe('PayPalManager', () => {
  let paypalManager: PayPalManager;
  let paypalClient: PayPalClient;
  let stripeManager: StripeManager;
  let paypalCustomerManager: PaypalCustomerManager;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PayPalManager,
        {
          provide: AccountDbProvider,
          useValue: MockAccountDatabaseNestFactory,
        },
        PayPalClient,
        StripeManager,
        PaypalCustomerManager,
      ],
    })
      .overrideProvider(PayPalClient)
      .useValue({
        createBillingAgreement: jest.fn(),
        baUpdate: jest.fn(),
        setExpressCheckout: jest.fn(),
      })
      .overrideProvider(StripeManager)
      .useValue({
        getMinimumAmount: jest.fn(),
        getSubscriptions: jest.fn(),
        finalizeInvoiceWithoutAutoAdvance: jest.fn(),
        fetchActiveCustomer: jest.fn(),
      })
      .overrideProvider(PaypalCustomerManager)
      .useValue({
        createPaypalCustomer: jest.fn(),
        fetchPaypalCustomersByUid: jest.fn(),
      })
      .compile();

    paypalManager = moduleRef.get(PayPalManager);
    paypalClient = moduleRef.get(PayPalClient);
    stripeManager = moduleRef.get(StripeManager);
    paypalCustomerManager = moduleRef.get(PaypalCustomerManager);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrCreateBillingAgreementId', () => {
    it('returns without creating if there is an existing billing agreement', async () => {
      const uid = faker.string.uuid();
      const token = faker.string.uuid();
      const mockNewBillingAgreement = NVPBAUpdateTransactionResponseFactory();
      const mockPayPalCustomer = ResultPaypalCustomerFactory();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValueOnce([mockPayPalCustomer]);

      paypalClient.createBillingAgreement = jest
        .fn()
        .mockResolvedValueOnce(mockNewBillingAgreement);

      const result = await paypalManager.getOrCreateBillingAgreementId(
        uid,
        false,
        token
      );
      expect(result).toEqual(mockPayPalCustomer.billingAgreementId);
      expect(paypalClient.createBillingAgreement).not.toBeCalled();
    });

    it('returns a new billing agreement when no billing agreement exists and token passed', async () => {
      const uid = faker.string.uuid();
      const token = faker.string.uuid();
      const mockBillingAgreementId = faker.string.uuid();

      paypalManager.getCustomerBillingAgreementId = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      paypalManager.createBillingAgreement = jest
        .fn()
        .mockResolvedValueOnce(mockBillingAgreementId);

      const result = await paypalManager.getOrCreateBillingAgreementId(
        uid,
        false,
        token
      );
      expect(result).toEqual(mockBillingAgreementId);
      expect(paypalManager.createBillingAgreement).toBeCalledWith(uid, token);
    });

    it('throws an error if no billing agreement id is present and user has subscriptions', async () => {
      const uid = faker.string.uuid();
      const token = faker.string.uuid();
      const mockNewBillingAgreement = NVPBAUpdateTransactionResponseFactory();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValueOnce([]);

      paypalClient.createBillingAgreement = jest
        .fn()
        .mockResolvedValueOnce(mockNewBillingAgreement);

      expect(
        paypalManager.getOrCreateBillingAgreementId(uid, true, token)
      ).rejects.toBeInstanceOf(PaypalManagerError);
      expect(paypalClient.createBillingAgreement).not.toBeCalled();
    });

    it('throws an error if no billing agreement id is present and token is not provided', async () => {
      const uid = faker.string.uuid();
      const mockNewBillingAgreement = NVPBAUpdateTransactionResponseFactory();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValueOnce([]);

      paypalClient.createBillingAgreement = jest
        .fn()
        .mockResolvedValueOnce(mockNewBillingAgreement);

      expect(
        paypalManager.getOrCreateBillingAgreementId(uid, false)
      ).rejects.toBeInstanceOf(PaypalManagerError);
      expect(paypalClient.createBillingAgreement).not.toBeCalled();
    });
  });

  describe('cancelBillingAgreement', () => {
    it('cancels a billing agreement', async () => {
      const billingAgreementId = faker.string.sample();

      jest
        .spyOn(paypalClient, 'baUpdate')
        .mockResolvedValueOnce(NVPBAUpdateTransactionResponseFactory());

      const result = await paypalManager.cancelBillingAgreement(
        billingAgreementId
      );

      expect(result).toBeUndefined();
      expect(paypalClient.baUpdate).toBeCalledWith({
        billingAgreementId,
        cancel: true,
      });
    });

    it('throws an error', async () => {
      const billingAgreementId = faker.string.sample();

      jest.spyOn(paypalClient, 'baUpdate').mockRejectedValue(new Error('Boom'));

      expect(() =>
        paypalManager.cancelBillingAgreement(billingAgreementId)
      ).rejects.toThrowError();
    });
  });

  describe('createBillingAgreement', () => {
    it('creates a billing agreement', async () => {
      const uid = faker.string.uuid();
      const token = faker.string.uuid();

      const billingAgreement = NVPCreateBillingAgreementResponseFactory();
      const paypalCustomer = ResultPaypalCustomerFactory();

      jest
        .spyOn(paypalClient, 'createBillingAgreement')
        .mockResolvedValue(billingAgreement);

      jest
        .spyOn(paypalCustomerManager, 'createPaypalCustomer')
        .mockResolvedValue(paypalCustomer);

      const result = await paypalManager.createBillingAgreement(uid, token);

      expect(paypalClient.createBillingAgreement).toHaveBeenCalledWith({
        token,
      });

      expect(paypalCustomerManager.createPaypalCustomer).toHaveBeenCalledWith({
        uid: uid,
        billingAgreementId: billingAgreement.BILLINGAGREEMENTID,
        status: 'active',
        endedAt: null,
      });

      expect(result).toEqual(paypalCustomer.billingAgreementId);
    });

    it('throws an error', async () => {
      expect(paypalManager.createBillingAgreement).rejects.toThrowError();
    });
  });

  describe('getBillingAgreement', () => {
    it('returns agreement details (active status)', async () => {
      const nvpBillingAgreementMock = NVPBAUpdateTransactionResponseFactory();
      const billingAgreementId = faker.string.sample();

      const baUpdateMock = jest
        .spyOn(paypalClient, 'baUpdate')
        .mockResolvedValue(nvpBillingAgreementMock);

      const result = await paypalManager.getBillingAgreement(
        billingAgreementId
      );
      expect(result).toEqual({
        city: nvpBillingAgreementMock.CITY,
        countryCode: nvpBillingAgreementMock.COUNTRYCODE,
        firstName: nvpBillingAgreementMock.FIRSTNAME,
        lastName: nvpBillingAgreementMock.LASTNAME,
        state: nvpBillingAgreementMock.STATE,
        status: BillingAgreementStatus.Active,
        street: nvpBillingAgreementMock.STREET,
        street2: nvpBillingAgreementMock.STREET2,
        zip: nvpBillingAgreementMock.ZIP,
      });
      expect(baUpdateMock).toBeCalledTimes(1);
      expect(baUpdateMock).toBeCalledWith({ billingAgreementId });
    });

    it('returns agreement details (cancelled status)', async () => {
      const billingAgreementId = faker.string.sample();
      const nvpBillingAgreementMock = NVPBAUpdateTransactionResponseFactory({
        BILLINGAGREEMENTSTATUS: 'Canceled',
      });

      const baUpdateMock = jest
        .spyOn(paypalClient, 'baUpdate')
        .mockResolvedValue(nvpBillingAgreementMock);

      const result = await paypalManager.getBillingAgreement(
        billingAgreementId
      );
      expect(result).toEqual({
        city: nvpBillingAgreementMock.CITY,
        countryCode: nvpBillingAgreementMock.COUNTRYCODE,
        firstName: nvpBillingAgreementMock.FIRSTNAME,
        lastName: nvpBillingAgreementMock.LASTNAME,
        state: nvpBillingAgreementMock.STATE,
        status: BillingAgreementStatus.Cancelled,
        street: nvpBillingAgreementMock.STREET,
        street2: nvpBillingAgreementMock.STREET2,
        zip: nvpBillingAgreementMock.ZIP,
      });
      expect(baUpdateMock).toBeCalledTimes(1);
      expect(baUpdateMock).toBeCalledWith({ billingAgreementId });
    });
  });

  describe('getCustomerBillingAgreementId', () => {
    it("returns the customer's current PayPal billing agreement ID", async () => {
      const uid = faker.string.uuid();
      const mockPayPalCustomer = ResultPaypalCustomerFactory();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValue([mockPayPalCustomer]);

      const result = await paypalManager.getCustomerBillingAgreementId(uid);
      expect(result).toEqual(mockPayPalCustomer.billingAgreementId);
    });

    it('returns undefined if no PayPal customer record', async () => {
      const uid = faker.string.uuid();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValue([]);

      const result = await paypalManager.getCustomerBillingAgreementId(uid);
      expect(result).toEqual(undefined);
    });

    it('throws PaypalCustomerMultipleRecordsError if more than one PayPal customer found', async () => {
      const uid = faker.string.uuid();
      const mockPayPalCustomer1 = ResultPaypalCustomerFactory();
      const mockPayPalCustomer2 = ResultPaypalCustomerFactory();

      paypalCustomerManager.fetchPaypalCustomersByUid = jest
        .fn()
        .mockResolvedValue([mockPayPalCustomer1, mockPayPalCustomer2]);

      expect(
        paypalManager.getCustomerBillingAgreementId(uid)
      ).rejects.toBeInstanceOf(PaypalCustomerMultipleRecordsError);
    });
  });

  describe('getCustomerPayPalSubscriptions', () => {
    it('return customer subscriptions where collection method is send_invoice', async () => {
      const mockPayPalSubscription = StripeSubscriptionFactory({
        collection_method: 'send_invoice',
        status: 'active',
      });

      const mockSubscriptionList = StripeApiListFactory([
        mockPayPalSubscription,
      ]);

      const mockCustomer = StripeCustomerFactory();

      const expected = [mockPayPalSubscription];

      stripeManager.getSubscriptions = jest
        .fn()
        .mockResolvedValueOnce(mockSubscriptionList);

      const result = await paypalManager.getCustomerPayPalSubscriptions(
        mockCustomer.id
      );
      expect(result).toEqual(expected);
    });
  });

  it('returns empty array when no subscriptions', async () => {
    const mockCustomer = StripeCustomerFactory();
    const mockPayPalSubscription = [] as StripeSubscription[];
    const mockSubscriptionList = StripeApiListFactory([mockPayPalSubscription]);

    stripeManager.getSubscriptions = jest
      .fn()
      .mockResolvedValueOnce(mockSubscriptionList);

    const result = await paypalManager.getCustomerPayPalSubscriptions(
      mockCustomer.id
    );
    expect(result).toEqual([]);
  });

  describe('getCheckoutToken', () => {
    it('returns token and calls setExpressCheckout with passed options', async () => {
      const currencyCode = faker.finance.currencyCode();
      const token = faker.string.uuid();
      const successfulSetExpressCheckoutResponse =
        NVPSetExpressCheckoutResponseFactory({
          TOKEN: token,
        });

      paypalClient.setExpressCheckout = jest
        .fn()
        .mockResolvedValueOnce(successfulSetExpressCheckoutResponse);

      const result = await paypalManager.getCheckoutToken(currencyCode);

      expect(result).toEqual(successfulSetExpressCheckoutResponse.TOKEN);
      expect(paypalClient.setExpressCheckout).toBeCalledTimes(1);
      expect(paypalClient.setExpressCheckout).toBeCalledWith({ currencyCode });
    });
  });

  describe('processZeroInvoice', () => {
    it('finalizes invoices with no amount set to zero', async () => {
      const mockInvoice = StripeInvoiceFactory();

      stripeManager.finalizeInvoiceWithoutAutoAdvance = jest
        .fn()
        .mockResolvedValueOnce({});

      const result = await paypalManager.processZeroInvoice(mockInvoice.id);

      expect(result).toEqual({});
      expect(stripeManager.finalizeInvoiceWithoutAutoAdvance).toBeCalledWith(
        mockInvoice.id
      );
    });
  });

  describe('processInvoice', () => {
    it('calls processZeroInvoice when amount is less than minimum amount', async () => {
      const mockInvoice = StripeResponseFactory(
        StripeInvoiceFactory({
          amount_due: 0,
          currency: 'usd',
        })
      );

      jest.spyOn(stripeManager, 'getMinimumAmount').mockReturnValue(10);
      jest
        .spyOn(paypalManager, 'processZeroInvoice')
        .mockResolvedValue(mockInvoice);
      jest.spyOn(paypalManager, 'processNonZeroInvoice').mockResolvedValue();

      await paypalManager.processInvoice(mockInvoice);
      expect(paypalManager.processZeroInvoice).toBeCalledWith(mockInvoice.id);
      expect(paypalManager.processNonZeroInvoice).not.toHaveBeenCalled();
    });

    it('calls PayPalManager processNonZeroInvoice when amount is greater than minimum amount', async () => {
      const mockCustomer = StripeResponseFactory(StripeCustomerFactory());
      const mockInvoice = StripeInvoiceFactory({
        amount_due: 50,
        currency: 'usd',
      });

      jest.spyOn(stripeManager, 'getMinimumAmount').mockReturnValue(10);
      jest
        .spyOn(stripeManager, 'fetchActiveCustomer')
        .mockResolvedValue(mockCustomer);
      jest
        .spyOn(paypalManager, 'processZeroInvoice')
        .mockResolvedValue(StripeResponseFactory(mockInvoice));
      jest.spyOn(paypalManager, 'processNonZeroInvoice').mockResolvedValue();

      await paypalManager.processInvoice(mockInvoice);

      expect(paypalManager.processNonZeroInvoice).toBeCalledWith(
        mockCustomer,
        mockInvoice
      );
      expect(paypalManager.processZeroInvoice).not.toHaveBeenCalled();
    });
  });

  describe('getPayPalAmountStringFromAmountInCents', () => {
    it('returns correctly formatted string', () => {
      const amountInCents = 9999999999;
      const expectedResult = (amountInCents / 100).toFixed(2);

      const result =
        paypalManager.getPayPalAmountStringFromAmountInCents(amountInCents);

      expect(result).toEqual(expectedResult);
    });

    it('throws an error if number exceeds digit limit', () => {
      const amountInCents = 12345678910;

      expect(() => {
        paypalManager.getPayPalAmountStringFromAmountInCents(amountInCents);
      }).toThrow(AmountExceedsPayPalCharLimitError);
    });
  });
});
