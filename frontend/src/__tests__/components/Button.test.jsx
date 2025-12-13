import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../components/Button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    const primaryButton = screen.getByText('Primary');
    expect(primaryButton).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    const secondaryButton = screen.getByText('Secondary');
    expect(secondaryButton).toHaveClass('bg-white');
  });

  test('applies correct size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    const smallButton = screen.getByText('Small');
    expect(smallButton).toHaveClass('px-2.5', 'py-1.5');
    
    rerender(<Button size="lg">Large</Button>);
    const largeButton = screen.getByText('Large');
    expect(largeButton).toHaveClass('px-6', 'py-3');
  });

  test('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const spinner = screen.getByText('', { selector: 'svg' });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  test('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByText('Loading');
    expect(button).toBeDisabled();
  });

  test('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByText('Disabled');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});