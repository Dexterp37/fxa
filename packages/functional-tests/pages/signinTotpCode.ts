/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BaseTokenCodePage } from './baseTokenCode';

export class SigninTotpCodePage extends BaseTokenCodePage {
  readonly path = '/signin_totp_code';

  get input() {
    this.checkPath();
    return this.page
      .getByTestId('signin-totp-code-input-label') // React
      .or(this.page.getByPlaceholder('Enter 6-digit code')); //Backbone
  }
}
