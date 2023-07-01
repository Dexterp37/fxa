import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import PlanErrorDialog from './index';
import { PLANS } from '../../lib/mock-data';
import { FetchState, Plan } from '../../store/types';
import { renderWithLocalizationProvider } from '../../lib/test-utils';

const locationReload = () => {};
const plans: FetchState<Plan[], any> = {
  error: null,
  loading: false,
  result: null,
};

afterEach(cleanup);

describe('PlanErrorDialog', () => {
  it('renders as expected for no plan for product', () => {
    const subject = () => {
      return renderWithLocalizationProvider(
        <PlanErrorDialog
          {...{
            locationReload,
            plans,
          }}
        />
      );
    };
    const { queryByTestId } = subject();
    const errorMessage = queryByTestId('error-loading-plans');
    expect(errorMessage).toBeInTheDocument();
  });

  it('renders as expected for no selectedPlan', () => {
    const subject = () => {
      return renderWithLocalizationProvider(
        <PlanErrorDialog
          {...{
            locationReload,
            plans: { ...plans, result: PLANS },
          }}
        />
      );
    };
    const { queryByTestId, queryByText } = subject();
    const errorMessage = queryByTestId('no-such-plan-error');
    expect(errorMessage).toBeInTheDocument();
    expect(queryByText('Plan not found')).toBeInTheDocument();
  });
});
