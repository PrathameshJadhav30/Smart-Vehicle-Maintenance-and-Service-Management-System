import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../Button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('applies correct variant classes', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
  });

  test('applies correct size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
  });

  test('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading spinner when loading', () => {
    const { container } = render(<Button loading>Save</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass('opacity-50');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.firstChild;
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-not-allowed');
  });
});