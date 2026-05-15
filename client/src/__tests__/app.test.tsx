import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '@/App';

// Stub fetch so App's health check doesn't throw in jsdom.
beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', service: 'test' }),
        text: async () => '{"status":"ok"}',
      } as Response),
  );
  // Override window.location to control initial route for some tests.
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, pathname: '/' },
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('App routing', () => {
  it('renders the home page and shows the Rentomojo brand', () => {
    render(<App />);
    // The Navbar always renders the brand text.
    expect(screen.getAllByText('Rentomojo').length).toBeGreaterThan(0);
  });

  it('renders sign-in and get-started buttons when logged out', () => {
    render(<App />);
    // Navbar shows Sign in + Get started links for unauthenticated users.
    expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /get started/i }).length).toBeGreaterThan(0);
  });
});
