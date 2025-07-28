import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, IconButton, ButtonGroup } from './Button';

// Mock icon for testing
const TestIcon = () => (
  <svg data-testid="test-icon" width="16" height="16" viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.14.18 2.43.18 3.57.02.16.03.33.03.5 0 5.16-1 9-5.45 9-11V7l-10-5z"/>
  </svg>
);

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveClass('bg-brand-600', 'text-white');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-brand-600', 'text-white');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-neutral-100', 'text-neutral-900');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'text-brand-600', 'border-2', 'border-brand-600');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600', 'text-white');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies full width styling', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('renders with left icon', () => {
    render(<Button leftIcon={<TestIcon />}>With Icon</Button>);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Button rightIcon={<TestIcon />}>With Icon</Button>);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies energy level styling', () => {
    const { rerender } = render(<Button energyLevel="high">High Energy</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600', 'text-white');

    rerender(<Button energyLevel="medium">Medium Energy</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-yellow-600', 'text-white');

    rerender(<Button energyLevel="low">Low Energy</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600', 'text-white');
  });

  it('supports keyboard navigation', () => {
    render(<Button>Keyboard Test</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('IconButton Component', () => {
  it('renders icon button correctly', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Test icon button" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test icon button');
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(button).toHaveClass('aspect-square');
  });

  it('requires aria-label for accessibility', () => {
    // This should be caught by TypeScript, but we can test the rendered output
    render(<IconButton icon={<TestIcon />} aria-label="Required label" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Required label');
  });

  it('applies size classes correctly for icon buttons', () => {
    const { rerender } = render(<IconButton icon={<TestIcon />} aria-label="Test" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('!p-1');

    rerender(<IconButton icon={<TestIcon />} aria-label="Test" size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('!p-3');
  });
});

describe('ButtonGroup Component', () => {
  it('renders horizontal button group', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-row');
    expect(group).toBeInTheDocument();
  });

  it('renders vertical button group', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });

  it('applies full width to button group', () => {
    render(
      <ButtonGroup fullWidth>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    render(
      <ButtonGroup className="custom-group">
        <Button>First</Button>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('custom-group');
  });
});
