import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ErrorDisplay from '../../components/ErrorDisplay';
import Button from '../../components/Button';

// Mock the Button component to isolate ErrorDisplay tests
vi.mock('../../components/Button', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="retry-button">
      {children}
    </button>
  )
}));

describe('ErrorDisplay Component', () => {
  test('renders with default props', () => {
    render(<ErrorDisplay />);
    
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });

  test('renders with custom title and message', () => {
    const customTitle = 'Custom Error Title';
    const customMessage = 'This is a custom error message.';
    
    render(<ErrorDisplay title={customTitle} message={customMessage} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay />);
    
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });

  test('renders retry button when onRetry is provided', () => {
    const onRetryMock = vi.fn();
    
    render(<ErrorDisplay onRetry={onRetryMock} />);
    
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('calls onRetry function when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetryMock = vi.fn();
    
    render(<ErrorDisplay onRetry={onRetryMock} />);
    
    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);
    
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    const customClass = 'custom-error-display';
    
    render(<ErrorDisplay className={customClass} />);
    
    const errorDisplay = screen.getByText('Error loading data').closest('div');
    expect(errorDisplay).toHaveClass(customClass);
  });
});