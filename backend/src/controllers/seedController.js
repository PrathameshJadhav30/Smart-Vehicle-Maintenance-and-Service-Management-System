import { query, getClient } from '../config/database.js';
import bcrypt from 'bcrypt';

export const seedDatabase = async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }

  const client = await getClient();
  
  try {
    console.log('Starting database seeding...');
    
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
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone, address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      ['Admin User', 'admin@svmms.com', adminPassword, 'admin', '1234567890', '123 Admin St, Service Center HQ']
    );
    const adminId = adminResult.rows[0].id;
    console.log('✓ Admin user created');
    
    // Create mechanic users
    const mechanicPassword = await bcrypt.hash('mechanic123', 10);
    const mechanics = [
      ['John Mechanic', 'mechanic@svmms.com', '9876543210', '456 Workshop Ave, Service Center'],
      ['Sarah Repair', 'sarah@svmms.com', '8765432109', '456 Workshop Ave, Service Center'],
      ['Mike Services', 'mike@svmms.com', '7654321098', '456 Workshop Ave, Service Center']
    ];
    
    const mechanicIds = [];
    for (const [name, email, phone, address] of mechanics) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone, address) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [name, email, mechanicPassword, 'mechanic', phone, address]
      );
      mechanicIds.push(result.rows[0].id);
    }
    console.log('✓ Mechanic users created');
    
    // Create customer users
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customers = [
      ['Jane Customer', 'customer@svmms.com', '5555555555', '789 Customer Blvd, City A'],
      ['John Owner', 'john@svmms.com', '5555555554', '790 Customer Blvd, City A'],
      ['Alice Driver', 'alice@svmms.com', '5555555553', '791 Customer Blvd, City A'],
      ['Bob Vehicle', 'bob@svmms.com', '5555555552', '792 Customer Blvd, City B']
    ];
    
    const customerIds = [];
    for (const [name, email, phone, address] of customers) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone, address) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [name, email, customerPassword, 'customer', phone, address]
      );
      customerIds.push(result.rows[0].id);
    }
    console.log('✓ Customer users created');
    
    // Create sample parts
    const parts = [
      ['Engine Oil Filter', 'EOF-1234', 12.99, 50, 10, 'High-quality oil filter for most engines'],
      ['Brake Pad Set', 'BP-5678', 45.99, 30, 5, 'Front brake pad set for sedans'],
      ['Air Filter', 'AF-9012', 18.50, 40, 8, 'Standard air filter for passenger cars'],
      ['Spark Plug', 'SP-3456', 8.75, 100, 20, '4-pack of premium spark plugs'],
      ['Coolant', 'CL-7890', 22.50, 25, 5, '50/50 coolant mix for all vehicles']
    ];
    
    const partIds = [];
    for (const [name, partNumber, price, quantity, reorderLevel, description] of parts) {
      const result = await client.query(
        `INSERT INTO parts (name, part_number, price, quantity, reorder_level, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [name, partNumber, price, quantity, reorderLevel, description]
      );
      partIds.push(result.rows[0].id);
    }
    console.log('✓ Sample parts created');
    
    // Create sample vehicles
    const vehicles = [
      [customerIds[0], '1HGBH41JXMN109186', 'Toyota Camry', 2020, '2.5L I4'],
      [customerIds[1], '2T1BURHE5JC012345', 'Honda Civic', 2019, '1.8L I4'],
      [customerIds[2], '3VWBP29M9YM123456', 'Volkswagen Jetta', 2021, '1.4L Turbo'],
      [customerIds[3], '4S3BMAB67M3210987', 'Subaru Outback', 2018, '2.5L Boxer']
    ];
    
    const vehicleIds = [];
    for (const [customerId, vin, model, year, engineType] of vehicles) {
      const result = await client.query(
        `INSERT INTO vehicles (customer_id, vin, model, year, engine_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [customerId, vin, model, year, engineType]
      );
      vehicleIds.push(result.rows[0].id);
    }
    console.log('✓ Sample vehicles created');
    
    // Create sample bookings
    const now = new Date();
    const bookingDates = [
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days future
      new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)  // 5 days future
    ];
    
    const serviceTypes = ['Oil Change', 'General Checkup', 'Brake Service', 'Engine Repair', 'Transmission Service', 'Tire Replacement'];
    const bookingStatuses = ['pending', 'approved', 'completed', 'pending'];
    
    const bookingIds = [];
    for (let i = 0; i < Math.min(vehicleIds.length, 4); i++) {
      const result = await client.query(
        `INSERT INTO bookings (customer_id, vehicle_id, service_type, booking_date, booking_time, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          customerIds[i % customerIds.length],
          vehicleIds[i],
          serviceTypes[i % serviceTypes.length],
          bookingDates[i].toISOString().split('T')[0],
          ['09:00', '10:30', '14:00', '15:30'][i],
          bookingStatuses[i],
          `Service requested for ${serviceTypes[i % serviceTypes.length]}`
        ]
      );
      bookingIds.push(result.rows[0].id);
    }
    console.log('✓ Sample bookings created');
    
    // Create job cards and related data
    if (bookingIds.length > 0) {
      for (let i = 0; i < Math.min(bookingIds.length, 3); i++) {
        const bookingResult = await client.query(
          `SELECT customer_id, vehicle_id FROM bookings WHERE id = $1`,
          [bookingIds[i]]
        );
        
        if (bookingResult.rows[0] && mechanicIds.length > 0) {
          const booking = bookingResult.rows[0];
          const jobcardResult = await client.query(
            `INSERT INTO jobcards (booking_id, customer_id, vehicle_id, mechanic_id, status, labor_cost, total_cost, started_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              bookingIds[i],
              booking.customer_id,
              booking.vehicle_id,
              mechanicIds[i % mechanicIds.length],
              ['in_progress', 'completed'][i % 2],
              [50, 75, 100][i % 3] * 10,
              [50, 75, 100][i % 3] * 10
            ]
          );
          
          if (jobcardResult.rows[0]) {
            const jobcardId = jobcardResult.rows[0].id;
            
            // Add sample tasks
            const taskNames = ['Diagnostic Scan', 'Oil Change', 'Filter Replacement', 'Fluid Top-up', 'Belt Inspection'];
            for (let j = 0; j < (i % 3) + 1; j++) {
              await client.query(
                `INSERT INTO jobcard_tasks (jobcard_id, task_name, task_cost, status)
                 VALUES ($1, $2, $3, $4)`,
                [jobcardId, taskNames[j % taskNames.length], (j + 1) * 25, 'completed']
              );
            }
            
            // Add sample spare parts
            const partNumbers = Object.keys(partIds).slice(0, Math.min(3, partIds.length));
            for (let j = 0; j < Math.min(2, partNumbers.length); j++) {
              await client.query(
                `INSERT INTO jobcard_spareparts (jobcard_id, part_id, quantity, unit_price, total_price)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  jobcardId,
                  partIds[j],
                  j + 1,
                  [45.99, 12.99, 18.50][j],
                  [45.99, 12.99, 18.50][j] * (j + 1)
                ]
              );
            }
            
            // Create invoice if jobcard is completed
            if (i % 2 === 1) {
              await client.query(
                `INSERT INTO invoices (jobcard_id, customer_id, parts_total, labor_total, grand_total, status, payment_method)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  jobcardId,
                  booking.customer_id,
                  [45.99 * 2, 12.99 * 2][i % 2],
                  [50, 75][i % 2] * 10,
                  [45.99 * 2 + 500, 12.99 * 2 + 750][i % 2],
                  'paid',
                  ['cash', 'card', 'bank transfer'][i % 3]
                ]
              );
            }
          }
        }
      }
      console.log('✓ Sample job cards, tasks, and invoices created');
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Database seeded successfully!',
      usersCreated: customerIds.length + mechanicIds.length + 1,
      partsCreated: partIds.length,
      vehiclesCreated: vehicleIds.length,
      bookingsCreated: bookingIds.length
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  } finally {
    client.release();
  }
};