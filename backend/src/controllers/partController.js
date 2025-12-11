// controllers/partController.js
import { query } from '../config/database.js';
import cache from '../utils/cache.js';

// ==================== Parts ====================

export const createPart = async (req, res) => {
  try {
    const { name, part_number, price, quantity, reorder_level, description, supplier_id } = req.body;

    const result = await query(
      `INSERT INTO parts (name, part_number, price, quantity, reorder_level, description, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, part_number, price, quantity, reorder_level, description, supplier_id]
    );

    // Clear cache when parts are modified
    cache.delete('all_parts');
    cache.delete('low_stock_parts');

    res.status(201).json({
      message: 'Part added successfully',
      part: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Part number already exists' });
    }
    console.error('Create part error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getParts = async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'all_parts';
    if (cache.has(cacheKey)) {
      console.log('Returning cached parts data');
      const cachedData = cache.get(cacheKey);
      // Validate that cached data is not empty or stale
      if (cachedData && Array.isArray(cachedData.parts)) {
        return res.json(cachedData);
      } else {
        // Clear invalid cache entry
        cache.delete(cacheKey);
      }
    }

    const result = await query(`
      SELECT p.*, s.name as supplier_name 
      FROM parts p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      ORDER BY p.name ASC
    `);
    const responseData = { parts: result.rows || [] };
    
    // Cache the result for 1 minute
    cache.set(cacheKey, responseData, 60000);
    
    res.json(responseData);
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPartById = async (req, res) => {
  try {
    const partId = req.params.id;
    
    // Check cache first
    const cacheKey = `part_${partId}`;
    if (cache.has(cacheKey)) {
      console.log(`Returning cached part data for ID: ${partId}`);
      return res.json(cache.get(cacheKey));
    }

    const result = await query('SELECT * FROM parts WHERE id = $1', [partId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Part not found' });
    
    const responseData = { part: result.rows[0] };
    
    // Cache the result for 2 minutes
    cache.set(cacheKey, responseData, 120000);
    
    res.json(responseData);
  } catch (error) {
    console.error('Get part by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updatePart = async (req, res) => {
  try {
    const { name, price, quantity, reorder_level, description, supplier_id } = req.body;

    const result = await query(
      `UPDATE parts 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           quantity = COALESCE($3, quantity),
           reorder_level = COALESCE($4, reorder_level),
           description = COALESCE($5, description),
           supplier_id = COALESCE($6, supplier_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, price, quantity, reorder_level, description, supplier_id, req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Part not found' });

    // Clear cache when parts are modified
    cache.delete('all_parts');
    cache.delete('low_stock_parts');
    cache.delete(`part_${req.params.id}`);

    res.json({ message: 'Part updated successfully', part: result.rows[0] });
  } catch (error) {
    console.error('Update part error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deletePart = async (req, res) => {
  try {
    const result = await query('DELETE FROM parts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Part not found' });

    // Clear cache when parts are modified
    cache.delete('all_parts');
    cache.delete('low_stock_parts');
    cache.delete(`part_${req.params.id}`);

    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Delete part error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLowStockParts = async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'low_stock_parts';
    if (cache.has(cacheKey)) {
      console.log('Returning cached low stock parts data');
      const cachedData = cache.get(cacheKey);
      // Validate that cached data is not empty or stale
      if (cachedData && Array.isArray(cachedData.parts)) {
        return res.json(cachedData);
      } else {
        // Clear invalid cache entry
        cache.delete(cacheKey);
      }
    }

    const result = await query(`
      SELECT p.*, s.name as supplier_name 
      FROM parts p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.quantity <= p.reorder_level 
      ORDER BY p.quantity ASC
    `);
    const responseData = { parts: result.rows || [] };
    
    // Cache the result for 1 minute
    cache.set(cacheKey, responseData, 60000);
    
    res.json(responseData);
  } catch (error) {
    console.error('Get low stock parts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPartsUsage = async (req, res) => {
  try {
    const { from, to, partId } = req.query;

    let queryText = `
      SELECT p.id, p.name, p.part_number, SUM(js.quantity) as total_used,
             SUM(js.total_price) as total_revenue, DATE(js.created_at) as usage_date
      FROM parts p
      LEFT JOIN jobcard_spareparts js ON p.id = js.part_id
    `;

    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (from) { conditions.push(`js.created_at >= $${paramIndex}`); params.push(from); paramIndex++; }
    if (to) { conditions.push(`js.created_at <= $${paramIndex}`); params.push(to); paramIndex++; }
    if (partId) { conditions.push(`p.id = $${paramIndex}`); params.push(partId); paramIndex++; }

    if (conditions.length) queryText += ' WHERE ' + conditions.join(' AND ');

    queryText += ' GROUP BY p.id, p.name, p.part_number, DATE(js.created_at) ORDER BY usage_date DESC, total_used DESC';

    const result = await query(queryText, params);
    res.json({ partsUsage: result.rows || [] });
  } catch (error) {
    console.error('Get parts usage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== Suppliers ====================

export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;

    const result = await query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, contact_person, email, phone, address]
    );

    res.status(201).json({ message: 'Supplier added successfully', supplier: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Supplier with this name or email already exists' });
    }
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY name ASC');
    const responseData = { suppliers: result.rows || [] };
    res.json(responseData);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;

    const result = await query(
      `UPDATE suppliers 
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, contact_person, email, phone, address, req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Supplier not found' });

    res.json({ message: 'Supplier updated successfully', supplier: result.rows[0] });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};