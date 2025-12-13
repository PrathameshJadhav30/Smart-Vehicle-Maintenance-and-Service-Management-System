import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Select from '../Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  test('renders select with label', () => {
    render(<Select label="Choose Option" id="select-option" options={mockOptions} />);
    expect(screen.getByLabelText('Choose Option')).toBeInTheDocument();
  });

  test('renders select with options', () => {
    render(<Select options={mockOptions} />);
    const select = screen.getByRole('combobox');
    expect(select.children).toHaveLength(4); // 3 options + 1 default
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  test('displays error message when error prop is provided', () => {
    render(<Select error="This field is required" options={mockOptions} />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('applies error styling when error prop is provided', () => {
    const { container } = render(<Select error="Error message" options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toHaveClass('border-red-500');
  });

  test('calls onChange handler when selection changes', () => {
    const handleChange = vi.fn();
    render(<Select onChange={handleChange} options={mockOptions} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders required indicator when required prop is true', () => {
    render(<Select label="Choose Option" required id="select-option" options={mockOptions} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('applies disabled styling when disabled prop is true', () => {
    const { container } = render(<Select disabled options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toHaveClass('bg-gray-100');
    expect(select).toHaveClass('cursor-not-allowed');
  });

  test('applies custom className', () => {
    const { container } = render(<Select className="custom-class" options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-class');
  });

  test('renders with correct initial value', () => {
    render(<Select value="option2" options={mockOptions} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });
});