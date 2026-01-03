import { query, getClient } from '../config/database.js';

/* -----------1. CREATE BOOKING (Customer)------------------- */
export const createBooking = async (req, res) => {
  try {
    const { vehicle_id, service_type, booking_date, booking_time, notes, estimated_cost } = req.body;
    const customerId = req.user.id;

    const result = await query(
      `INSERT INTO bookings (customer_id, vehicle_id, service_type, booking_date, booking_time, notes, status, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [customerId, vehicle_id, service_type, booking_date, booking_time, notes, estimated_cost || 0]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.rows[0]
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    2. GET CUSTOMER BOOKINGS
------------------------------------------------------------------- */
export const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.params.id || req.user.id;
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract search and status filter parameters
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    console.log('Fetching customer bookings for customer ID:', customerId);
    
    let queryText = `
      SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.year, v.make, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.customer_id = $1
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.customer_id = $1
    `;
    
    const params = [customerId];
    const countParams = [customerId];
    const conditions = [];
    
    // Add search condition if provided
    if (search) {
      const searchParamIndex = params.length + 1;
      conditions.push(`(u.name ILIKE $${searchParamIndex} OR v.model ILIKE $${searchParamIndex} OR v.vin ILIKE $${searchParamIndex} OR b.service_type ILIKE $${searchParamIndex})`);
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    // Add status condition if provided
    if (status) {
      const statusParamIndex = params.length + 1;
      conditions.push(`b.status = $${statusParamIndex}`);
      params.push(status);
      countParams.push(status);
    }
    
    // Apply conditions to both queries
    if (conditions.length > 0) {
      const conditionString = conditions.join(' AND ');
      queryText += ' AND ' + conditionString;
      countQuery += ' AND ' + conditionString;
    }
    
    // Add sorting and pagination
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;
    queryText += ` ORDER BY b.booking_date DESC, b.booking_time DESC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
    params.push(limit, offset);
    
    // Execute both queries
    const [result, countResult] = await Promise.all([
      query(queryText, params),
      query(countQuery, countParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    console.log('Customer bookings fetched successfully:', result.rows.length);
    
    res.json({ 
      bookings: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    3. GET PENDING BOOKINGS (Mechanic/Admin)
------------------------------------------------------------------- */
export const getPendingBookings = async (req, res) => {
  try {
    console.log('Fetching pending bookings...');
    
    const result = await query(
      `SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.year, v.make, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN users u ON b.customer_id = u.id
       WHERE b.status = 'pending'
       ORDER BY b.booking_date DESC, b.booking_time DESC`
    );
    
    console.log('Pending bookings fetched successfully:', result.rows.length);
    
    res.json({ bookings: result.rows });
    
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    4. GET MECHANIC BOOKINGS
------------------------------------------------------------------- */
export const getMechanicBookings = async (req, res) => {
  try {
    // For security, we should only allow mechanics to see their own bookings
    // If an admin is requesting, they can specify a mechanic ID
    const userRole = req.user.role;
    let mechanicId;
    
    if (userRole === 'admin' && req.params.id) {
      // Admin can specify which mechanic's bookings to fetch
      mechanicId = req.params.id;
    } else if (userRole === 'mechanic') {
      // Mechanics can only see their own bookings
      mechanicId = req.user.id;
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    console.log('Fetching mechanic bookings for mechanic ID:', mechanicId);

    const result = await query(
      `SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.year, v.make, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN users u ON b.customer_id = u.id
       WHERE b.mechanic_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [mechanicId]
    );
    
    console.log('Mechanic bookings fetched successfully:', result.rows.length);

    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Mechanic Booking Fetch Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    5. GET SERVICE CENTER BOOKINGS
------------------------------------------------------------------- */
export const getServiceCenterBookings = async (req, res) => {
  try {
    console.log('Fetching service center bookings for service center ID:', req.user.service_center_id);
    
    const result = await query(
      `SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.year, v.make, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
       FROM bookings b
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN users u ON b.customer_id = u.id
       WHERE b.service_center_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.service_center_id]
    );
    
    console.log('Service center bookings fetched successfully:', result.rows.length);
    
    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Get service center bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    6. GET ALL BOOKINGS (Admin)
------------------------------------------------------------------- */
export const getAllBookings = async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Extract search, sort, and status filter parameters
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'booking_date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    let queryText = `
      SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.make, v.year, u.name AS customer_name, u.phone AS customer_phone
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.customer_id = u.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.customer_id = u.id
    `;
    
    const params = [];
    const countParams = [];
    const conditions = [];
    
    // Add search condition if provided
    if (search) {
      conditions.push(`(u.name ILIKE $${params.length + 1} OR v.model ILIKE $${params.length + 1} OR v.vin ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    // Add status condition if provided
    if (status) {
      conditions.push(`b.status = $${params.length + 1}`);
      params.push(status);
      countParams.push(status);
    }
    
    // Apply conditions to both queries
    if (conditions.length > 0) {
      const conditionString = conditions.join(' AND ');
      queryText += ' WHERE ' + conditionString;
      countQuery += ' WHERE ' + conditionString;
    }
    
    // Add sorting
    const validSortColumns = ['booking_date', 'status', 'customer_name', 'model'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'booking_date';
    queryText += ` ORDER BY b.${sortColumn} ${sortOrder}`;
    
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
      bookings: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    5. APPROVE BOOKING + Create Jobcard
------------------------------------------------------------------- */
export const approveBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const result = await query(
      `UPDATE bookings SET status='approved', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [bookingId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = result.rows[0];

    res.json({ message: 'Booking approved', booking });

  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    6. REJECT BOOKING
------------------------------------------------------------------- */
export const rejectBooking = async (req, res) => {
  try {
    const result = await query(
      `UPDATE bookings SET status='rejected', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: 'Booking not found' });

    res.json({ message: 'Booking rejected', booking: result.rows[0] });

  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    7. CANCEL BOOKING
------------------------------------------------------------------- */
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const bookingResult = await query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);

    if (!bookingResult.rows.length)
      return res.status(404).json({ message: 'Booking not found' });

    if (userRole === 'customer' && bookingResult.rows[0].customer_id !== userId)
      return res.status(403).json({ message: 'Unauthorized' });

    const result = await query(
      `UPDATE bookings SET status='rejected', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [bookingId]
    );

    res.json({ message: 'Booking rejected', booking: result.rows[0] });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    8. RESCHEDULE BOOKING
------------------------------------------------------------------- */
export const rescheduleBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { newDateTime } = req.body;

    // Extract date and time from newDateTime object
    const { date, time } = newDateTime;
    
    // Combine date and time for the booking_date field
    const bookingDateTime = `${date} ${time}`;

    const result = await query(
      `UPDATE bookings SET booking_date=$1, status='pending', updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [bookingDateTime, bookingId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: 'Booking not found' });

    res.json({ message: 'Booking rescheduled', booking: result.rows[0] });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    9. GET BOOKINGS BY DATE RANGE
------------------------------------------------------------------- */
export const getBookingsByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    let queryText = `
      SELECT b.*, v.model, v.vin, u.name AS customer_name
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN users u ON b.customer_id = u.id
    `;

    const params = [];

    if (from && to) {
      queryText += ' WHERE b.booking_date BETWEEN $1 AND $2';
      params.push(from, to);
    } else if (from) {
      queryText += ' WHERE b.booking_date >= $1';
      params.push(from);
    } else if (to) {
      queryText += ' WHERE b.booking_date <= $1';
      params.push(to);
    }

    queryText += ' ORDER BY b.booking_date ASC';

    const result = await query(queryText, params);
    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Get bookings by date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/* ------------------------------------------------------------------
    10. UPDATE BOOKING STATUS (Admin/Mechanic)
------------------------------------------------------------------- */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    
    // Validate status
    const validStatuses = ['pending', 'approved', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await query(
      `UPDATE bookings SET status=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [status, bookingId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Booking status updated', booking: result.rows[0] });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Confirm a booking (Mechanic/Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const confirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const result = await query(
      `UPDATE bookings SET status='confirmed', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [bookingId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: 'Booking not found' });

    res.json({ message: 'Booking confirmed', booking: result.rows[0] });

  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Assign a booking to a mechanic (Mechanic/Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const assignBooking = async (req, res) => {
  const client = await getClient();
  
  try {
    const bookingId = req.params.id;
    const { mechanicId } = req.body;
    
    await client.query('BEGIN');
    
    // Update the booking
    const bookingResult = await client.query(
      `UPDATE bookings SET mechanic_id=$1, status='assigned', updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [mechanicId, bookingId]
    );
    
    if (!bookingResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Create a job card for this booking and assign it to the mechanic
    const jobCardResult = await client.query(
      `INSERT INTO jobcards (booking_id, customer_id, vehicle_id, mechanic_id, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [booking.id, booking.customer_id, booking.vehicle_id, mechanicId]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Booking assigned to mechanic and job card created', 
      booking: bookingResult.rows[0],
      jobcard: jobCardResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign booking error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};


/* ------------------------------------------------------------------
    20. GET BOOKING BY ID
------------------------------------------------------------------- */
export const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const result = await query(
      `SELECT b.id, b.customer_id, b.vehicle_id, b.service_type, b.booking_date, b.booking_time, b.status, b.notes, b.created_at, b.updated_at, b.mechanic_id, b.estimated_cost, v.model, v.vin, v.year, v.make, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
