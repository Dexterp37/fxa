import React from 'react';
import { PaymentErrorView } from './index';
import { SELECTED_PLAN } from '../../lib/mock-data';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Meta } from '@storybook/react';
import AppLocalizationProvider from 'fxa-react/lib/AppLocalizationProvider';

export default {
  title: 'components/PaymentError',
  component: PaymentErrorView,
} as Meta;

const storyWithProps = () => {
  const story = () => (
    <AppLocalizationProvider
      baseDir="./locales"
      userLocales={navigator.languages}
    >
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={
              <PaymentErrorView
                error={{ code: 'general_paypal_error' }}
                actionFn={() => {}}
                plan={SELECTED_PLAN}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AppLocalizationProvider>
  );

  return story;
};

export const Default = storyWithProps();
