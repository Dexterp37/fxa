import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Index from '../../app/page';

describe('Page', () => {
  it('renders Page as expected', async () => {
    render(await Index());

    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toHaveTextContent('Welcome');
  });
});
