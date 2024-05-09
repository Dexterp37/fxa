/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../lib/fixtures/standard';

test.describe('severity-2 #smoke', () => {
  test.describe('post verify - force password change sync', () => {
    test('force change password on login - sync', async ({
      target,
      syncBrowserPages: {
        page,
        signinReact,
        postVerify,
        connectAnotherDevice,
        signinTokenCode,
      },
      testAccountTracker,
    }) => {
      const credentials = await testAccountTracker.signUpForced();
      const newPassword = testAccountTracker.generatePassword();

      await page.goto(
        `${target.contentServerUrl}?context=fx_desktop_v3&service=sync`
      );
      await signinReact.fillOutEmailFirstForm(credentials.email);
      await signinReact.fillOutPasswordForm(credentials.password);
      await page.waitForURL(/signin_token_code/);
      await expect(signinTokenCode.heading).toBeVisible();
      const code = await target.emailClient.getSigninTokenCode(
        credentials.email
      );
      await signinTokenCode.fillOutCodeForm(code);

      //Verify force password change header
      await expect(postVerify.forcePasswordChangeHeading).toBeVisible();

      //Fill out change password
      await postVerify.fillOutChangePassword(credentials.password, newPassword);
      await postVerify.submit();
      credentials.password = newPassword;

      //Verify logged in on connect another device page
      await expect(connectAnotherDevice.fxaConnectedHeading).toBeVisible();
    });
  });
});
