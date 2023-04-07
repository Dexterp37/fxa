import FlowEvent from '../lib/flow-event';

import * as Amplitude from './amplitude';
jest.mock('../lib/flow-event');

jest.mock('./sentry');

beforeEach(() => {
  (FlowEvent.logAmplitudeEvent as jest.Mock).mockClear();
});

it('should call logAmplitudeEvent with the correct event group and type names', () => {
  const testCases: Array<[keyof typeof Amplitude, ...string[][]]> = [
    ['manageSubscriptionsMounted', ['subManage', 'view']],
    ['manageSubscriptionsEngaged', ['subManage', 'engage']],
    ['createSubscriptionMounted', ['subPaySetup', 'view']],
    ['createSubscriptionEngaged', ['subPaySetup', 'engage']],
    ['updateSubscriptionPlanMounted', ['subPaySubChange', 'view']],
    ['updateSubscriptionPlanEngaged', ['subPaySubChange', 'engage']],
    ['updateSubscriptionPlan_PENDING', ['subPaySubChange', 'submit']],
    ['updateSubscriptionPlan_FULFILLED', ['subPaySubChange', 'success']],
    ['updateSubscriptionPlan_REJECTED', ['subPaySubChange', 'fail']],
    ['updatePaymentMounted', ['subPayManage', 'view']],
    ['updatePaymentEngaged', ['subPayManage', 'engage']],
    ['updatePayment_PENDING', ['subPayManage', 'submit']],
    ['updatePayment_FULFILLED', ['subPayManage', 'success']],
    ['updatePayment_REJECTED', ['subPayManage', 'fail']],
    ['cancelSubscriptionMounted', ['subCancel', 'view']],
    ['cancelSubscriptionEngaged', ['subCancel', 'engage']],
    ['cancelSubscription_PENDING', ['subCancel', 'submit']],
    ['cancelSubscription_FULFILLED', ['subCancel', 'success']],
    ['cancelSubscription_REJECTED', ['subCancel', 'fail']],
    ['createAccountMounted', ['subPayAccountSetup', 'view']],
    ['createAccountEngaged', ['subPayAccountSetup', 'engage']],
    ['createAccountSignIn', ['subPayAccountSetup', 'other']],
    ['updateDefaultPaymentMethod_PENDING', ['subPayManage', 'submit']],
    ['updateDefaultPaymentMethod_FULFILLED', ['subPayManage', 'success']],
    ['updateDefaultPaymentMethod_REJECTED', ['subPayManage', 'fail']],
    ['createSubscriptionWithPaymentMethod_PENDING', ['subPaySetup', 'submit']],
    [
      'createSubscriptionWithPaymentMethod_FULFILLED',
      ['subPaySetup', 'success'],
    ],
    ['createSubscriptionWithPaymentMethod_REJECTED', ['subPaySetup', 'fail']],
    ['couponMounted', ['subCoupon', 'view']],
    ['couponEngaged', ['subCoupon', 'engage']],
    ['coupon_PENDING', ['subCoupon', 'submit']],
    ['coupon_FULFILLED', ['subCoupon', 'success']],
    ['coupon_REJECTED', ['subCoupon', 'fail']],
  ];

  for (const [actionType, ...expectedArgs] of testCases) {
    Amplitude[actionType]({});

    for (const args of expectedArgs) {
      expect(FlowEvent.logAmplitudeEvent).toBeCalledWith(...args, {});
    }

    (FlowEvent.logAmplitudeEvent as jest.Mock).mockClear();
  }
});
