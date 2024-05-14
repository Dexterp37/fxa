/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../lib/fixtures/standard';

const makeUid = () =>
  [...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

test.describe('severity-1 #smoke', () => {
  test.describe('Desktop Sync V3 force auth', () => {
    test.beforeEach(async () => {
      test.slow();
    });

    test('sync v3 with a registered email, no uid', async ({
      pages: { configPage },
      syncBrowserPages: {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signInRoutes === true,
        'force_auth is no longer supported for signin with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();

      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        uid: undefined,
      });
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with a registered email, registered uid', async ({
      pages: { configPage },
      syncBrowserPages: {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signInRoutes === true,
        'force_auth is no longer supported for signin with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();

      await fxDesktopV3ForceAuth.open(credentials);
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with a registered email, unregistered uid', async ({
      pages: { configPage },
      syncBrowserPages: {
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        signinTokenCode,
      },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signInRoutes === true,
        'force_auth is no longer supported for signin with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();
      const uid = makeUid();
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        uid,
      });
      await fxDesktopV3ForceAuth.noSuchWebChannelMessage('fxaccounts:logout');
      await login.setPassword(credentials.password);
      await login.submit();
      await expect(signinTokenCode.tokenCodeHeader).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.fillOutSignInCode(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with an unregistered email, no uid', async ({
      pages: { configPage },
      syncBrowserPages: { fxDesktopV3ForceAuth, login },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();
      const email = testAccountTracker.generateSyncEmail();

      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
        uid: undefined,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      await expect(emailInput).toBeDisabled();
      expect(await (await login.getUseDifferentAccountLink()).count()).toEqual(
        0
      );
      await login.fillOutFirstSignUp(email, credentials.password, {
        enterEmail: false,
      });
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');
    });

    test('sync v3 with an unregistered email, registered uid', async ({
      pages: { configPage },
      syncBrowserPages: { fxDesktopV3ForceAuth, login },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();
      const email = testAccountTracker.generateSyncEmail();

      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      await expect(emailInput).toBeDisabled();
      expect(await (await login.getUseDifferentAccountLink()).count()).toEqual(
        0
      );
    });

    test('sync v3 with an unregistered email, unregistered uid', async ({
      pages: { configPage },
      syncBrowserPages: { fxDesktopV3ForceAuth, login },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signUpRoutes === true,
        'force_auth is no longer supported for signup with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpSync();
      const email = testAccountTracker.generateSyncEmail();
      const uid = makeUid();
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        email,
        uid,
      });
      const error = await login.signInError();
      expect(error).toContain('Recreate');
      const emailInputValue = await login.getEmailInput();
      expect(emailInputValue).toBe(email);
      const emailInput = await login.getEmailInputElement();
      await expect(emailInput).toBeDisabled();
      expect(await (await login.getUseDifferentAccountLink()).count()).toEqual(
        0
      );
    });

    test('blocked with an registered email, unregistered uid', async ({
      pages: { configPage },
      syncBrowserPages: {
        page,
        fxDesktopV3ForceAuth,
        login,
        connectAnotherDevice,
        settings,
        deleteAccount,
      },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.skip(
        config.showReactApp.signInRoutes === true,
        'force_auth is no longer supported for signin with react, FXA-9410'
      );

      const credentials = await testAccountTracker.signUpBlocked();
      const uid = makeUid();
      await fxDesktopV3ForceAuth.openWithReplacementParams(credentials, {
        uid,
      });
      await fxDesktopV3ForceAuth.noSuchWebChannelMessage('fxaccounts:logout');
      await login.setPassword(credentials.password);
      await login.submit();
      await fxDesktopV3ForceAuth.checkWebChannelMessage(
        'fxaccounts:can_link_account'
      );
      await login.unblock(credentials.email);
      await expect(connectAnotherDevice.fxaConnected).toBeVisible();
      await fxDesktopV3ForceAuth.checkWebChannelMessage('fxaccounts:login');

      // Delete account, required before teardown
      await settings.goto();
      await settings.deleteAccountButton.click();
      await deleteAccount.deleteAccount(credentials.password);

      await expect(
        page.getByText('Account deleted successfully')
      ).toBeVisible();
    });
  });
});
