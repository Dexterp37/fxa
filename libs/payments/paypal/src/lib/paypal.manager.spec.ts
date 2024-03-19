import { faker } from '@faker-js/faker';
import { Kysely } from 'kysely';

import { DB, testAccountDatabaseSetup } from '@fxa/shared/db/mysql/account';

import { NVPSetExpressCheckoutResponseFactory } from './factories';
import { PayPalClient } from './paypal.client';
import { PayPalManager } from './paypal.manager';
import { PaypalCustomerManager } from './paypalCustomer/paypalCustomer.manager';

describe('PaypalManager', () => {
  let kyselyDb: Kysely<DB>;
  let paypalClient: PayPalClient;
  let paypalManager: PayPalManager;
  let paypalCustomerManager: PaypalCustomerManager;

  beforeAll(async () => {
    kyselyDb = await testAccountDatabaseSetup([
      'paypalCustomers',
      'accountCustomers',
    ]);

    paypalClient = new PayPalClient({
      sandbox: false,
      user: faker.string.uuid(),
      pwd: faker.string.uuid(),
      signature: faker.string.uuid(),
    });

    paypalCustomerManager = new PaypalCustomerManager(kyselyDb);

    paypalManager = new PayPalManager(paypalClient, paypalCustomerManager);
  });

  afterAll(async () => {
    if (kyselyDb) {
      await kyselyDb.destroy();
    }
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
});
