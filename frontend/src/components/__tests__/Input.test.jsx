import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from '../Input';

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label="Name" id="name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  test('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('applies error styling when error prop is provided', () => {
    const { container } = render(<Input error="Error message" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  test('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders required indicator when required prop is true', () => {
    render(<Input label="Name" required id="name" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('applies disabled styling when disabled prop is true', () => {
    const { container } = render(<Input disabled />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('bg-gray-100');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  test('applies custom className', () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });

  test('renders with correct type attribute', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });
});