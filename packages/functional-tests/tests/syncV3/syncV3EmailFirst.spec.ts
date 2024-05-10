/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../lib/fixtures/standard';

test.describe('Firefox Desktop Sync v3 email first', () => {
  test.beforeEach(async () => {
    test.slow();
  });

  test('open directly to /signup page, refresh on the /signup page', async ({
    pages: { configPage },
    target,
    syncBrowserPages: { page, login },
    testAccountTracker,
  }) => {
    const config = await configPage.getConfig();
    test.fixme(
      config.showReactApp.signUpRoutes === true,
      'Not currently supported in React Signup FXA-8973'
    );

    const { email } = testAccountTracker.generateSyncAccountDetails();

    await page.goto(
      `${target.contentServerUrl}/signup?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'load' }
    );
    await login.setEmail(email);
    await login.submit();

    // Verify user is redirected to the set password page
    await expect(login.signUpPasswordHeader).toBeVisible();

    //Refresh the page
    await page.reload({ waitUntil: 'load' });

    // refresh sends the user back to the first step
    await login.waitForEmailHeader();
  });

  test('open directly to /signin page, refresh on the /signin page', async ({
    target,
    syncBrowserPages: { page, login },
    testAccountTracker,
  }) => {
    const credentials = await testAccountTracker.signUpSync();

    await page.goto(
      `${target.contentServerUrl}/signin?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'load' }
    );
    await login.setEmail(credentials.email);
    await login.submit();

    // Verify user is redirected to the password page
    await expect(await login.waitForPasswordHeader()).toBeVisible();

    //Refresh the page
    await page.reload({ waitUntil: 'load' });

    // refresh sends the user back to the first step
    await login.waitForEmailHeader();
  });

  test('enter a firefox.com address', async ({
    target,
    syncBrowserPages: { login, page },
  }) => {
    await page.goto(
      `${target.contentServerUrl}?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'load' }
    );
    await login.setEmail('testuser@firefox.com');
    await login.clickSubmit();

    // Verify the error
    expect(await login.getTooltipError()).toContain(
      'Enter a valid email address. firefox.com does not offer email.'
    );
  });
});
