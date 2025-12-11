import { query, getClient } from '../config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  const client = await getClient();
  
  try {
    console.log('Starting database seeding...');
    
    await client.query('BEGIN');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone, address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Admin User', 'admin@svmms.com', adminPassword, 'admin', '1234567890', '123 Admin St, Service Center HQ']
    );
    const adminId = adminResult.rows[0]?.id;
    console.log('✓ Admin user created');
    
    // Create multiple mechanic users
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
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [name, email, mechanicPassword, 'mechanic', phone, address]
      );
      if (result.rows[0]) {
        mechanicIds.push(result.rows[0].id);
      }
    }
    console.log('✓ Mechanic users created');
    
    // Create multiple customer users
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
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [name, email, customerPassword, 'customer', phone, address]
      );
      if (result.rows[0]) {
        customerIds.push(result.rows[0].id);
      }
    }
    console.log('✓ Customer users created');
    
    // Seed comprehensive parts inventory
    const parts = [
      ['Engine Oil - 5W-30', 'OIL-001', 45.99, 100, 20, '5W-30 Synthetic Motor Oil'],
      ['Engine Oil - 10W-40', 'OIL-002', 42.99, 85, 20, '10W-40 Synthetic Motor Oil'],
      ['Oil Filter - Standard', 'FILTER-001', 12.99, 150, 30, 'Standard Oil Filter'],
      ['Oil Filter - Premium', 'FILTER-001-P', 18.99, 100, 20, 'Premium Oil Filter'],
      ['Air Filter - Sedan', 'FILTER-002', 18.50, 80, 15, 'High Performance Air Filter'],
      ['Air Filter - SUV', 'FILTER-003', 24.50, 60, 12, 'Heavy Duty Air Filter'],
      ['Brake Pads - Front', 'BRAKE-001', 89.99, 50, 10, 'Ceramic Brake Pads Front'],
      ['Brake Pads - Rear', 'BRAKE-002', 79.99, 50, 10, 'Ceramic Brake Pads Rear'],
      ['Brake Rotors - Front', 'BRAKE-003', 145.00, 25, 8, 'Brake Rotors Front'],
      ['Spark Plugs Set', 'SPARK-001', 34.99, 120, 25, 'Iridium Spark Plugs 4-pack'],
      ['Battery - 12V 60Ah', 'BAT-001', 159.99, 30, 5, '12V 60Ah Car Battery'],
      ['Battery - 12V 75Ah', 'BAT-002', 189.99, 20, 5, '12V 75Ah Car Battery'],
      ['Wiper Blades', 'WIPER-001', 24.99, 60, 12, 'All-Season Wiper Blades 24"'],
      ['Wiper Blades Rear', 'WIPER-002', 19.99, 45, 10, 'All-Season Rear Wiper Blade'],
      ['Coolant - Pink', 'COOL-001', 19.99, 75, 15, 'Engine Coolant 50/50 - Pink'],
      ['Coolant - Green', 'COOL-002', 18.99, 80, 15, 'Engine Coolant 50/50 - Green'],
      ['Transmission Fluid', 'TRANS-001', 29.99, 40, 8, 'ATF Transmission Fluid'],
      ['Power Steering Fluid', 'PSF-001', 24.99, 35, 8, 'Power Steering Fluid'],
      ['Brake Fluid DOT4', 'BF-001', 14.99, 50, 10, 'Brake Fluid DOT4'],
      ['Cabin Air Filter', 'CAB-001', 16.99, 70, 15, 'Cabin Air Filter'],
      ['Timing Belt Kit', 'TIMING-001', 249.99, 10, 3, 'Complete Timing Belt Kit'],
      ['Water Pump', 'WATER-001', 89.99, 15, 5, 'Engine Water Pump'],
      ['Alternator', 'ALT-001', 199.99, 12, 3, 'Car Alternator 100A'],
      ['Starter Motor', 'START-001', 179.99, 10, 3, 'Starter Motor'],
      ['Door Seal Strip', 'SEAL-001', 34.99, 40, 10, 'Door Weather Seal Strip 5m']
    ];
    
    const partMap = {};
    for (const [name, partNumber, price, quantity, reorderLevel, description] of parts) {
      const result = await client.query(
        `INSERT INTO parts (name, part_number, price, quantity, reorder_level, description) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (part_number) DO NOTHING
         RETURNING id`,
        [name, partNumber, price, quantity, reorderLevel, description]
      );
      if (result.rows[0]) {
        partMap[partNumber] = result.rows[0].id;
      }
    }
    console.log('✓ Sample parts inventory created');
    
    // Create sample vehicles for customers
    const vehicles = [
      [customerIds[0], '1HGBH41JXMN109186', 'Honda Accord', 2020, 'V6'],
      [customerIds[0], 'WBADT43462G917547', 'BMW 3 Series', 2018, 'Turbo 4-Cyl'],
      [customerIds[1], '5TDJKRFH8LS123456', 'Toyota Highlander', 2019, 'V6'],
      [customerIds[1], 'JH2RC5004LM200015', 'Honda CBR', 2021, 'Engine'],
      [customerIds[2], 'JTDKN3AU5D0051234', 'Toyota Corolla', 2017, '1.8L 4-Cyl'],
      [customerIds[2], '3G1FP1RE8DS565678', 'Chevrolet Cruze', 2016, '1.6L Turbo'],
      [customerIds[3], 'VIN2G4GF5E30F9123456', 'Chevrolet Equinox', 2015, 'V6']
    ];
    
    const vehicleIds = [];
    for (const [customerId, vin, model, year, engineType] of vehicles) {
      if (customerId) {
        const result = await client.query(
          `INSERT INTO vehicles (customer_id, vin, model, year, engine_type) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (vin) DO NOTHING
           RETURNING id`,
          [customerId, vin, model, year, engineType]
        );
        if (result.rows[0]) {
          vehicleIds.push(result.rows[0].id);
        }
      }
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
        `INSERT INTO bookings (customer_id, vehicle_id, service_type, booking_date, booking_time, status, notes, estimated_cost) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          customerIds[i % customerIds.length],
          vehicleIds[i],
          serviceTypes[i % serviceTypes.length],
          bookingDates[i].toISOString().split('T')[0],
          ['09:00', '10:30', '14:00', '15:30'][i],
          bookingStatuses[i],
          `Service requested for ${serviceTypes[i % serviceTypes.length]}`,
          Math.floor(Math.random() * 5000) + 1000 // Random estimated cost between 1000 and 6000
        ]
      );
      if (result.rows[0]) {
        bookingIds.push(result.rows[0].id);
      }
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
            const partNumbers = Object.keys(partMap).slice(0, Math.min(3, Object.keys(partMap).length));
            for (let j = 0; j < Math.min(2, partNumbers.length); j++) {
              const partNumber = partNumbers[j];
              await client.query(
                `INSERT INTO jobcard_spareparts (jobcard_id, part_id, quantity, unit_price, total_price)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  jobcardId,
                  partMap[partNumber],
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
    console.log('\n✓ Database seeding completed successfully!');
    console.log('\n═══════════════════════════════════════════');
    console.log('          TEST ACCOUNTS CREATED');
    console.log('═══════════════════════════════════════════');
    console.log('\nAdministrator:');
    console.log('  Email: admin@svmms.com');
    console.log('  Password: admin123');
    console.log('\nMechanics:');
    console.log('  Email: mechanic@svmms.com');
    console.log('  Password: mechanic123');
    console.log('  Email: sarah@svmms.com');
    console.log('  Password: mechanic123');
    console.log('  Email: mike@svmms.com');
    console.log('  Password: mechanic123');
    console.log('\nCustomers:');
    console.log('  Email: customer@svmms.com');
    console.log('  Password: customer123');
    console.log('  Email: john@svmms.com');
    console.log('  Password: customer123');
    console.log('  Email: alice@svmms.com');
    console.log('  Password: customer123');
    console.log('  Email: bob@svmms.com');
    console.log('  Password: customer123');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

seedData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
