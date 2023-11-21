/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isAllowed } from 'fxa-shared/configuration/convict-format-allow-list';
import {
  BaseIntegrationData,
  useConfig,
  useFtlMsgResolver,
} from '../../../models';
import { useLocation } from '@reach/router';
import {
  AuthUiErrors,
  composeAuthUiErrorTranslationId,
} from '../../auth-errors/auth-errors';

/*
 * Check if the integration contains a valid `redirectTo` based on
 * a whitelist maintained in the config.
 *
 * At the time of writing, this is only valid for web integrations.
 * OAuth integrations must derive keys before redirecting.
 */
export function useWebRedirect(redirectTo: BaseIntegrationData['redirectTo']) {
  const config = useConfig();
  const location = useLocation();
  const ftlMsgResolver = useFtlMsgResolver();

  const isValid = () =>
    redirectTo
      ? isAllowed(redirectTo, location.href, config.redirectAllowlist)
      : false;

  const getLocalizedErrorMessage = () =>
    ftlMsgResolver.getMsg(
      composeAuthUiErrorTranslationId(AuthUiErrors.INVALID_REDIRECT_TO),
      AuthUiErrors.INVALID_REDIRECT_TO.message
    );

  return {
    isValid,
    getLocalizedErrorMessage,
  };
}
