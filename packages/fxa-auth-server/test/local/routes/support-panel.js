/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const chai = require('chai');
const mocks = require('../../mocks');
const sinon = require('sinon');
const uuid = require('uuid');
const { getRoute } = require('../../routes_helpers');
const { supportPanelRoutes } = require('../../../lib/routes/support-panel');
const { MozillaSubscriptionTypes } = require('fxa-shared/subscriptions/types');
const { OAUTH_SCOPE_SUBSCRIPTIONS } = require('fxa-shared/oauth/constants');

const assert = { ...sinon.assert, ...chai.assert };
const sandbox = sinon.createSandbox();
const UID = uuid.v4({}, Buffer.alloc(16)).toString('hex');
const TEST_EMAIL = 'testo@example.gg';
const ACCOUNT_LOCALE = 'en-US';
const MOCK_SCOPES = ['profile:email', OAUTH_SCOPE_SUBSCRIPTIONS];
const VALID_REQUEST = {
  auth: {
    credentials: {
      scope: MOCK_SCOPES,
      user: `${UID}`,
      email: `${TEST_EMAIL}`,
    },
  },
  query: {
    uid: `${UID}`,
  },
};
const mockConfig = {
  subscriptions: { enabled: true },
};
const mockCustomer = { id: 'cus_testo', subscriptions: { data: {} } };
const mockFormattedWebSubscription = {
  created: 1588972390,
  current_period_end: 1591650790,
  current_period_start: 1588972390,
  plan_changed: null,
  previous_product: null,
  product_name: 'Amazing Product',
  status: 'active',
  subscription_id: 'sub_12345',
};
const mockPlayStoreSubscriptionPurchase = {
  kind: 'androidpublisher#subscriptionPurchase',
  startTimeMillis: `${Date.now() - 10000}`,
  expiryTimeMillis: `${Date.now() + 10000}`,
  autoRenewing: true,
  priceCurrencyCode: 'JPY',
  priceAmountMicros: '99000000',
  countryCode: 'JP',
  developerPayload: '',
  paymentState: 1,
  orderId: 'GPA.3313-5503-3858-32549',
  packageName: 'testPackage',
  purchaseToken: 'testToken',
  sku: 'sku',
  verifiedAt: Date.now(),
  isEntitlementActive: sinon.fake.returns(true),
};

const mockAppStoreSubscriptionPurchase = {
  productId: 'wow',
  autoRenewing: false,
  bundleId: 'hmm',
  isEntitlementActive: sinon.fake.returns(true),
};

const mockExtraStripeInfo = {
  price_id: 'price_lol',
  product_id: 'prod_lol',
  product_name: 'LOL Product',
};

const mockAppendedPlayStoreSubscriptionPurchase = {
  ...mockPlayStoreSubscriptionPurchase,
  ...mockExtraStripeInfo,
  _subscription_type: MozillaSubscriptionTypes.IAP_GOOGLE,
};

const mockAppendedAppStoreSubscriptionPurchase = {
  ...mockAppStoreSubscriptionPurchase,
  ...mockExtraStripeInfo,
  _subscription_type: MozillaSubscriptionTypes.IAP_APPLE,
};

const mockFormattedPlayStoreSubscription = {
  auto_renewing: mockPlayStoreSubscriptionPurchase.autoRenewing,
  expiry_time_millis: mockPlayStoreSubscriptionPurchase.expiryTimeMillis,
  package_name: mockPlayStoreSubscriptionPurchase.packageName,
  sku: mockPlayStoreSubscriptionPurchase.sku,
  ...mockExtraStripeInfo,
  _subscription_type: MozillaSubscriptionTypes.IAP_GOOGLE,
};

const mockFormattedAppStoreSubscription = {
  app_store_product_id: mockAppStoreSubscriptionPurchase.productId,
  auto_renewing: mockAppStoreSubscriptionPurchase.autoRenewing,
  bundle_id: mockAppStoreSubscriptionPurchase.bundleId,
  ...mockExtraStripeInfo,
  _subscription_type: MozillaSubscriptionTypes.IAP_APPLE,
};

const log = mocks.mockLog();
const db = mocks.mockDB({
  uid: UID,
  email: TEST_EMAIL,
  locale: ACCOUNT_LOCALE,
});
let stripeHelper;

describe('support-panel', () => {
  beforeEach(() => {
    stripeHelper = {
      addPriceInfoToIapPurchases: sandbox
        .stub()
        .resolves([
          mockAppendedPlayStoreSubscriptionPurchase,
          mockAppendedAppStoreSubscriptionPurchase,
        ]),
      fetchCustomer: sandbox.stub().resolves(mockCustomer),
      formatSubscriptionsForSupport: sandbox
        .stub()
        .resolves([mockFormattedWebSubscription]),
    };
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('GET /oauth/support-panel/subscriptions', () => {
    it('returns an empty list of routes when subscriptions is disabled', () => {
      const routes = supportPanelRoutes({
        log,
        db,
        config: { subscriptions: { enabled: false } },
        stripeHelper,
      });
      assert.deepEqual(routes, []);
    });

    it('gets the expected subscriptions', async () => {
      const playSubscriptions = {
        getSubscriptions: sandbox
          .stub()
          .resolves([mockAppendedPlayStoreSubscriptionPurchase]),
      };
      const appStoreSubscriptions = {
        getSubscriptions: sandbox
          .stub()
          .resolves([mockAppendedAppStoreSubscriptionPurchase]),
      };
      const routes = supportPanelRoutes({
        log,
        db,
        config: mockConfig,
        stripeHelper,
        playSubscriptions,
        appStoreSubscriptions,
      });
      const route = getRoute(
        routes,
        '/oauth/support-panel/subscriptions',
        'GET'
      );
      const request = mocks.mockRequest(VALID_REQUEST);
      const resp = await route.handler(request);

      assert.deepEqual(resp, {
        [MozillaSubscriptionTypes.WEB]: [mockFormattedWebSubscription],
        [MozillaSubscriptionTypes.IAP_GOOGLE]: [
          mockFormattedPlayStoreSubscription,
        ],
        [MozillaSubscriptionTypes.IAP_APPLE]: [
          mockFormattedAppStoreSubscription,
        ],
      });
      assert.calledOnceWithExactly(stripeHelper.fetchCustomer, UID);
      assert.calledOnceWithExactly(
        stripeHelper.formatSubscriptionsForSupport,
        mockCustomer.subscriptions
      );
    });
  });
});
