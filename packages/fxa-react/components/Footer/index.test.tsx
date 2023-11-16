/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen } from '@testing-library/react';
import Footer from '.';
import { renderWithLocalizationProvider } from '../../lib/test-utils/localizationProvider';

describe('Footer', () => {
  it('renders as expected', () => {
    renderWithLocalizationProvider(<Footer />);

    const linkMozilla = screen.getByTestId('link-mozilla');

    expect(linkMozilla).toHaveAttribute(
      'href',
      'https://www.mozilla.org/about/?utm_source=firefox-accounts&utm_medium=Referral'
    );
    expect(linkMozilla.firstElementChild).toHaveAttribute(
      'alt',
      'Mozilla logo'
    );
    expect(screen.getByTestId('link-privacy')).toHaveAttribute(
      'href',
      'https://www.mozilla.org/privacy/websites/'
    );
    expect(screen.getByTestId('link-terms')).toHaveAttribute(
      'href',
      'https://www.mozilla.org/about/legal/terms/services/'
    );
  });
});
