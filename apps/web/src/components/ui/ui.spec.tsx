import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './accordion';
import { Button } from './button';
import { Dots } from './card';
import { Consent, Field, Input } from './field';
import { ThemeToggle } from './theme-toggle';

/**
 * These tests guard the behaviour the demo already got right, which is the
 * easiest thing to lose in a port. They assert accessibility contracts, not
 * class names — a test that checks Tailwind strings breaks on every restyle and
 * catches nothing that matters.
 */

describe('Button', () => {
  it('defaults to type="button" so it cannot submit a form by accident', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button');
  });

  it('still allows an explicit submit', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('renders as a real anchor with asChild, keeping link behaviour', () => {
    render(
      <Button asChild>
        <a href="/assessment">Book</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Book' });
    expect(link).toHaveAttribute('href', '/assessment');
    // An <a> must not carry type="button".
    expect(link).not.toHaveAttribute('type');
  });
});

describe('Accordion', () => {
  it('uses native details so the content is findable with the page search', () => {
    const { container } = render(<Accordion summary="Cost?">A fixed price.</Accordion>);
    expect(container.querySelector('details')).toBeInTheDocument();
  });

  it('opens and closes on click without JavaScript state', async () => {
    const user = userEvent.setup();
    const { container } = render(<Accordion summary="Cost?">A fixed price.</Accordion>);
    const details = container.querySelector('details');

    expect(details).not.toHaveAttribute('open');
    await user.click(screen.getByText('Cost?'));
    expect(details).toHaveAttribute('open');
  });

  it('honours defaultOpen', () => {
    const { container } = render(
      <Accordion summary="Cost?" defaultOpen>
        A fixed price.
      </Accordion>,
    );
    expect(container.querySelector('details')).toHaveAttribute('open');
  });
});

describe('Field', () => {
  it('links label to control', () => {
    render(
      <Field label="Work email" htmlFor="email">
        <Input id="email" />
      </Field>,
    );
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
  });

  it('announces an error with role="alert"', () => {
    render(
      <Field label="Work email" htmlFor="email" error="Enter a valid email address">
        <Input id="email" aria-invalid />
      </Field>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('renders nothing for an absent error, so no empty gap appears', () => {
    render(
      <Field label="Work email" htmlFor="email">
        <Input id="email" />
      </Field>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Consent', () => {
  it('is unchecked by default — silence must never mean consent', () => {
    render(<Consent id="marketing">Send me occasional articles</Consent>);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('is reachable by its visible label text', () => {
    render(<Consent id="marketing">Send me occasional articles</Consent>);
    expect(screen.getByLabelText(/Send me occasional articles/)).toBeInTheDocument();
  });
});

describe('Dots', () => {
  it('exposes the value in the accessible name, not only in colour', () => {
    render(<Dots value={4} label="Impact" />);
    expect(screen.getByRole('img', { name: 'Impact 4 of 5' })).toBeInTheDocument();
  });
});

describe('ThemeToggle', () => {
  it('writes the choice to the documentElement and to storage', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button'));

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('bk-theme')).toBe('dark');
  });

  it('toggles back to light', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    await user.click(button);
    await user.click(button);

    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('labels the action, not the state', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleName('Switch to dark theme');
    await user.click(button);
    expect(button).toHaveAccessibleName('Switch to light theme');
  });
});
