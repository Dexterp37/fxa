import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { config as defaultConfig } from '../../../lib/config';
import { AppContext, defaultAppContext } from '../../../lib/AppContext';

import {
  MOCK_PLANS,
  MOCK_PROFILE,
  MOCK_CUSTOMER,
  renderWithLocalizationProvider,
} from '../../../lib/test-utils';

import { SubscriptionSuccess } from './index';

afterEach(cleanup);

function assertRedirectForProduct(
  product_id: string,
  product_name: string,
  expectedUrl: string,
  useFirestoreProductConfigs: boolean = false,
  planConfiguration?: any
) {
  const config = {
    ...defaultConfig,
    env: 'testing',
    productRedirectURLs: {
      '123doneProProduct': 'http://localhost:8080',
    },
    featureFlags: {
      useFirestoreProductConfigs,
    },
  };
  const navigateToUrl = jest.fn();
  const appContextValue = {
    ...defaultAppContext,
    navigateToUrl,
    config,
    navigatorLanguages: ['fr'],
  };
  const selectedPlan = {
    ...MOCK_PLANS[0],
    product_id,
    product_name,
    configuration: planConfiguration,
  };
  const { getByTestId } = renderWithLocalizationProvider(
    <AppContext.Provider value={appContextValue}>
      <SubscriptionSuccess
        {...{
          plan: selectedPlan,
          profile: MOCK_PROFILE,
          customer: MOCK_CUSTOMER,
          isMobile: false,
        }}
      />
    </AppContext.Provider>
  );
  expect(getByTestId('download-link').getAttribute('href')).toEqual(
    expectedUrl
  );
}

describe('SubscriptionSuccess', () => {
  it('performs a redirect to the default URL fo', () => {
    assertRedirectForProduct(
      'beepBoop',
      'bazquux',
      `https://mozilla.org/?email=${encodeURIComponent(MOCK_PROFILE.email)}`
    );
  });

  it('performs a redirect to the expected URL for local product', () => {
    assertRedirectForProduct(
      '123doneProProduct',
      'local',
      `http://localhost:8080/?email=${encodeURIComponent(MOCK_PROFILE.email)}`
    );
  });

  it('performs a redirect to the download URL from product config', () => {
    const configuration = {
      uiContent: {
        subtitle: 'VPN Subtitle',
      },
      urls: {
        successActionButton: 'https://download.default.locale',
      },
    };
    assertRedirectForProduct(
      'beepBoop',
      'bazquux',
      `https://download.default.locale/?email=${encodeURIComponent(
        MOCK_PROFILE.email
      )}`,
      true,
      configuration
    );
  });

  it('performs a redirect to the download URL from product config for locale fr', () => {
    const configuration = {
      uiContent: {
        subtitle: 'VPN Subtitle',
      },
      urls: {
        successActionButton: 'https://download.default.locale',
      },
      locales: {
        fr: {
          urls: {
            successActionButton: 'https://download.default.locale/fr/',
          },
        },
      },
    };
    assertRedirectForProduct(
      'beepBoop',
      'bazquux',
      `https://download.default.locale/fr/?email=${encodeURIComponent(
        MOCK_PROFILE.email
      )}`,
      true,
      configuration
    );
  });

  it('renders the PlanDetails component on mobile', () => {
    const { queryByTestId } = renderWithLocalizationProvider(
      <AppContext.Provider value={defaultAppContext}>
        <SubscriptionSuccess
          {...{
            plan: MOCK_PLANS[0],
            profile: MOCK_PROFILE,
            customer: MOCK_CUSTOMER,
            isMobile: true,
          }}
        />
      </AppContext.Provider>
    );

    const planDetails = queryByTestId('plan-details-component');
    expect(planDetails).toBeVisible();
  });

  it('renders the coupon form component when a coupon is present', () => {
    const { queryByTestId } = renderWithLocalizationProvider(
      <AppContext.Provider value={defaultAppContext}>
        <SubscriptionSuccess
          {...{
            plan: MOCK_PLANS[0],
            profile: MOCK_PROFILE,
            customer: MOCK_CUSTOMER,
            isMobile: true,
            coupon: {
              expired: false,
              promotionCode: 'Test',
              type: 'repeating',
              discountAmount: 10,
              durationInMonths: 1,
              maximallyRedeemed: false,
              valid: true,
            },
          }}
        />
      </AppContext.Provider>
    );

    const couponComponent = queryByTestId('coupon-component');
    expect(couponComponent).toBeVisible();
  });

  it('does not renders the coupon form component when a coupon is not present', () => {
    const { queryByTestId } = renderWithLocalizationProvider(
      <AppContext.Provider value={defaultAppContext}>
        <SubscriptionSuccess
          {...{
            plan: MOCK_PLANS[0],
            profile: MOCK_PROFILE,
            customer: MOCK_CUSTOMER,
            isMobile: true,
          }}
        />
      </AppContext.Provider>
    );

    const couponComponent = queryByTestId('coupon-component');
    expect(couponComponent).not.toBeInTheDocument();
  });
});
