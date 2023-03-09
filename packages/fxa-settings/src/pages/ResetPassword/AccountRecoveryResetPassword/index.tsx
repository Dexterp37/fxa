/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import { NavigateFn, RouteComponentProps, useNavigate } from '@reach/router';
import { FtlMsg } from 'fxa-react/lib/utils';
import { useForm } from 'react-hook-form';
import AppLayout from '../../../components/AppLayout';
import CardHeader from '../../../components/CardHeader';
import FormPasswordWithBalloons from '../../../components/FormPasswordWithBalloons';
import LinkDamaged from '../../../components/LinkDamaged';
import LinkExpired from '../../../components/LinkExpired';
import LinkRememberPassword from '../../../components/LinkRememberPassword';
import AlertBar from '../../../components/Settings/AlertBar';
import { REACT_ENTRYPOINT } from '../../../constants';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import {
  ContextValidationErrors,
  GenericContext,
  UrlSearchContext,
} from '../../../lib/context';
import {
  logErrorEvent,
  logViewEvent,
  setUserPreference,
  usePageViewEvent,
} from '../../../lib/metrics';
import {
  useAlertBar,
  useFtlMsgResolver,
  useNotifier,
  useBroker,
  useAccount,
  useRelier,
  useUrlSearchContext,
} from '../../../models/hooks';
import { LinkStatus } from '../../../lib/types';
import {
  AccountRecoveryKeyInfo,
  VerificationInfo,
  useLocationStateContext as useLocationContext,
} from '../../../models';

// This page is based on complete_reset_password but has been separated to align with the routes.

// Users should only see this page if they initiated account recovery with a valid account recovery key
// Account recovery properties must be set to recover the account using the recovery key
// (recoveryKeyId, accountResetToken, kb)

// If lostRecoveryKey is set, redirect to /complete_reset_password

export const viewName = 'account-recovery-reset-password';

export type AccountRecoveryResetPasswordProps = {
  overrides?: {
    navigate?: NavigateFn;
    locationContext?: GenericContext;
    urlSearchContext?: UrlSearchContext;
  };
} & RouteComponentProps;

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

