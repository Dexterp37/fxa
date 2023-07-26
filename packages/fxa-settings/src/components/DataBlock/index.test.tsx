/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { Account, AppContext } from '../../models';
import DataBlock from './index';
import { act } from 'react-dom/test-utils';
import { MOCK_ACCOUNT, mockAppContext } from '../../models/mocks';

const singleValue = 'ANMD 1S09 7Y2Y 4EES 02CW BJ6Z PYKP H69F';

const multiValue = [
  'C1OFZW7R04',
  'XVKRLKERT4',
  'CF0V94X204',
  'C3THX2SGZ4',
  'UXC6NRQT54',
  '24RF9WFA44',
  'ZBULPFN7J4',
  'D4J6KY8FL4',
];

const account = {
  ...MOCK_ACCOUNT,
} as unknown as Account;

Object.defineProperty(window.navigator, 'clipboard', {
  value: { writeText: jest.fn() },
});
window.URL.createObjectURL = jest.fn();

it('can render single values', () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={singleValue} />
    </AppContext.Provider>
  );
  expect(screen.getByText(singleValue)).toBeInTheDocument();
});

it('can render multiple values', () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={multiValue} />
    </AppContext.Provider>
  );
  multiValue.forEach((value) => {
    expect(screen.getByText(value)).toBeInTheDocument();
  });
});

it('can apply spacing to multiple values', () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={multiValue} separator=" " />
    </AppContext.Provider>
  );

  expect(screen.getByTestId('datablock').textContent?.trim()).toEqual(
    multiValue.join(' ')
  );
});

it('displays only Copy icon in iOS', () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={multiValue} separator=" " isIOS />
    </AppContext.Provider>
  );

  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Download' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Print' })
  ).not.toBeInTheDocument();
});

it('displays a tooltip on action', async () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={multiValue} />
    </AppContext.Provider>
  );
  await act(async () => {
    fireEvent.click(await screen.findByTestId('databutton-copy'));
  });
  expect(
    await screen.findByTestId('datablock-copy-tooltip')
  ).toBeInTheDocument();
});

it('sets download file name', async () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock
        value={multiValue}
        contentType="Firefox account recovery key"
      />
    </AppContext.Provider>
  );
  let element = await screen.findByTestId('databutton-download');
  expect(element).toBeInTheDocument();
  expect(element.getAttribute('download')).toContain(
    'Firefox account recovery key.txt'
  );
});

it('sets has fallback download file name', async () => {
  renderWithLocalizationProvider(
    <AppContext.Provider value={mockAppContext({ account })}>
      <DataBlock value={multiValue} />
    </AppContext.Provider>
  );
  const element = await screen.findByTestId('databutton-download');
  expect(element).toBeInTheDocument();
  expect(element.getAttribute('download')).toContain('Firefox.txt');
});
