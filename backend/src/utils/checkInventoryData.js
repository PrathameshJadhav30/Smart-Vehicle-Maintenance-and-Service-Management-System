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

// Run the check if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkInventoryData().then(() => {
    console.log('Check completed');
    process.exit(0);
  }).catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
  });
}

export default checkInventoryData;