/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { MozServices } from '../../../lib/types';
import { Account } from '../../../models';
import {
  mockAppContext,
  MOCK_ACCOUNT,
  createHistoryWithQuery,
  createAppContext,
} from '../../../models/mocks';

import { LinkType } from 'fxa-settings/src/lib/types';
import LinkValidator from '../../../components/LinkValidator';
import { StorageData, UrlQueryData } from '../../../lib/model-data';
import { ReachRouterWindow } from '../../../lib/window';
import { CompleteResetPasswordLink } from '../../../models/reset-password/verification';
import AccountRecoveryConfirmKey from '.';

export const MOCK_SERVICE_NAME = MozServices.FirefoxSync;
export const MOCK_RECOVERY_KEY = 'ARJDF300TFEPRJ7SFYB8QVNVYT60WWS2';
export const MOCK_RESET_TOKEN = 'mockResetToken';
export const MOCK_RECOVERY_KEY_ID = 'mockRecoveryKeyId';
export const MOCK_KB = 'mockkB';

// TODO: combine a lot of mocks with AccountRecoveryResetPassword
const fxDesktopV3ContextParam = { context: 'fx_desktop_v3' };

export const mockCompleteResetPasswordParams = {
  email: MOCK_ACCOUNT.primaryEmail.email,
  emailToHashWith: MOCK_ACCOUNT.primaryEmail.email,
  token: '1111111111111111111111111111111111111111111111111111111111111111',
  code: '11111111111111111111111111111111',
  uid: MOCK_ACCOUNT.uid,
};

export const paramsWithSyncDesktop = {
  ...mockCompleteResetPasswordParams,
  ...fxDesktopV3ContextParam,
};

export const paramsWithMissingEmail = {
  ...mockCompleteResetPasswordParams,
  email: '',
};

export const paramsWithMissingCode = {
  ...mockCompleteResetPasswordParams,
  code: '',
};

export const paramsWithMissingEmailToHashWith = {
  ...mockCompleteResetPasswordParams,
  emailToHashWith: '',
};

export const paramsWithMissingToken = {
  ...mockCompleteResetPasswordParams,
  token: '',
};

export function mockUrlQueryData(
  params: Record<string, string> = mockCompleteResetPasswordParams
) {
  const window = new ReachRouterWindow();
  const data = new UrlQueryData(window);
  for (const param of Object.keys(params)) {
    data.set(param, params[param]);
  }
  return data;
}

class StorageDataMock extends StorageData {
  public override persist(): void {
    // no op
  }
  public override load(): void {
    // no op
  }
  public override set(): void {
    // no op
  }
}

const route = '/account_recovery_confirm_key';
export const getSubject = (
  account: Account,
  params?: Record<string, string>
) => {
  const urlQueryData = mockUrlQueryData(params);
  const history = createHistoryWithQuery(
    route,
    new URLSearchParams(params).toString()
  );
  const windowWrapper = new ReachRouterWindow(history);

  return {
    Subject: () => (
      <LinkValidator
        linkType={LinkType['reset-password']}
        viewName="account-recovery-confirm-key"
        getParamsFromModel={() => {
          return new CompleteResetPasswordLink(urlQueryData);
        }}
      >
        {({ setLinkStatus, params }) => (
          <AccountRecoveryConfirmKey {...{ setLinkStatus, params }} />
        )}
      </LinkValidator>
    ),
    route,
    history,
    appCtx: {
      ...mockAppContext({
        ...createAppContext(history),
        account,
        windowWrapper,
        urlQueryData,
        storageData: new StorageDataMock(windowWrapper),
      }),
    },
  };
};
