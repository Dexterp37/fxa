/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Page, expect, test } from '../../lib/fixtures/standard';
import { BaseTarget, Credentials } from '../../lib/targets/base';
import { TestAccountTracker } from '../../lib/testAccountTracker';
import { SettingsPage } from '../../pages/settings';
import { SigninReactPage } from '../../pages/signinReact';

test.describe('severity-1 #smoke', () => {
  test.describe('change password tests', () => {
    test('change password with an incorrect old password', async ({
      target,
      pages: { changePassword, page, settings, signinReact },
      testAccountTracker,
    }) => {
      test.slow();

      await signInAccount(
        target,
        page,
        settings,
        signinReact,
        testAccountTracker
      );
      const newPassword = testAccountTracker.generatePassword();

      await settings.goto();

      // Enter incorrect old password and verify the tooltip error
      await settings.password.changeButton.click();
      await changePassword.fillOutChangePassword(
        'Incorrect Password',
        newPassword
      );

      await expect(changePassword.tooltip).toHaveText('Incorrect password');
    });

    test('change password with a correct password', async ({
      target,
      pages: { changePassword, page, settings, signinReact },
      testAccountTracker,
    }) => {
      test.slow();

      const credentials = await signInAccount(
        target,
        page,
        settings,
        signinReact,
        testAccountTracker
      );
      const newPassword = testAccountTracker.generatePassword();

      await settings.goto();

      // Enter the correct old password and verify that change password is successful
      await settings.password.changeButton.click();
      await changePassword.fillOutChangePassword(
        credentials.password,
        newPassword
      );
      credentials.password = newPassword;

      await expect(settings.settingsHeading).toBeVisible();
      await expect(settings.alertBar).toHaveText('Password updated');

      // Sign out and login with new password
      await settings.signOut();
      await signinReact.fillOutEmailFirstForm(credentials.email);
      await signinReact.fillOutPasswordForm(credentials.password);

      await expect(settings.primaryEmail.status).toHaveText(credentials.email);
    });

    const testCases = [
      {
        name: 'short password',
        error: 'At least 8 characters',
        password: '2short',
        confirmPassword: '2short',
      },
      {
        name: 'common password',
        error: 'Not a commonly used password',
        password: 'passwords',
        confirmPassword: 'passwords',
      },
      {
        name: 'mismatch confirm password',
        error: 'New password matches confirmation',
        password: 'newPasswordTest',
        confirmPassword: 'newPasswordTest2',
      },
    ];
    for (const { name, error, password, confirmPassword } of testCases) {
      test(`new password validation - ${name}`, async ({
        target,
        pages: { changePassword, page, settings, signinReact },
        testAccountTracker,
      }) => {
        await signInAccount(
          target,
          page,
          settings,
          signinReact,
          testAccountTracker
        );

        await settings.goto();
        await settings.password.changeButton.click();

        await expect(changePassword.changePasswordHeading).toBeVisible();

        await changePassword.newPasswordTextbox.fill(password);
        await changePassword.confirmPasswordTextbox.fill(confirmPassword);

        await expect(changePassword.passwordError).toHaveText(error);
      });
    }

    test(`new password validation - email as password`, async ({
      target,
      pages: { changePassword, page, settings, signinReact },
      testAccountTracker,
    }) => {
      const { email } = await signInAccount(
        target,
        page,
        settings,
        signinReact,
        testAccountTracker
      );

      await settings.goto();
      await settings.password.changeButton.click();

      await expect(changePassword.changePasswordHeading).toBeVisible();

      await changePassword.newPasswordTextbox.fill(email);

      await expect(changePassword.passwordError).toHaveText(
        'Not your email address'
      );
    });

    test('change password with short password tooltip shows, cancel and try to change password again, tooltip is not shown', async ({
      target,
      pages: { changePassword, page, settings, signinReact },
      testAccountTracker,
    }) => {
      await signInAccount(
        target,
        page,
        settings,
        signinReact,
        testAccountTracker
      );

      await settings.goto();
      await settings.password.changeButton.click();

      await expect(changePassword.changePasswordHeading).toBeVisible();

      await changePassword.newPasswordTextbox.fill('short');

      await expect(changePassword.passwordLengthInvalidIcon).toBeVisible();

      await changePassword.cancelButton.click();

      await expect(settings.settingsHeading).toBeVisible();

      await settings.password.changeButton.click();

      await expect(changePassword.passwordLengthUnsetIcon).toBeVisible();
    });

    test('reset password via settings works', async ({
      target,
      pages: {
        changePassword,
        page,
        settings,
        signinReact,
        resetPasswordReact,
        configPage,
      },
      testAccountTracker,
    }) => {
      const config = await configPage.getConfig();
      test.fixme(
        config.featureFlags.resetPasswordWithCode === true,
        'see FXA-9612'
      );
      test.slow();

      await signInAccount(
        target,
        page,
        settings,
        signinReact,
        testAccountTracker
      );

      await settings.goto();

      await settings.password.changeButton.click();

      await expect(changePassword.changePasswordHeading).toBeVisible();

      await changePassword.forgotPasswordLink.click();

      await expect(resetPasswordReact.resetPasswordHeading).toBeVisible();
    });
  });
});

async function signInAccount(
  target: BaseTarget,
  page: Page,
  settings: SettingsPage,
  signinReact: SigninReactPage,
  testAccountTracker: TestAccountTracker
): Promise<Credentials> {
  const credentials = await testAccountTracker.signUp();
  await page.goto(target.contentServerUrl);
  await signinReact.fillOutEmailFirstForm(credentials.email);
  await signinReact.fillOutPasswordForm(credentials.password);

  //Verify logged in on Settings page
  await expect(settings.settingsHeading).toBeVisible();

  return credentials;
}
