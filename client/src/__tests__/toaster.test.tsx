import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Toaster, useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';

function ToastTrigger() {
  const t = useToast();
  return <Button onClick={() => t.success('Saved!', 'It worked')}>fire</Button>;
}

describe('Toaster', () => {
  it('renders a toast when triggered', async () => {
    render(
      <MemoryRouter>
        <Toaster>
          <ToastTrigger />
        </Toaster>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    expect(await screen.findByText('Saved!')).toBeInTheDocument();
    expect(screen.getByText('It worked')).toBeInTheDocument();
  });
});
