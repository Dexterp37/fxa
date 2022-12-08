import { Page } from '@playwright/test';
import { AvatarPage } from './settings/avatar';
import { BaseTarget } from '../lib/targets/base';
import { ConnectAnotherDevicePage } from './connectAnotherDevice';
import { ChangePasswordPage } from './settings/changePassword';
import { DeleteAccountPage } from './settings/deleteAccount';
import { DisplayNamePage } from './settings/displayName';
import { FourOhFourPage } from './fourOhFour';
import { FxDesktopV3ForceAuthPage } from './forceAuth/fxDesktopV3';
import { LoginPage } from './login';
import { RecoveryKeyPage } from './settings/recoveryKey';
import { RelierPage } from './relier';
import { SecondaryEmailPage } from './settings/secondaryEmail';
import { SettingsPage } from './settings';
import { SignInPage } from './signin';
import { SigninTokenCodePage } from './signinTokenCode';
import { SubscribePage } from './products';
import { TotpPage } from './settings/totp';
import { SubscriptionManagementPage } from './products/subscriptionManagement';

export function create(page: Page, target: BaseTarget) {
  return {
    avatar: new AvatarPage(page, target),
    changePassword: new ChangePasswordPage(page, target),
    connectAnotherDevice: new ConnectAnotherDevicePage(page, target),
    deleteAccount: new DeleteAccountPage(page, target),
    displayName: new DisplayNamePage(page, target),
    fourOhFour: new FourOhFourPage(page, target),
    fxDesktopV3ForceAuth: new FxDesktopV3ForceAuthPage(page, target),
    login: new LoginPage(page, target),
    page,
    recoveryKey: new RecoveryKeyPage(page, target),
    relier: new RelierPage(page, target),
    secondaryEmail: new SecondaryEmailPage(page, target),
    settings: new SettingsPage(page, target),
    signIn: new SignInPage(page, target),
    signinTokenCode: new SigninTokenCodePage(page, target),
    subscribe: new SubscribePage(page, target),
    totp: new TotpPage(page, target),
    subscriptionManagement: new SubscriptionManagementPage(page, target),
  };
}
