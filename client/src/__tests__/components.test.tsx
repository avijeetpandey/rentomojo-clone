import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

describe('Button variants', () => {
  it('renders default variant', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn.className).toContain('bg-accent');
  });

  it('renders outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button', { name: 'Outline' });
    expect(btn.className).toContain('border-border');
  });

  it('renders as link via asChild', () => {
    render(
      <MemoryRouter>
        <Button asChild variant="link">
          <a href="/test">Link</a>
        </Button>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Link' })).toBeDefined();
  });

  it('is disabled when disabled prop set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toHaveProperty('disabled', true);
  });
});

describe('Card', () => {
  it('composes header, title, and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
        </CardHeader>
        <CardContent>Body text</CardContent>
      </Card>,
    );
    expect(screen.getByText('My Card')).toBeDefined();
    expect(screen.getByText('Body text')).toBeDefined();
  });
});

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeDefined();
  });
});

describe('Label', () => {
  it('renders with correct text', () => {
    render(<Label htmlFor="x">Email</Label>);
    expect(screen.getByText('Email')).toBeDefined();
  });
});
