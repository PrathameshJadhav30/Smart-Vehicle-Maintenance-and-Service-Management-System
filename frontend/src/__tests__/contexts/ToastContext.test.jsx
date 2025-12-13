import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../contexts/ToastContext';

// Create a test component that uses the toast context
const TestComponent = () => {
  const { toasts, addToast, removeToast, clearToasts, showToast } = useToast();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <div data-testid="toasts-container">
        {toasts.map(toast => (
          <div key={toast.id} data-testid={`toast-${toast.id}`}>
            <span data-testid={`toast-message-${toast.id}`}>{toast.message}</span>
            <span data-testid={`toast-type-${toast.id}`}>{toast.type}</span>
            <button 
              data-testid={`remove-toast-${toast.id}`} 
              onClick={() => removeToast(toast.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      <button data-testid="add-success-toast" onClick={() => showToast.success('Success message')}>
        Add Success Toast
      </button>
      <button data-testid="add-error-toast" onClick={() => showToast.error('Error message')}>
        Add Error Toast
      </button>
      <button data-testid="add-warning-toast" onClick={() => showToast.warning('Warning message')}>
        Add Warning Toast
      </button>
      <button data-testid="add-info-toast" onClick={() => showToast.info('Info message')}>
        Add Info Toast
      </button>
      <button data-testid="add-custom-toast" onClick={() => addToast('Custom message', 'info', 1000)}>
        Add Custom Toast
      </button>
      <button data-testid="clear-all-toasts" onClick={clearToasts}>
        Clear All Toasts
      </button>
    </div>
  );
};

// Wrapper component with ToastProvider
const wrapper = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('provides initial state with empty toasts array', () => {
    render(<TestComponent />, { wrapper });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  test('adds toast with addToast function', () => {
    render(<TestComponent />, { wrapper });
    
    act(() => {
      const addButton = screen.getByTestId('add-custom-toast');
      addButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    expect(screen.getByTestId(`toast-message-${firstToastId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`toast-type-${firstToastId}`)).toBeInTheDocument();
  });

  test('removes toast with removeToast function', () => {
    render(<TestComponent />, { wrapper });
    
    // Add a toast first
    act(() => {
      const addButton = screen.getByTestId('add-custom-toast');
      addButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    // Remove the toast
    act(() => {
      const removeButton = screen.getByTestId(`remove-toast-${firstToastId}`);
      removeButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  test('clears all toasts with clearToasts function', () => {
    render(<TestComponent />, { wrapper });
    
    // Add multiple toasts
    act(() => {
      const addButton = screen.getByTestId('add-custom-toast');
      addButton.click();
      addButton.click();
      addButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    
    // Clear all toasts
    act(() => {
      const clearButton = screen.getByTestId('clear-all-toasts');
      clearButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  test('adds success toast with showToast.success', () => {
    render(<TestComponent />, { wrapper });
    
    act(() => {
      const successButton = screen.getByTestId('add-success-toast');
      successButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    expect(screen.getByTestId(`toast-message-${firstToastId}`)).toHaveTextContent('Success message');
    expect(screen.getByTestId(`toast-type-${firstToastId}`)).toHaveTextContent('success');
  });

  test('adds error toast with showToast.error', () => {
    render(<TestComponent />, { wrapper });
    
    act(() => {
      const errorButton = screen.getByTestId('add-error-toast');
      errorButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    expect(screen.getByTestId(`toast-message-${firstToastId}`)).toHaveTextContent('Error message');
    expect(screen.getByTestId(`toast-type-${firstToastId}`)).toHaveTextContent('error');
  });

  test('adds warning toast with showToast.warning', () => {
    render(<TestComponent />, { wrapper });
    
    act(() => {
      const warningButton = screen.getByTestId('add-warning-toast');
      warningButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    expect(screen.getByTestId(`toast-message-${firstToastId}`)).toHaveTextContent('Warning message');
    expect(screen.getByTestId(`toast-type-${firstToastId}`)).toHaveTextContent('warning');
  });

  test('adds info toast with showToast.info', () => {
    render(<TestComponent />, { wrapper });
    
    act(() => {
      const infoButton = screen.getByTestId('add-info-toast');
      infoButton.click();
    });
    
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    
    // Get the first toast ID
    const toastIds = screen.getAllByTestId(/toast-message-/).map(el => el.dataset.testid.replace('toast-message-', ''));
    const firstToastId = toastIds[0];
    
    expect(screen.getByTestId(`toast-message-${firstToastId}`)).toHaveTextContent('Info message');
    expect(screen.getByTestId(`toast-type-${firstToastId}`)).toHaveTextContent('info');
  });

  test('does not auto-remove toast when duration is 0', () => {
    const TestComponentWithDurationZero = () => {
      const { addToast } = useToast();
      
      return (
        <div>
          <button 
            data-testid="add-persistent-toast" 
            onClick={() => addToast('Persistent message', 'info', 0)}
          >
            Add Persistent Toast
          </button>
          <div data-testid="toast-provider-content">
            <TestComponent />
          </div>
        </div>
      );
    };
    
    render(<TestComponentWithDurationZero />, { wrapper });
    
    act(() => {
      const addButton = screen.getByTestId('add-persistent-toast');
      addButton.click();
    });
    
    // Fast-forward time by a large amount
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    
    // The toast should still be there because duration was 0
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });
});