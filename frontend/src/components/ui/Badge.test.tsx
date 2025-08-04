import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, EnergyBadge, StatusBadge, ConfidenceBadge, PriorityBadge } from './Badge';

describe('Badge Component', () => {
  it('renders with default props', () => {
    render(<Badge>Test Badge</Badge>);

    const badge = screen.getByRole('img');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Test Badge');
    expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-800');
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByRole('img')).toHaveClass('px-2', 'py-0.5', 'text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByRole('img')).toHaveClass('px-3', 'py-1', 'text-sm');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByRole('img')).toHaveClass('px-4', 'py-1.5', 'text-base');
  });

  it('generates accessible labels correctly', () => {
    render(
      <Badge variant="energy" energyLevel="high">
        Energy
      </Badge>
    );

    const badge = screen.getByRole('img');
    expect(badge).toHaveAttribute('aria-label', 'Energy, high energy level');
  });

  it('accepts custom aria-label', () => {
    render(<Badge aria-label="Custom label">Test</Badge>);

    const badge = screen.getByRole('img');
    expect(badge).toHaveAttribute('aria-label', 'Custom label');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>);

    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('custom-class');
  });
});

describe('EnergyBadge Component', () => {
  it('renders high energy badge with correct styling', () => {
    render(<EnergyBadge level="high" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('High Energy');
    expect(badge).toHaveClass('bg-red-50', 'text-red-800', 'border-red-200');
    expect(badge).toHaveAttribute('aria-label', 'High Energy, high energy level');
  });

  it('renders medium energy badge with correct styling', () => {
    render(<EnergyBadge level="medium" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Medium Energy');
    expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-800', 'border-yellow-200');
  });

  it('renders low energy badge with correct styling', () => {
    render(<EnergyBadge level="low" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Low Energy');
    expect(badge).toHaveClass('bg-green-50', 'text-green-800', 'border-green-200');
  });
});

describe('StatusBadge Component', () => {
  it('renders pending status correctly', () => {
    render(<StatusBadge status="pending" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Pending');
    expect(badge).toHaveClass('bg-neutral-50', 'text-neutral-700');
  });

  it('renders in-progress status correctly', () => {
    render(<StatusBadge status="in-progress" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('In Progress');
    expect(badge).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('renders blocked status correctly', () => {
    render(<StatusBadge status="blocked" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Blocked');
    expect(badge).toHaveClass('bg-orange-50', 'text-orange-700');
  });

  it('renders done status correctly', () => {
    render(<StatusBadge status="done" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Done');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });
});

describe('ConfidenceBadge Component', () => {
  it('renders high confidence badge correctly', () => {
    render(<ConfidenceBadge confidence="high" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('High Confidence');
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
    expect(badge).toHaveAttribute('aria-label', 'High Confidence, high confidence');
  });

  it('renders medium confidence badge correctly', () => {
    render(<ConfidenceBadge confidence="medium" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Medium Confidence');
    expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-700');
  });

  it('renders low confidence badge correctly', () => {
    render(<ConfidenceBadge confidence="low" />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('Low Confidence');
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });
});

describe('PriorityBadge Component', () => {
  it('renders priority 5 (highest) correctly', () => {
    render(<PriorityBadge priority={5} />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('P5');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    expect(badge).toHaveAttribute('aria-label', 'P5, priority 5 of 5');
  });

  it('renders priority 1 (lowest) correctly', () => {
    render(<PriorityBadge priority={1} />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('P1');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders middle priority correctly', () => {
    render(<PriorityBadge priority={3} />);

    const badge = screen.getByRole('img');
    expect(badge).toHaveTextContent('P3');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });
});
