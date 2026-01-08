import { getClient } from '../config/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  const client = await getClient();

  try {
    console.log('🔄 Starting Admin seeding...');

    await client.query('BEGIN');

    // Hash admin password
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Insert Admin User
    const result = await client.query(
      `
      INSERT INTO users (name, email, password_hash, role, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
      `,
      [
        'System Administrator',
        'admin@svmms.com',
        adminPassword,
        'admin',
        '9999999999',
        'SVMMS Head Office'
      ]
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin already exists (skipped)');
    }

    await client.query('COMMIT');

    console.log('\n════════════════════════════════════');
    console.log('        ADMIN LOGIN DETAILS');
    console.log('════════════════════════════════════');
    console.log(' Email    : admin@svmms.com');
    console.log(' Password : admin123');
    console.log(' Role     : ADMIN');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Admin seeding failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedAdmin();
