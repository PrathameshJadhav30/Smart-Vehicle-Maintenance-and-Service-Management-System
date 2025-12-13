import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '../Modal';

// Mock the XMarkIcon since it's an external dependency
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <svg data-testid="x-mark-icon" />
}));

describe('Modal Component', () => {
  test('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
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

  test('applies correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="sm">
        <div>Modal Content</div>
      </Modal>
    );
    
    const modalContent = document.querySelector('.modal-content');
    expect(modalContent).toHaveClass('max-w-md');
    
    // Test different size
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="lg">
        <div>Modal Content</div>
      </Modal>
    );
    
    const largeModalContent = document.querySelector('.modal-content');
    expect(largeModalContent).toHaveClass('max-w-3xl');
  });

  test('renders without title when title prop is not provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });
});