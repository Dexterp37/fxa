/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ThirdPartyAuthCallback from '.';
import { Meta } from '@storybook/react';
import { withLocalization } from 'fxa-react/lib/storybooks';
import { LocationProvider } from '@reach/router';
import { AppContext } from '../../../models';
import { StorageData } from '../../../lib/model-data';

export default {
  title: 'Pages/ThirdPartyAuthCallback',
  component: ThirdPartyAuthCallback,
  decorators: [withLocalization],
} as Meta;

const storageData = {
  get: () => {},
  set: () => {},
} as unknown as StorageData;

export const Default = () => (
  <AppContext.Provider value={{ storageData }}>
    <LocationProvider>
      <ThirdPartyAuthCallback />
    </LocationProvider>
  </AppContext.Provider>
);
