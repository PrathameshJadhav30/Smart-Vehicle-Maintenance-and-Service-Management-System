import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/Modal';

// Mock the XMarkIcon since it's an SVG
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="close-icon" />
}));

describe('Modal Component', () => {
  test('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('renders with title when provided', () => {
    const title = 'Test Modal Title';
    
    render(
      <Modal isOpen={true} onClose={vi.fn()} title={title}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  test('does not render title when not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    // Get the backdrop element by its class
    const backdrop = document.querySelector('.bg-black.bg-opacity-20');
    await user.click(backdrop);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" showCloseButton={true}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('does not render close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" showCloseButton={false}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders close button when showCloseButton is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" showCloseButton={true}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders with default size (md)', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content').closest('.modal-content');
    expect(modalContent).toHaveClass('max-w-xl');
  });

  test('renders with small size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content').closest('.modal-content');
    expect(modalContent).toHaveClass('max-w-md');
  });

  test('renders with large size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content').closest('.modal-content');
    expect(modalContent).toHaveClass('max-w-3xl');
  });

  test('renders with extra large size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content').closest('.modal-content');
    expect(modalContent).toHaveClass('max-w-5xl');
  });

  test('renders with full size', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="full">
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content').closest('.modal-content');
    expect(modalContent).toHaveClass('max-w-full', 'mx-4');
  });

  test('renders children content', () => {
    const testContent = 'This is test content';
    
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>{testContent}</div>
      </Modal>
    );
    
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });
});