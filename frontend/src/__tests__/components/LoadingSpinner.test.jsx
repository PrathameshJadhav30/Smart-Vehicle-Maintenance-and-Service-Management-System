import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default size', () => {
    render(<LoadingSpinner />);
    
    // Get all divs and find the one with the spinner classes
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-12', 'w-12'); // medium size default
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  test('renders with medium size', () => {
    render(<LoadingSpinner size="medium" />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('h-16', 'w-16');
  });

  test('defaults to medium size for invalid size prop', () => {
    render(<LoadingSpinner size="invalid-size" />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('h-12', 'w-12'); // defaults to medium
  });

  test('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    
    render(<LoadingSpinner className={customClass} />);
    
    // Find the container div that has our custom class
    const containers = screen.getAllByRole('generic', { hidden: true });
    const container = containers.find(el => el.parentElement && el.parentElement.classList.contains(customClass));
    
    expect(container.parentElement).toHaveClass(customClass);
  });

  test('has animate-spin class', () => {
    render(<LoadingSpinner />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('animate-spin');
  });

  test('has correct border classes', () => {
    render(<LoadingSpinner />);
    
    const spinners = screen.getAllByRole('generic', { hidden: true });
    const spinner = spinners.find(el => el.classList.contains('animate-spin'));
    
    expect(spinner).toHaveClass('rounded-full', 'border-b-2', 'border-blue-600');
  });
});