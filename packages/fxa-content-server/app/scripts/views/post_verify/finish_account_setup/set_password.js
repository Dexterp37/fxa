/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'underscore';
import FormView from '../../form';
import Template from '../../../templates/post_verify/finish_account_setup/set_password.mustache';
import Cocktail from '../../../lib/cocktail';
import FlowEventsMixin from '../../mixins/flow-events-mixin';
import PasswordMixin from '../../mixins/password-mixin';
import PasswordStrengthMixin from '../../mixins/password-strength-mixin';
import AuthErrors from '../../../lib/auth-errors';
import Url from '../../../lib/url';
import VerificationInfo from '../../../models/verification/set-password';

const PASSWORD_INPUT_SELECTOR = '#password';
const VPASSWORD_INPUT_SELECTOR = '#vpassword';

class SetPassword extends FormView {
  template = Template;

  initialize(options) {
    const searchParams = Url.searchParams(this.window.location.search);
    this._verificationInfo = new VerificationInfo(searchParams);
  }

  _getPassword() {
    return this.$(PASSWORD_INPUT_SELECTOR).val();
  }

  _getVPassword() {
    return this.$(VPASSWORD_INPUT_SELECTOR).val();
  }

  getAccount() {
    return this.user.initAccount({
      email: this._verificationInfo.get('email'),
    });
  }

  isValidEnd() {
    return this._getPassword() === this._getVPassword();
  }

  showValidationErrorsEnd() {
    if (this._getPassword() !== this._getVPassword()) {
      const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
      this.showValidationError(this.$(PASSWORD_INPUT_SELECTOR), err, true);
    }
  }

  setInitialContext(context) {
    const email = this.getAccount().get('email');
    context.set({
      email,
      escapedEmail: `<span class="email">${_.escape(email)}</span>`,
      productName: decodeURIComponent(
        this._verificationInfo.get('product_name').replace(/\+/g, ' ')
      ),
      isLinkValid: !this._verificationInfo.isValid(),
      expired: this._verificationInfo.get('expires_at') < Date.now(),
    });
  }

  redirectToProduct(account) {
    return account.fetchSubscriptionPlans().then((plans) => {
      const productId = this._verificationInfo.get('product_id');
      const plan = plans.find((p) => p.product_id === productId);
      const url = new URL(
        plan && plan.product_metadata
          ? plan.product_metadata.downloadURL
          : 'https://mozilla.org'
      );
      url.searchParams.set('email', account.get('email'));
      return this.navigateAway(url.href);
    });
  }

  beforeRender() {
    const account = this.getAccount();
    return account.checkEmailExists().then((status) => {
      if (!status) {
        this.logError(AuthErrors.toError('INVALID_EMAIL'));
        return this.navigate('/', {}, { clearQueryParams: true });
      }

      if (!this._verificationInfo.isValid()) {
        this.logError(AuthErrors.toError('DAMAGED_VERIFICATION_LINK'));
        return;
      }
    });
  }

  submit() {
    const account = this.getAccount();
    const password = this._getPassword();
    const token = this._verificationInfo.get('token');
    const code = this._verificationInfo.get('code');
    if (this._verificationInfo.get('expires_at') < Date.now()) {
    }
    return this.user
      .completeAccountPasswordReset(account, password, token, code, this.relier)
      .then(
        () => {
          return this.redirectToProduct(account);
        },
        (err) => {
          if (AuthErrors.is(err, 'INVALID_TOKEN')) {
            // The token has expired since the first check, re-render to
            // show a view that allows the user to receive a new link.
            return this.render();
          }

          // all other errors are unexpected, bail.
          this.logError(err);
          throw err;
        }
      );
  }
}

Cocktail.mixin(
  SetPassword,
  PasswordMixin,
  PasswordStrengthMixin({
    balloonEl: '.helper-balloon',
    passwordEl: '#password',
  }),
  FlowEventsMixin
);

export default SetPassword;
