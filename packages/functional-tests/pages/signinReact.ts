/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect } from '@playwright/test';
import { BaseLayout } from './layout';
import { getReactFeatureFlagUrl } from '../lib/react-flag';
import { EmailHeader, EmailType } from '../lib/email';

export class SigninReactPage extends BaseLayout {
  readonly path = 'signin';

  get totpCodeFormHeading() {
    return this.page.getByRole('heading', {
      name: /^Enter (?:authentication|security) code/,
    });
  }

  get totpCodeTextbox() {
    return this.page
      .getByRole('textbox', { name: 'code' })
      .or(this.page.getByPlaceholder('Enter 6-digit code'));
  }

  get totpCodeTextboxTooltip() {
    return this.page.getByText('Invalid two-step authentication code', {
      exact: true,
    });
  }

  get cachedSigninHeading() {
    return this.page.getByRole('heading', { name: /^Sign in/ });
  }

  get codeFormHeading() {
    return this.page.getByRole('heading', { name: 'Boop' });
  }

  get codeTextbox() {
    return this.page.getByRole('textbox', { name: 'Enter 6-digit code' });
  }

  get confirmButton() {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get emailFirstHeading() {
    return this.page.getByRole('heading', { name: /^Enter your email/ });
  }

  get emailFirstSubmitButton() {
    return this.page.getByRole('button', { name: 'Sign up or sign in' });
  }

  get emailTextbox() {
    return this.page.getByRole('textbox', { name: 'Email' });
  }

  get forgotPasswordLink() {
    return this.page.getByRole('link', { name: /^Forgot password/ });
  }

  get passwordFormHeading() {
    return this.page.getByRole('heading', { name: /^Enter your password/ });
  }

  get passwordTextbox() {
    return this.page.getByRole('textbox', { name: 'password' });
  }

  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  get signinUnblockFormHeading() {
    return this.page.getByRole('heading', {
      name: /^Authorize this sign-in/,
    });
  }

  get signinUnblockFormTextbox() {
    return this.page.getByRole('textbox', { name: 'Enter authorization code' });
  }

  get signinUnblockFormSubmitButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get signinUnblockResendCodeButton() {
    return this.page.getByRole('button', {
      name: 'Not in inbox or spam folder? Resend',
    });
  }

  get signinUnblockCodeResentSuccessMessage() {
    return this.page.getByRole('status');
  }

  get syncSignInHeading() {
    return this.page.getByRole('heading', {
      name: /^Continue to your Mozilla account/,
    });
  }

  get sessionExpiredError() {
    return this.page.getByRole('status').getByText(/^Session expired/);
  }

  get useDifferentAccountLink() {
    return this.page.getByRole('link', { name: 'Use a different account' });
  }

  goto(route = '/', params = new URLSearchParams()) {
    params.set('forceExperiment', 'generalizedReactApp');
    params.set('forceExperimentGroup', 'react');
    return this.page.goto(
      getReactFeatureFlagUrl(this.target, route, params.toString())
    );
  }

  async fillOutAuthenticationForm(code: string): Promise<void> {
    await expect(this.totpCodeFormHeading).toBeVisible();

    await this.totpCodeTextbox.fill(code);
    await this.confirmButton.click();
  }

  async fillOutEmailFirstForm(email) {
    await this.emailTextbox.fill(email);
    await this.emailFirstSubmitButton.click();
  }

  async fillOutPasswordForm(password: string): Promise<void> {
    await expect(this.passwordFormHeading).toBeVisible();

    await this.passwordTextbox.fill(password);
    await this.signInButton.click();
  }

  async fillOutCodeForm(email: string) {
    const code = await this.target.emailClient.waitForEmail(
      email,
      EmailType.verifyShortCode || EmailType.verifyLoginCode,
      EmailHeader.shortCode || EmailHeader.signinCode
    );

    await expect(this.codeFormHeading).toBeVisible();

    await this.codeTextbox.fill(code);
    await this.confirmButton.click();
  }

  async fillOutSigninUnblockForm(code: string) {
    await this.signinUnblockFormTextbox.fill(code);
    await this.signinUnblockFormSubmitButton.click();
  }
}
