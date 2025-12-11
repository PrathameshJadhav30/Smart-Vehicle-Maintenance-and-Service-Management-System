import { query, getClient } from '../config/database.js';

export const clearDatabase = async (req, res) => {
  // Only allow in development environment for safety
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }

  const client = await getClient();
  
  try {
    console.log('Clearing database...');
    
    await client.query('BEGIN');
    
    // Clear existing data (in reverse order of foreign key dependencies)
    await client.query('DELETE FROM invoices');
    await client.query('DELETE FROM jobcard_spareparts');
    await client.query('DELETE FROM jobcard_tasks');
    await client.query('DELETE FROM jobcards');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM vehicles');
    await client.query('DELETE FROM parts');
    await client.query('DELETE FROM users');
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Database cleared successfully!'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Clearing failed:', error);
    res.status(500).json({ message: 'Clearing failed', error: error.message });
  } finally {
    client.release();
  }
};