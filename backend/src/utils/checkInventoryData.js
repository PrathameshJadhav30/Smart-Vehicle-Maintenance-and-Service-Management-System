import { query } from '../config/database.js';

async function checkInventoryData() {
  try {
    console.log('Checking parts and suppliers data...');
    
    // Check parts table
    const partsResult = await query('SELECT COUNT(*) as count FROM parts');
    console.log(`Parts count: ${partsResult.rows[0].count}`);
    
    if (partsResult.rows[0].count > 0) {
      const sampleParts = await query('SELECT * FROM parts LIMIT 3');
      console.log('Sample parts:', sampleParts.rows);
    }
    
    // Check suppliers table
    const suppliersResult = await query('SELECT COUNT(*) as count FROM suppliers');
    console.log(`Suppliers count: ${suppliersResult.rows[0].count}`);
    
    if (suppliersResult.rows[0].count > 0) {
      const sampleSuppliers = await query('SELECT * FROM suppliers LIMIT 3');
      console.log('Sample suppliers:', sampleSuppliers.rows);
    }
    
    // Check if cache is working
    console.log('Cache status:');
    // We'll need to check this differently since cache is in-memory
    
  } catch (error) {
    console.error('Error checking inventory data:', error);
  }
}

// Export the function for use in tests
export default checkInventoryData;