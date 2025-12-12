import checkInventoryData from '../../utils/checkInventoryData.js';
import { query } from '../../config/database.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

describe('checkInventoryData Utility', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should check inventory data successfully', async () => {
    // Mock database responses
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // Parts count
      .mockResolvedValueOnce({ rows: [
        { id: 1, name: 'Part 1' },
        { id: 2, name: 'Part 2' }
      ] }) // Sample parts
      .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Suppliers count
      .mockResolvedValueOnce({ rows: [
        { id: 1, name: 'Supplier 1' },
        { id: 2, name: 'Supplier 2' }
      ] }); // Sample suppliers

    await checkInventoryData();

    expect(console.log).toHaveBeenCalledWith('Checking parts and suppliers data...');
    expect(console.log).toHaveBeenCalledWith('Parts count: 5');
    expect(console.log).toHaveBeenCalledWith('Suppliers count: 3');
    expect(console.log).toHaveBeenCalledWith('Sample parts:', [
      { id: 1, name: 'Part 1' },
      { id: 2, name: 'Part 2' }
    ]);
    expect(console.log).toHaveBeenCalledWith('Sample suppliers:', [
      { id: 1, name: 'Supplier 1' },
      { id: 2, name: 'Supplier 2' }
    ]);
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    mockDb.query.mockRejectedValue(new Error('Database error'));

    await checkInventoryData();

    expect(console.error).toHaveBeenCalledWith('Error checking inventory data:', expect.any(Error));
  });

  it('should handle empty results', async () => {
    // Mock database responses with zero counts
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // Parts count
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // Suppliers count

    await checkInventoryData();

    expect(console.log).toHaveBeenCalledWith('Checking parts and suppliers data...');
    expect(console.log).toHaveBeenCalledWith('Parts count: 0');
    expect(console.log).toHaveBeenCalledWith('Suppliers count: 0');
  });
});