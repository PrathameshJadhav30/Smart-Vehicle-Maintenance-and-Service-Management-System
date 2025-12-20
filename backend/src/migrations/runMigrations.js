import { query, getClient } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'mechanic', 'admin')),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_users_email' AND n.nspname = 'public') THEN
          CREATE INDEX idx_users_email ON users(email);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_users_role' AND n.nspname = 'public') THEN
          CREATE INDEX idx_users_role ON users(role);
        END IF;
      END $$;
    `
  },
  {
    name: '002_create_vehicles_table',
    up: `
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vin VARCHAR(17) UNIQUE NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        engine_type VARCHAR(100),
        mileage INTEGER DEFAULT 0,
        last_service_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_vehicles_customer' AND n.nspname = 'public') THEN
          CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_vehicles_vin' AND n.nspname = 'public') THEN
          CREATE INDEX idx_vehicles_vin ON vehicles(vin);
        END IF;
      END $$;
    `
  },
  {
    name: '003_create_bookings_table',
    up: `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        service_type VARCHAR(255) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'confirmed', 'rejected', 'completed', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_customer' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_customer ON bookings(customer_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_status ON bookings(status);
        END IF;
      END $$;
    `
  },
  {
    name: '004_create_parts_table',
    up: `
      CREATE TABLE IF NOT EXISTS parts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        part_number VARCHAR(100) UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 10,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_quantity' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_quantity ON parts(quantity);
        END IF;
      END $$;
    `
  },
  {
    name: '005_create_jobcards_table',
    up: `
      CREATE TABLE IF NOT EXISTS jobcards (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        mechanic_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        labor_cost DECIMAL(10, 2) DEFAULT 0,
        total_cost DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
        progress_notes TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_customer' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_customer ON jobcards(customer_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_mechanic' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_mechanic ON jobcards(mechanic_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_status ON jobcards(status);
        END IF;
      END $$;
    `
  },
  {
    name: '006_create_jobcard_tasks_table',
    up: `
      CREATE TABLE IF NOT EXISTS jobcard_tasks (
        id SERIAL PRIMARY KEY,
        jobcard_id INTEGER NOT NULL REFERENCES jobcards(id) ON DELETE CASCADE,
        task_name VARCHAR(255) NOT NULL,
        task_cost DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcard_tasks_jobcard' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcard_tasks_jobcard ON jobcard_tasks(jobcard_id);
        END IF;
      END $$;
    `
  },
  {
    name: '007_create_jobcard_spareparts_table',
    up: `
      CREATE TABLE IF NOT EXISTS jobcard_spareparts (
        id SERIAL PRIMARY KEY,
        jobcard_id INTEGER NOT NULL REFERENCES jobcards(id) ON DELETE CASCADE,
        part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcard_spareparts_jobcard' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcard_spareparts_jobcard ON jobcard_spareparts(jobcard_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcard_spareparts_part' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcard_spareparts_part ON jobcard_spareparts(part_id);
        END IF;
      END $$;
    `
  },
  {
    name: '008_create_invoices_table',
    up: `
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        jobcard_id INTEGER NOT NULL REFERENCES jobcards(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parts_total DECIMAL(10, 2) DEFAULT 0,
        labor_total DECIMAL(10, 2) DEFAULT 0,
        grand_total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled')),
        payment_method VARCHAR(50),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_customer' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_customer ON invoices(customer_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_status ON invoices(status);
        END IF;
      END $$;
    `
  },
  {
    name: '009_create_suppliers_table',
    up: `
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_suppliers_name' AND n.nspname = 'public') THEN
          CREATE INDEX idx_suppliers_name ON suppliers(name);
        END IF;
      END $$;
    `
  },
  {
    name: '010_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: '011_alter_jobcards_table_make_customer_id_nullable',
    up: `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobcards' AND column_name = 'customer_id' AND is_nullable = 'NO') THEN
          ALTER TABLE jobcards ALTER COLUMN customer_id DROP NOT NULL;
        END IF;
      END $$;
    `
  },
  {
    name: '012_alter_bookings_table_add_confirmed_status',
    up: `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bookings_status_check') THEN
          ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
        END IF;
        
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'approved', 'confirmed', 'rejected', 'completed', 'cancelled'));
      END $$;
    `
  },
  {
    name: '013_alter_vehicles_table_add_make_and_registration',
    up: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'make') THEN
          ALTER TABLE vehicles ADD COLUMN make VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'registration_number') THEN
          ALTER TABLE vehicles ADD COLUMN registration_number VARCHAR(50);
        END IF;
      END $$;
    `
  },
  {
    name: '014_alter_vehicles_table_add_mileage',
    up: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'mileage') THEN
          ALTER TABLE vehicles ADD COLUMN mileage INTEGER DEFAULT 0;
        END IF;
      END $$;
    `
  },
  {
    name: '015_add_performance_indexes',
    up: `
      -- Indexes for vehicle search and sorting
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_vehicles_make_model' AND n.nspname = 'public') THEN
          CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_vehicles_year' AND n.nspname = 'public') THEN
          CREATE INDEX idx_vehicles_year ON vehicles(year);
        END IF;
      END $$;
      
      -- Indexes for booking search and sorting
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_date' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_date ON bookings(booking_date);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_vehicle' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_created_at' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_created_at ON bookings(created_at);
        END IF;
      END $$;
      
      -- Composite indexes for common query patterns
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_customer_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_date_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_date_status ON bookings(booking_date, status);
        END IF;
      END $$;
      
      -- Indexes for jobcards
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_booking' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_booking ON jobcards(booking_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_vehicle' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_vehicle ON jobcards(vehicle_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_created_at' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_created_at ON jobcards(created_at);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_completed_at' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_completed_at ON jobcards(completed_at);
        END IF;
      END $$;
      
      -- Composite indexes for jobcards
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_mechanic_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_mechanic_status ON jobcards(mechanic_id, status);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_jobcards_vehicle_status' AND n.nspname = 'public') THEN
          CREATE INDEX idx_jobcards_vehicle_status ON jobcards(vehicle_id, status);
        END IF;
      END $$;
      
      -- Indexes for parts
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_name' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_name ON parts(name);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_part_number' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_part_number ON parts(part_number);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_price' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_price ON parts(price);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_reorder_level' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_reorder_level ON parts(reorder_level);
        END IF;
      END $$;
      
      -- Indexes for invoices
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_jobcard' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_jobcard ON invoices(jobcard_id);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_created_at' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_created_at ON invoices(created_at);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_paid_at' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_paid_at ON invoices(paid_at);
        END IF;
      END $$;
      
      -- Composite indexes for invoices
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_customer_created' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_customer_created ON invoices(customer_id, created_at);
        END IF;
      END $$;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_invoices_status_created' AND n.nspname = 'public') THEN
          CREATE INDEX idx_invoices_status_created ON invoices(status, created_at);
        END IF;
      END $$;
    `
  },
  {
    name: '016_update_bookings_status_constraint',
    up: `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bookings_status_check') THEN
          ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
        END IF;
        
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'approved', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected'));
      END $$;
    `
  },
  {
    name: '017_update_jobcards_status_constraint',
    up: `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'jobcards_status_check') THEN
          ALTER TABLE jobcards DROP CONSTRAINT jobcards_status_check;
        END IF;
        
        ALTER TABLE jobcards 
        ADD CONSTRAINT jobcards_status_check 
        CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));
      END $$;
    `
  },
  {
    name: '018_alter_bookings_table_add_mechanic_id',
    up: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'mechanic_id') THEN
          ALTER TABLE bookings ADD COLUMN mechanic_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_bookings_mechanic' AND n.nspname = 'public') THEN
          CREATE INDEX idx_bookings_mechanic ON bookings(mechanic_id);
        END IF;
      END $$;
    `
  },
  {
    name: '019_alter_jobcards_table_add_estimated_hours_and_priority',
    up: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobcards' AND column_name = 'estimated_hours') THEN
          ALTER TABLE jobcards ADD COLUMN estimated_hours DECIMAL(5, 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobcards' AND column_name = 'priority') THEN
          ALTER TABLE jobcards ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
        END IF;
        
        -- Update existing records to have default priority
        UPDATE jobcards SET priority = 'medium' WHERE priority IS NULL;
      END $$;
    `
  },
  {
    name: '020_alter_parts_table_add_supplier_id',
    up: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parts' AND column_name = 'supplier_id') THEN
          ALTER TABLE parts ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parts_supplier' AND n.nspname = 'public') THEN
          CREATE INDEX idx_parts_supplier ON parts(supplier_id);
        END IF;
      END $$;
    `
  },
  {
    name: '021_alter_bookings_table_add_estimated_cost',
    up: `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'estimated_cost') THEN
          ALTER TABLE bookings ADD COLUMN estimated_cost DECIMAL(10, 2) DEFAULT 0;
        END IF;
      END $$;
      
      CREATE INDEX IF NOT EXISTS idx_bookings_estimated_cost ON bookings(estimated_cost);
    `
  },
  {
    name: '022_create_refresh_tokens_table',
    up: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `
  }
];

async function runMigrations() {
  const client = await getClient();
  
  try {
    console.log('Starting database migrations...');
    
    await client.query('BEGIN');
    
    // Create migrations table first (if it doesn't exist)
    await client.query(migrations.find(m => m.name === '010_create_migrations_table').up);
    
    // Get already executed migrations
    const result = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(result.rows.map(row => row.name));
    
    // Run pending migrations
    for (const migration of migrations) {
      if (migration.name !== '010_create_migrations_table' && !executedMigrations.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await client.query(migration.up);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        console.log(`✓ ${migration.name} completed`);
      } else if (migration.name !== '010_create_migrations_table') {
        console.log(`⊘ ${migration.name} already executed`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});