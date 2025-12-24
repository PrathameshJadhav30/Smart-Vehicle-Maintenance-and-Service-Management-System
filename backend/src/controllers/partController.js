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
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract search parameter
    const search = req.query.search || '';
    
    // Build query with search and pagination
    let baseQuery = `
      SELECT p.*, s.name as supplier_name 
      FROM parts p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
    `;
    
    let countQuery = `SELECT COUNT(*) as count FROM parts p LEFT JOIN suppliers s ON p.supplier_id = s.id `;
    
    let params = [];
    let countParams = [];
    
    // Add search condition if provided
    if (search) {
      const searchCondition = `WHERE p.name ILIKE $1 OR p.part_number ILIKE $1 OR p.description ILIKE $1`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      params = [`%${search}%`];
      countParams = [`%${search}%`];
    }
    
    baseQuery += ` ORDER BY p.name ASC LIMIT $${search ? '2' : '1'} OFFSET $${search ? '3' : '2'}`;
    params.push(limit, offset);
    
    // Check cache first (only for default parameters)
    const cacheKey = `all_parts_page_${page}_limit_${limit}_search_${search}`;
    if (!search && page === 1 && limit === 10 && cache.has('all_parts')) {
      console.log('Returning cached parts data');
      const cachedData = cache.get('all_parts');
      // Validate that cached data is not empty or stale
      if (cachedData && Array.isArray(cachedData.parts)) {
        return res.json(cachedData);
      } else {
        // Clear invalid cache entry
        cache.delete('all_parts');
      }
    }

    // Execute the queries
    const [partsResult, countResult] = await Promise.all([
      query(baseQuery, params),
      query(countQuery, countParams)
    ]);
    
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    const responseData = {
      parts: partsResult.rows || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    };
    
    // Cache the result for 1 minute (only for default parameters)
    if (!search && page === 1 && limit === 10) {
      cache.set('all_parts', responseData, 60000);
    }
    
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
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build query with pagination
    let baseQuery = `
      SELECT p.*, s.name as supplier_name 
      FROM parts p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.quantity <= p.reorder_level 
      ORDER BY p.quantity ASC
      LIMIT $1 OFFSET $2
    `;
    
    let countQuery = `SELECT COUNT(*) as count FROM parts p WHERE p.quantity <= p.reorder_level`;
    
    // Check cache first (only for default parameters)
    const cacheKey = `low_stock_parts_page_${page}_limit_${limit}`;
    if (page === 1 && limit === 10 && cache.has('low_stock_parts')) {
      console.log('Returning cached low stock parts data');
      const cachedData = cache.get('low_stock_parts');
      // Validate that cached data is not empty or stale
      if (cachedData && Array.isArray(cachedData.parts)) {
        return res.json(cachedData);
      } else {
        // Clear invalid cache entry
        cache.delete('low_stock_parts');
      }
    }

    // Execute the queries
    const [partsResult, countResult] = await Promise.all([
      query(baseQuery, [limit, offset]),
      query(countQuery)
    ]);
    
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    const responseData = {
      parts: partsResult.rows || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    };
    
    // Cache the result for 1 minute (only for default parameters)
    if (page === 1 && limit === 10) {
      cache.set('low_stock_parts', responseData, 60000);
    }
    
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
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract search parameter
    const search = req.query.search || '';
    
    // Build query with search and pagination
    let baseQuery = `SELECT * FROM suppliers `;
    
    let countQuery = `SELECT COUNT(*) as count FROM suppliers `;
    
    let params = [];
    let countParams = [];
    
    // Add search condition if provided
    if (search) {
      const searchCondition = `WHERE name ILIKE $1 OR contact_person ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR address ILIKE $1`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      params = [`%${search}%`];
      countParams = [`%${search}%`];
    }
    
    baseQuery += ` ORDER BY name ASC LIMIT $${search ? '2' : '1'} OFFSET $${search ? '3' : '2'}`;
    params.push(limit, offset);
    
    // Execute the queries
    const [suppliersResult, countResult] = await Promise.all([
      query(baseQuery, params),
      query(countQuery, countParams)
    ]);
    
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    const responseData = {
      suppliers: suppliersResult.rows || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages
      }
    };
    
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