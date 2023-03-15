/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { mockAppContext } from '../../../models/mocks';
import { AppContext, Account } from '../../../models';
import CompleteResetPassword from '.';
import { logPageViewEvent } from '../../../lib/metrics';
import { REACT_ENTRYPOINT, SHOW_BALLOON_TIMEOUT } from '../../../constants';
import { LocationProvider } from '@reach/router';
import { getSearchWithParams } from '../../../lib/test-utils';
// import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';

const PASSWORD = 'passwordzxcv';

jest.mock('../../../lib/metrics', () => ({
  logViewEvent: jest.fn(),
  logPageViewEvent: jest.fn(),
}));

type ParamValue = string | null;

let account: Account;
let mockToken: ParamValue,
  mockCode: ParamValue,
  mockEmail: ParamValue,
  mockPasswordHash: ParamValue,
  lostRecoveryKey: boolean;
const mockNavigate = jest.fn();

const mockLocation = () => {
  const search = getSearchWithParams({
    mockToken,
    mockCode,
    mockEmail,
    mockPasswordHash,
  });
  return {
    href: `http://localhost.com/${search}`,
    search,
    state: {
      lostRecoveryKey,
    },
  };
};

jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

function renderWithAccount(account: Account) {
  render(
    <AppContext.Provider value={mockAppContext({ account })}>
      <LocationProvider>
        <CompleteResetPassword />
      </LocationProvider>
    </AppContext.Provider>
  );
}

describe('CompleteResetPassword page', () => {
  // TODO: enable l10n tests when they've been updated to handle embedded tags in ftl strings
  // TODO: in FXA-6461
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });
  beforeEach(() => {
    mockCode = 'code';
    mockToken = 'token';
    mockEmail = 'boo@boo.boo';
    mockPasswordHash = 'hash';
    lostRecoveryKey = false;

    account = {
      resetPasswordStatus: jest.fn().mockResolvedValue(true),
      completeResetPassword: jest.fn().mockResolvedValue(true),
      hasRecoveryKey: jest.fn().mockResolvedValue(false),
    } as unknown as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component as expected', () => {
    renderWithAccount(account);
    // testAllL10n(screen, bundle);

    screen.getByRole('heading', {
      name: 'Create new password',
    });
    screen.getByLabelText('New password');
    screen.getByLabelText('Re-enter password');
    screen.getByRole('button', { name: 'Reset password' });
    screen.getByRole('link', {
      name: 'Remember your password? Sign in',
    });
  });

  it('displays password requirements when the new password field is in focus', async () => {
    renderWithAccount(account);

    const newPasswordField = screen.getByTestId('new-password-input-field');

    expect(screen.queryByText('Password requirements')).not.toBeInTheDocument();

    fireEvent.focus(newPasswordField);
    await waitFor(
      () => {
        expect(screen.getByText('Password requirements')).toBeVisible();
      },
      {
        timeout: SHOW_BALLOON_TIMEOUT,
      }
    );
  });

  it('renders the component as expected when provided with an expired link', async () => {
    account = {
      resetPasswordStatus: jest.fn().mockResolvedValue(false),
    } as unknown as Account;

    renderWithAccount(account);

    await screen.findByRole('heading', {
      name: 'Reset password link expired',
    });
    screen.getByText('The link you clicked to reset your password is expired.');
    screen.getByRole('button', {
      name: 'Receive new link',
    });
  });

  describe('renders the component as expected when provided with a damaged link', () => {
    it('with missing token', async () => {
      mockToken = null;
      renderWithAccount(account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
      screen.getByText(
        'The link you clicked was missing characters, and may have been broken by your email client. Copy the address carefully, and try again.'
      );
    });
    it('with missing code', async () => {
      mockCode = null;
      renderWithAccount(account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
    it('with missing email', async () => {
      mockEmail = null;
      renderWithAccount(account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
    it('with missing emailToHashWith', async () => {
      mockPasswordHash = null;
      renderWithAccount(account);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
  });

  // TODO : check for metrics event when link is expired or damaged
  it('emits the expected metrics on render', () => {
    renderWithAccount(account);

    expect(logPageViewEvent).toHaveBeenCalledWith(
      'complete-reset-password',
      REACT_ENTRYPOINT
    );
  });

  describe('errors', () => {
    it('displays "problem setting your password" error', async () => {
      account = {
        hasRecoveryKey: jest.fn().mockResolvedValue(false),
        resetPasswordStatus: jest.fn().mockResolvedValue(true),
        completeResetPassword: jest
          .fn()
          .mockRejectedValue(new Error('Request failed')),
      } as unknown as Account;

      renderWithAccount(account);

      fireEvent.input(screen.getByTestId('new-password-input-field'), {
        target: { value: PASSWORD },
      });

      fireEvent.input(screen.getByTestId('verify-password-input-field'), {
        target: { value: PASSWORD },
      });

      fireEvent.click(screen.getByText('Reset password'));

      await screen.findByText(
        'Sorry, there was a problem setting your password'
      );
    });

    it('displays account recovery key check error', async () => {
      account = {
        resetPasswordStatus: jest.fn().mockResolvedValue(true),
        hasRecoveryKey: jest
          .fn()
          .mockRejectedValue(new Error('Request failed')),
      } as unknown as Account;

      renderWithAccount(account);

      await screen.findByText(
        'Sorry, there was a problem checking if you have an account recovery key.',
        { exact: false }
      );
      expect(
        screen.queryByRole('link', {
          name: 'Reset your password with your account recovery key.',
        })
      ).toHaveAttribute(
        'href',
        `/account_recovery_confirm_key${getSearchWithParams({
          mockToken,
          mockCode,
          mockEmail,
          mockPasswordHash,
        })}`
      );
    });
  });

  describe('account has recovery key', () => {
    account = {
      resetPasswordStatus: jest.fn().mockResolvedValue(true),
      completeResetPassword: jest.fn().mockResolvedValue(true),
      hasRecoveryKey: jest.fn().mockResolvedValue(true),
    } as unknown as Account;

    it('redirects as expected', () => {
      account = {
        resetPasswordStatus: jest.fn().mockResolvedValue(true),
        completeResetPassword: jest.fn().mockResolvedValue(true),
        hasRecoveryKey: jest.fn().mockResolvedValue(true),
      } as unknown as Account;

      renderWithAccount(account);

      expect(account.hasRecoveryKey).toHaveBeenCalledWith(mockEmail);

      // TODO: y u no pass?
      // expect(mockNavigate).toHaveBeenCalledWith(
      //   `/account_recovery_confirm_key${getSearch({
      //     mockToken,
      //     mockCode,
      //     mockEmail,
      //     mockPasswordHash,
      //   })}`,
      //   {
      //     replace: true,
      //   }
      // );
    });

    it('does not check or redirect when state has lostRecoveryKey', () => {
      lostRecoveryKey = true;
      renderWithAccount(account);

      expect(account.hasRecoveryKey).not.toHaveBeenCalled();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('can submit', async () => {
    renderWithAccount(account);

    fireEvent.input(screen.getByTestId('new-password-input-field'), {
      target: { value: PASSWORD },
    });

    fireEvent.input(screen.getByTestId('verify-password-input-field'), {
      target: { value: PASSWORD },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Reset password'));
    });

    expect(account.completeResetPassword).toHaveBeenCalledWith(
      mockToken,
      mockCode,
      mockEmail,
      PASSWORD
    );
    expect(mockNavigate).toHaveBeenCalledWith('/reset_password_verified', {
      replace: true,
    });
  });
});
