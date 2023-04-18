/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Meta } from '@storybook/react';
import { withLocalization } from '../../../../.storybook/decorators';
import { LocationProvider } from '@reach/router';
import UnitRowRecoveryKeyV2 from '.';
import { Account, AppContext } from 'fxa-settings/src/models';
import { mockAppContext } from 'fxa-settings/src/models/mocks';

export default {
  title: 'Components/Settings/UnitRowRecoveryKeyV2',
  component: UnitRowRecoveryKeyV2,
  decorators: [withLocalization],
} as Meta;

const accountHasRecoveryKey = {
  hasPassword: true,
  recoveryKey: true,
} as unknown as Account;

const accountWithoutRecoveryKey = {
  hasPassword: true,
  recoveryKey: false,
} as unknown as Account;

const accountWithoutPassword = {
  hasPassword: false,
  recoveryKey: false,
} as unknown as Account;

const storyWithContext = (account: Partial<Account>) => {
  const context = { account: account as Account };

  const story = () => (
    <LocationProvider>
      <AppContext.Provider value={mockAppContext(context)}>
        <UnitRowRecoveryKeyV2 />
      </AppContext.Provider>
    </LocationProvider>
  );
  return story;
};

export const HasAccountRecoveryKey = storyWithContext(accountHasRecoveryKey);

export const NoAccountRecoveryKey = storyWithContext(accountWithoutRecoveryKey);

export const DisabledStateNoPassword = storyWithContext(accountWithoutPassword);
