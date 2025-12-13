import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../../components/Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  test('renders with label', () => {
    const label = 'Test Label';
    
    render(<Select label={label} id="test-select" />);
    
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  test('renders with required asterisk when required is true', () => {
    const label = 'Required Label';
    
    render(<Select label={label} id="test-select" required={true} />);
    
    const labelElement = screen.getByText(label);
    const asterisk = screen.getByText('*');
    expect(labelElement).toBeInTheDocument();
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass('text-red-500');
  });

  test('does not render asterisk when required is false', () => {
    const label = 'Optional Label';
    
    render(<Select label={label} id="test-select" required={false} />);
    
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  test('renders default option', () => {
    render(<Select id="test-select" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveDisplayValue('Select an option');
  });

  test('renders options correctly', () => {
    render(<Select id="test-select" options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Open the select dropdown
    select.focus();
    select.click();
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test('calls onChange when selection changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Select id="test-select" options={mockOptions} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('displays error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    
    render(<Select id="test-select" error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('text-red-500');
  });

  test('applies error styling when error prop is provided', () => {
    const errorMessage = 'This field is required';
    
    render(<Select id="test-select" error={errorMessage} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-red-500');
  });

  test('applies disabled styling when disabled prop is true', () => {
    render(<Select id="test-select" disabled={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveClass('bg-gray-100', 'cursor-not-allowed');
  });

  test('does not apply disabled styling when disabled prop is false', () => {
    render(<Select id="test-select" disabled={false} />);
    
    const select = screen.getByRole('combobox');
    expect(select).not.toBeDisabled();
    expect(select).toHaveClass('bg-white');
  });

  test('applies custom className', () => {
    const customClass = 'custom-select-class';
    
    render(<Select id="test-select" className={customClass} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass(customClass);
  });

  test('renders with initial value', () => {
    const initialValue = 'option2';
    
    render(<Select id="test-select" options={mockOptions} value={initialValue} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(initialValue);
  });
});