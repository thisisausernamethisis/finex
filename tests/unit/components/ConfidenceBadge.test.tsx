import { render, screen } from '@testing-library/react';
import ConfidenceBadge, { confidenceTier } from '../../../src/components/ConfidenceBadge';

describe('ConfidenceBadge', () => {
  it('maps score to tier correctly', () => {
    expect(confidenceTier(0.9)).toBe('high');
    expect(confidenceTier(0.85)).toBe('high');
    expect(confidenceTier(0.7)).toBe('med');
    expect(confidenceTier(0.65)).toBe('med');
    expect(confidenceTier(0.52)).toBe('low');
    expect(confidenceTier(0.5)).toBe('low');
    expect(confidenceTier(0.49)).toBe('warn');
    expect(confidenceTier(0.2)).toBe('warn');
  });

  it('renders badge with high confidence color class', () => {
    render(<ConfidenceBadge score={0.92} />);
    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('92%');
    expect(badge.className).toContain('bg-emerald-600/10');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('renders badge with medium confidence color class', () => {
    render(<ConfidenceBadge score={0.7} />);
    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('70%');
    expect(badge.className).toContain('bg-blue-600/10');
    expect(badge.className).toContain('text-blue-700');
  });

  it('renders badge with low confidence color class', () => {
    render(<ConfidenceBadge score={0.55} />);
    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('55%');
    expect(badge.className).toContain('bg-amber-600/10');
    expect(badge.className).toContain('text-amber-700');
  });

  it('renders badge with warning confidence color class', () => {
    render(<ConfidenceBadge score={0.4} />);
    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveTextContent('40%');
    expect(badge.className).toContain('bg-red-600/10');
    expect(badge.className).toContain('text-red-700');
  });

  it('displays tooltip with confidence value', () => {
    render(<ConfidenceBadge score={0.75} />);
    const badge = screen.getByTestId('confidence-badge');
    expect(badge).toHaveAttribute('title', 'LLM confidence 75%');
  });
});
