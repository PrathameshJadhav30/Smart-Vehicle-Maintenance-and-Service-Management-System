import { formatCurrency, formatDate, truncateText, capitalize, generateId, debounce } from '../helpers';

describe('Helper Functions', () => {
  test('formatCurrency formats amount correctly', () => {
    expect(formatCurrency(1000)).toBe('₹1,000.00');
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    expect(formatCurrency(1000.50)).toBe('₹1,000.50');
  });

  test('formatDate formats date correctly', () => {
    const testDate = new Date('2023-01-15T10:30:00');
    
    expect(formatDate(testDate, 'short')).toBe('Jan 15, 2023');
    expect(formatDate(testDate, 'long')).toBe('January 15, 2023');
    expect(formatDate(testDate, 'datetime')).toBe('Jan 15, 2023, 10:30 AM');
    
    // Test with string date
    expect(formatDate('2023-01-15', 'short')).toBe('Jan 15, 2023');
  });

  test('truncateText truncates long text', () => {
    const longText = 'This is a very long text that needs to be truncated';
    
    expect(truncateText(longText, 20)).toBe('This is a very long...');
    expect(truncateText('Short text', 20)).toBe('Short text');
    expect(truncateText(longText, 10)).toBe('This is a...');
  });

  test('capitalize capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
    expect(capitalize('')).toBe('');
    expect(capitalize('a')).toBe('A');
  });

  test('generateId generates random ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
  });

  test('debounce delays function execution', () => {
    vi.useFakeTimers();
    
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 1000);
    
    // Call the debounced function multiple times
    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    // Expect the function to be called only once with the last argument
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
    
    vi.useRealTimers();
  });
});