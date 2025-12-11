import { query } from '../config/database.js';

export const createVehicle = async (req, res) => {
  try {
    const { vin, model, year, engine_type, make, registration_number, mileage } = req.body;
    const customerId = req.user.role === 'customer' ? req.user.id : req.body.customer_id;
    
    const result = await query(
      `INSERT INTO vehicles (customer_id, vin, model, year, engine_type, make, registration_number, mileage) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [customerId, vin, model, year, engine_type, make, registration_number, mileage || 0]
    );
    
    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Vehicle with this VIN already exists' });
    }
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVehicles = async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract search and sort parameters
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    let queryText = `
      SELECT v.*, u.name as customer_name, u.email as customer_email 
      FROM vehicles v 
      JOIN users u ON v.customer_id = u.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM vehicles v 
      JOIN users u ON v.customer_id = u.id
    `;
    
    const params = [];
    const countParams = [];
    const conditions = [];
    
    // Add search condition if provided
    if (search) {
      conditions.push(`(v.make ILIKE $${params.length + 1} OR v.model ILIKE $${params.length + 1} OR v.vin ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    // Add role-based filtering
    if (req.user.role === 'customer') {
      conditions.push(`v.customer_id = $${params.length + 1}`);
      params.push(req.user.id);
      countParams.push(req.user.id);
    } else if (req.query.customer_id) {
      conditions.push(`v.customer_id = $${params.length + 1}`);
      params.push(req.query.customer_id);
      countParams.push(req.query.customer_id);
    }
    
    // Apply conditions to both queries
    if (conditions.length > 0) {
      const conditionString = conditions.join(' AND ');
      queryText += ' WHERE ' + conditionString;
      countQuery += ' WHERE ' + conditionString;
    }
    
    // Add sorting
    const validSortColumns = ['make', 'model', 'year', 'vin', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryText += ` ORDER BY v.${sortColumn} ${sortOrder}`;
    
    // Add pagination
    queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    // Execute both queries
    const [result, countResult] = await Promise.all([
      query(queryText, params),
      query(countQuery, countParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({ 
      vehicles: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserVehicles = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const result = await query(
      `SELECT v.*, u.name as customer_name, u.email as customer_email 
       FROM vehicles v 
       JOIN users u ON v.customer_id = u.id
       WHERE v.customer_id = $1
       ORDER BY v.created_at DESC`,
      [userId]
    );
    
    res.json({ vehicles: result.rows });
  } catch (error) {
    console.error('Get user vehicles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
       FROM vehicles v 
       JOIN users u ON v.customer_id = u.id 
       WHERE v.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { model, year, engine_type, make, registration_number, mileage } = req.body;
    
    const result = await query(
      `UPDATE vehicles 
       SET model = COALESCE($1, model), 
           year = COALESCE($2, year), 
           engine_type = COALESCE($3, engine_type),
           make = COALESCE($4, make),
           registration_number = COALESCE($5, registration_number),
           mileage = COALESCE($6, mileage),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [model, year, engine_type, make, registration_number, mileage, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json({
      message: 'Vehicle updated successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    // For customers, verify they own the vehicle before allowing deletion
    if (req.user.role === 'customer') {
      const vehicleCheck = await query(
        'SELECT id FROM vehicles WHERE id = $1 AND customer_id = $2',
        [req.params.id, req.user.id]
      );
      
      if (vehicleCheck.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You can only delete your own vehicles.' 
        });
      }
    }
    
    const result = await query(
      'DELETE FROM vehicles WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVehicleHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT j.*, u.name as mechanic_name, i.grand_total, i.status as payment_status
       FROM jobcards j
       LEFT JOIN users u ON j.mechanic_id = u.id
       LEFT JOIN invoices i ON j.id = i.jobcard_id
       WHERE j.vehicle_id = $1
       ORDER BY j.created_at DESC`,
      [req.params.id]
    );
    
    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get vehicle history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};