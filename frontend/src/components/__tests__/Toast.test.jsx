import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast from '../Toast';
import { ToastProvider, useToast } from '../../contexts/ToastContext';

// Mock the XMarkIcon since it's an external dependency
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <svg data-testid="x-mark-icon" />
}));

// Test component to use the toast hook
const TestComponent = () => {
  const { showToast, clearToasts } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast.success('Success message')}>Show Success</button>
      <button onClick={() => showToast.error('Error message')}>Show Error</button>
      <button onClick={clearToasts}>Clear All</button>
      <Toast />
    </div>
  );
};

describe('Toast Component', () => {
  test('does not render when there are no toasts', () => {
    render(
      <ToastProvider>
        <Toast />
      </ToastProvider>
    );
    
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  test('renders toast when added', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const successButton = screen.getByText('Show Success');
    fireEvent.click(successButton);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  test('applies correct styling based on toast type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const errorButton = screen.getByText('Show Error');
    fireEvent.click(errorButton);
    
    const toast = screen.getByText('Error message').closest('div');
    expect(toast).toHaveClass('bg-red-500');
  });

  test('removes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const successButton = screen.getByText('Show Success');
    fireEvent.click(successButton);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    const closeButton = screen.getByTestId('x-mark-icon').closest('button');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });
});