const AccountRecoveryResetPassword = ({
  overrides,
}: AccountRecoveryResetPasswordProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  // Grab state from hooks
  const alertBar = useAlertBar();
  const notifier = useNotifier();
  const broker = useBroker();
  const ftlMsgResolver = useFtlMsgResolver();
  const account = useAccount();
  const relier = useRelier();
  let navigate = useNavigate();
  let urlSearchContext = useUrlSearchContext();
  let locationContext = useLocationContext();

  // Apply overrides
  navigate = overrides?.navigate || navigate;
  urlSearchContext = overrides?.urlSearchContext || urlSearchContext;
  locationContext = overrides?.locationContext || locationContext;

  const verificationInfo = new VerificationInfo(urlSearchContext);
  const accountRecoveryKeyInfo = new AccountRecoveryKeyInfo(locationContext);

  // The alert bar can get stuck in a stale state.
  alertBar.hide();

  const state = getInitialState();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(state.linkStatus);
  const [passwordMatchErrorText, setPasswordMatchErrorText] =
    useState<string>('');
  const { handleSubmit, register, getValues, errors, formState, trigger } =
    useForm<FormData>({
      mode: 'onTouched',
      criteriaMode: 'all',
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });

  // Make some presentation decisions based on initial state
  if (state.contextError) {
    alertInvalidContext(state.contextError);
  } else if (!state.supportsRecovery) {
    const msg = ftlMsgResolver.getMsg(
      'account-recovery-reset-password-redirecting',
      'Redirecting'
    );
    alertBar.info(msg);
    navigate(`/complete_reset_password?${urlSearchContext.toSearchQuery()}`);
  }

  return (
    <AppLayout>
      <AlertBar />
      {linkStatus === 'valid' && (
        <>
          <CardHeader
            headingText="Create new password"
            headingTextFtlId="create-new-password-header"
          />
          <FtlMsg id="account-restored-success-message">
            <p className="text-sm mb-4">
              You have successfully restored your account using your account
              recovery key. Create a new password to secure your data, and store
              it in a safe location.
            </p>
          </FtlMsg>

          {/* Hidden email field is to allow Fx password manager
            to correctly save the updated password. Without it,
            the password manager tries to save the old password
            as the username. */}
          <input type="email" value={state.email} className="hidden" readOnly />
          <section className="text-start mt-4">
            <FormPasswordWithBalloons
              {...{
                formState,
                errors,
                trigger,
                register,
                getValues,
                passwordMatchErrorText,
                setPasswordMatchErrorText,
              }}
              passwordFormType="reset"
              onSubmit={handleSubmit(
                (data: FormData) => {
                  onSubmit(data);
                },
                (err) => {
                  console.error(err);
                }
              )}
              email={state.email}
              loading={false}
              onFocusMetricsEvent={`${viewName}.engage`}
            />
          </section>

          <LinkRememberPassword {...state} />
        </>
      )}

      {linkStatus === 'damaged' && (
        <LinkDamaged {...{ linkType: 'reset-password' }} />
      )}

      {linkStatus === 'expired' && (
        <LinkExpired {...{ linkType: 'reset-password', resendLinkHandler }} />
      )}
    </AppLayout>
  );

  /**
   * Determines starting state for component
   */
  function getInitialState() {
    let email = '';
    let linkStatus: LinkStatus = LinkStatus.valid;
    let forceAuth = false;
    let supportsRecovery = true;
    let contextError: ContextValidationErrors | null = null;

    try {
      email = verificationInfo.email || '';

      forceAuth = !!verificationInfo.forceAuth;

      if (!verificationInfo.isValid()) {
        supportsRecovery = false;
        linkStatus = LinkStatus.damaged;
      } else if (!accountRecoveryKeyInfo.isValid()) {
        supportsRecovery = false;
      } else if (accountRecoveryKeyInfo.lostRecoveryKey === true) {
        supportsRecovery = false;
      }
    } catch (err) {
      if (err instanceof ContextValidationErrors) {
        contextError = err;
        linkStatus = LinkStatus.damaged;
      }
    }

    return {
      email,
      linkStatus,
      forceAuth,
      supportsRecovery,
      contextError,
    };
  }

  async function onSubmit(data: FormData) {
    const password = data.newPassword;

    try {
      await account.resetPasswordWithRecoveryKey({
        password,
        ...verificationInfo,
        ...accountRecoveryKeyInfo,
      });

      // FOLLOW-UP: I don't see functionality in settings
      await account.setLastLogin(Date.now());

      // FOLLOW-UP: It seems like the account class will now refresh itself, so I don't think
      //            these are necessary anymore?
      // storageContext.set('currentAccountUid', account.uid);
      // await account.refresh('account');

      // FOLLOW-UP: No equivalent yet in settings
      notifier.onAccountSignIn(account);

      relier.resetPasswordConfirm = true;
      logViewEvent(viewName, 'verification.success');

      // FOLLOW-UP: Broker not yet implemented
      await broker.invokeBrokerMethod('afterCompleteResetPassword', account);
      alertSuccess();
      navigateAway();
    } catch (err) {
      if (AuthUiErrors['INVALID_TOKEN'].errno === err.errno) {
        // TODO: Is this needed? Had to add the a method to support this.
        // BEFORE: this.logError(err);
        logErrorEvent({ viewName, ...err });
        setLinkStatus(LinkStatus.expired);
      } else {
        // Context validation errors indicate a bad state in either the url query or
        // maybe storage. In these cases show an alert bar and let the error keep bubbling
        // up.
        if (err instanceof ContextValidationErrors) {
          alertInvalidContext(err);
        } else {
          logErrorEvent(err);
          const msg = ftlMsgResolver.getMsg(
            'account-recovery-reset-password-unexpected-error',
            'Unexpected Error Encountered'
          );
          alertBar.error(msg);
        }
        throw err;
      }
    }
  }

  async function resendLinkHandler() {
    logViewEvent(viewName, 'account-recovery-reset-password.resend');

    try {
      await account.resetPassword(state.email);
      const msg = ftlMsgResolver.getMsg(
        `account-recovery-reset-password-email-resent`,
        'Email resent. Add accounts@firefox.com to your contacts to ensure a smooth delivery.'
      );
      alertBar.success(msg);
    } catch (err) {
      const msg = ftlMsgResolver.getMsg(
        'account-recovery-reset-password-email-resend-error',
        'Sorry, there was a problem resending a reset password link to your email.'
      );
      alertBar.error(msg, err);
    }
  }

  function alertSuccess() {
    const successCompletePwdReset = ftlMsgResolver.getMsg(
      `account-recovery-reset-password-success-alert`,
      'Password set'
    );
    alertBar.success(successCompletePwdReset);
  }

  function navigateAway() {
    setUserPreference('account-recovery', account.recoveryKey);
    logViewEvent(viewName, 'recovery-key-consume.success');
    navigate(
      `/reset_password_with_recovery_key_verified?${urlSearchContext.toSearchQuery()}`
    );
  }

  function alertInvalidContext(err: ContextValidationErrors) {
    const keys = err.errors.map((x) => x.key).join(',');
    const msg = ftlMsgResolver.getMsg(
      'account-recovery-reset-password-invalid-context',
      `Invalid context: ${keys}`,
      { keys }
    );
    alertBar.error(msg, err);
  }
};

export default AccountRecoveryResetPassword;
