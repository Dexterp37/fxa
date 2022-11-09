/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps, Router } from '@reach/router';
import Head from 'fxa-react/components/Head';
import { ScrollToTop } from '../Settings/ScrollToTop';
import Settings from '../Settings';
import WrapperBeta from '../WrapperBeta';
import { QueryParams } from '../..';

export const App = ({
  flowQueryParams,
}: { flowQueryParams: QueryParams } & RouteComponentProps) => {
  return (
    <>
      <Head />
      <Router basepath={'/'}>
        <ScrollToTop default>
          <Settings path="/settings/*" {...{ flowQueryParams }} />
          <WrapperBeta path="/beta/*" />
        </ScrollToTop>
      </Router>
    </>
  );
};

export default App;
