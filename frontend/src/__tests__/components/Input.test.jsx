import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Input from '../../components/Input';

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  test('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('applies error styling when error prop is provided', () => {
    render(<Input error="This field is required" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  test('shows asterisk for required fields', () => {
    render(<Input label="Email" required id="email" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('applies disabled styling when disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-gray-100');
    expect(input).toBeDisabled();
  });

  test('calls onChange handler when value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalled();
    // We expect at least 1 call since we typed something
    // The exact number of calls may vary depending on how the event fires
  });

  test('renders with correct type attribute', () => {
    render(<Input type="password" placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  test('renders with initial value', () => {
    render(<Input value="Initial value" />);
    const input = screen.getByDisplayValue('Initial value');
    expect(input).toBeInTheDocument();
  });
});