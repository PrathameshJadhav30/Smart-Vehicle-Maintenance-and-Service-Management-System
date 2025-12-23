import { query, getClient } from '../config/database.js';

export const createJobCard = async (req, res) => {
  try {
    console.log('Received job card creation request:', req.body);
    
    const { customer_id, vehicle_id, booking_id, notes, estimated_hours, priority } = req.body;
    
    // Validate required fields
    if (vehicle_id === undefined || vehicle_id === null || vehicle_id === '') {
      return res.status(400).json({ message: 'Vehicle ID is required' });
    }
    
    // Validate data types
    const vehicleId = parseInt(vehicle_id);
    if (isNaN(vehicleId)) {
      return res.status(400).json({ message: 'Vehicle ID must be a valid number' });
    }
    
    let customerId = null;
    if (customer_id !== undefined && customer_id !== null && customer_id !== '') {
      customerId = parseInt(customer_id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: 'Customer ID must be a valid number' });
      }
    }
    
    let bookingId = null;
    if (booking_id !== undefined && booking_id !== null && booking_id !== '') {
      bookingId = parseInt(booking_id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: 'Booking ID must be a valid number' });
      }
    }
    
    // Validate estimated_hours if provided
    let estimatedHours = null;
    if (estimated_hours !== undefined && estimated_hours !== null && estimated_hours !== '') {
      estimatedHours = parseFloat(estimated_hours);
      if (isNaN(estimatedHours) || estimatedHours < 0) {
        return res.status(400).json({ message: 'Estimated hours must be a valid positive number' });
      }
    }
    
    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    let priorityValue = 'medium'; // default value
    if (priority !== undefined && priority !== null && priority !== '') {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Priority must be one of: low, medium, high' });
      }
      priorityValue = priority;
    }
    
    // Check if vehicle exists
    const vehicleResult = await query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
    if (vehicleResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }
    
    // Check if customer exists (if provided)
    if (customerId !== null) {
      const customerResult = await query('SELECT id FROM users WHERE id = $1 AND role = $2', [customerId, 'customer']);
      if (customerResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid customer ID or user is not a customer' });
      }
    }
    
    // Check if booking exists (if provided)
    if (bookingId !== null) {
      const bookingResult = await query('SELECT id FROM bookings WHERE id = $1', [bookingId]);
      if (bookingResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }
    }
    
    // Get the mechanic ID from the authenticated user
    const mechanicId = req.user.id;
    
    const result = await query(
      `INSERT INTO jobcards (customer_id, vehicle_id, booking_id, mechanic_id, notes, estimated_hours, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'in_progress')
       RETURNING *`,
      [
        customerId, 
        vehicleId, 
        bookingId, 
        mechanicId, // Automatically assign to the mechanic who created it
        notes || '',
        estimatedHours,
        priorityValue
      ]
    );
    
    res.status(201).json({
      message: 'Job card created successfully',
      jobcard: result.rows[0]
    });
  } catch (error) {
    console.error('Create jobcard error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const getJobCards = async (req, res) => {
  try {
    let queryText = `
      SELECT j.*, v.model, v.vin, u.name as customer_name, u.email as customer_email, m.name as mechanic_name
      FROM jobcards j
      JOIN vehicles v ON j.vehicle_id = v.id
      JOIN users u ON j.customer_id = u.id
      LEFT JOIN users m ON j.mechanic_id = m.id
    `;
    const params = [];
    const conditions = [];
    
    // Add status filter if provided
    if (req.query.status) {
      conditions.push(`j.status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    
    // Add mechanic filter if provided
    if (req.query.mechanic_id) {
      conditions.push(`j.mechanic_id = $${params.length + 1}`);
      params.push(req.query.mechanic_id);
    }
    
    // Add conditions to query if any exist
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += ' ORDER BY j.created_at DESC';
    
    const result = await query(queryText, params);
    res.json({ jobcards: result.rows });
  } catch (error) {
    console.error('Get jobcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getJobCardById = async (req, res) => {
  try {
    // Ensure ID is a valid integer
    const jobcardId = parseInt(req.params.id);
    if (isNaN(jobcardId)) {
      return res.status(400).json({ message: 'Invalid job card ID' });
    }
    
    const jobcardResult = await query(
      `SELECT j.*, v.model, v.vin, v.year, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, m.name as mechanic_name
       FROM jobcards j
       LEFT JOIN vehicles v ON j.vehicle_id = v.id
       LEFT JOIN users u ON j.customer_id = u.id
       LEFT JOIN users m ON j.mechanic_id = m.id
       WHERE j.id = $1`,
      [jobcardId]
    );
    
    if (jobcardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    const tasksResult = await query(
      'SELECT * FROM jobcard_tasks WHERE jobcard_id = $1',
      [jobcardId]
    );
    
    const partsResult = await query(
      `SELECT js.*, p.name as part_name, p.part_number
       FROM jobcard_spareparts js
       LEFT JOIN parts p ON js.part_id = p.id
       WHERE js.jobcard_id = $1`,
      [jobcardId]
    );
    
    res.json({
      jobcard: jobcardResult.rows[0],
      tasks: tasksResult.rows,
      parts: partsResult.rows
    });
  } catch (error) {
    console.error('Get jobcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getJobCardByBookingId = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    // For mechanics, verify they have access to this job card
    if (req.user.role === 'mechanic') {
      const result = await query(
        `SELECT j.*, v.model, v.vin, v.year, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, m.name as mechanic_name
         FROM jobcards j
         LEFT JOIN vehicles v ON j.vehicle_id = v.id
         LEFT JOIN users u ON j.customer_id = u.id
         LEFT JOIN users m ON j.mechanic_id = m.id
         WHERE j.booking_id = $1 AND j.mechanic_id = $2`,
        [bookingId, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({ 
          message: 'Access denied. You can only access job cards assigned to you.' 
        });
      }
      
      return res.json({ jobcard: result.rows[0] });
    }
    
    // For admins, allow access to any job card
    const result = await query(
      `SELECT j.*, v.model, v.vin, v.year, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, m.name as mechanic_name
       FROM jobcards j
       LEFT JOIN vehicles v ON j.vehicle_id = v.id
       LEFT JOIN users u ON j.customer_id = u.id
       LEFT JOIN users m ON j.mechanic_id = m.id
       WHERE j.booking_id = $1`,
      [bookingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found for this booking' });
    }
    
    res.json({ jobcard: result.rows[0] });
  } catch (error) {
    console.error('Get jobcard by booking ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addTask = async (req, res) => {
  const client = await getClient();
  
  try {
    const { task_name, task_cost } = req.body;
    const jobcardId = req.params.id;
    
    // Validate job card ID
    const parsedJobcardId = parseInt(jobcardId);
    if (isNaN(parsedJobcardId)) {
      return res.status(400).json({ 
        message: 'Invalid job card ID format' 
      });
    }
    
    // Check if job card exists
    const jobcardExists = await client.query(
      'SELECT id FROM jobcards WHERE id = $1',
      [parsedJobcardId]
    );
    
    if (jobcardExists.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    // For mechanics, verify they own the job card before allowing updates
    if (req.user.role === 'mechanic') {
      const jobcardCheck = await client.query(
        'SELECT id FROM jobcards WHERE id = $1 AND mechanic_id = $2',
        [parsedJobcardId, req.user.id]
      );
      
      if (jobcardCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          message: 'Access denied. You can only update job cards assigned to you.' 
        });
      }
    }
    
    await client.query('BEGIN');
    
    // Add task
    const taskResult = await client.query(
      `INSERT INTO jobcard_tasks (jobcard_id, task_name, task_cost)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [parsedJobcardId, task_name, task_cost]
    );
    
    // Update jobcard labor cost
    await client.query(
      `UPDATE jobcards 
       SET labor_cost = labor_cost + $1,
           total_cost = total_cost + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [task_cost, parsedJobcardId]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Task added successfully',
      task: taskResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add task error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const assignMechanic = async (req, res) => {
  try {
    const { mechanic_id } = req.body;
    const jobcardId = req.params.id;
    
    const result = await query(
      `UPDATE jobcards 
       SET mechanic_id = $1,
           status = 'in_progress',
           started_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [mechanic_id, jobcardId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    res.json({
      message: 'Mechanic assigned successfully',
      jobcard: result.rows[0]
    });
  } catch (error) {
    console.error('Assign mechanic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addSparePart = async (req, res) => {
  const client = await getClient();
  
  try {
    const { part_id, quantity } = req.body;
    const jobcardId = req.params.id;
    
    // Validate job card ID
    const parsedJobcardId = parseInt(jobcardId);
    if (isNaN(parsedJobcardId)) {
      return res.status(400).json({ 
        message: 'Invalid job card ID format' 
      });
    }
    
    // Check if job card exists
    const jobcardExists = await client.query(
      'SELECT id FROM jobcards WHERE id = $1',
      [parsedJobcardId]
    );
    
    if (jobcardExists.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    // For mechanics, verify they own the job card before allowing updates
    if (req.user.role === 'mechanic') {
      const jobcardCheck = await client.query(
        'SELECT id FROM jobcards WHERE id = $1 AND mechanic_id = $2',
        [parsedJobcardId, req.user.id]
      );
      
      if (jobcardCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          message: 'Access denied. You can only update job cards assigned to you.' 
        });
      }
    }
    
    await client.query('BEGIN');
    
    // Get part details
    const partResult = await client.query(
      'SELECT * FROM parts WHERE id = $1',
      [part_id]
    );
    
    if (partResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Part not found' });
    }
    
    const part = partResult.rows[0];
    
    // Check stock
    if (part.quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    const totalPrice = part.price * quantity;
    
    // Add spare part to jobcard
    const sparePartResult = await client.query(
      `INSERT INTO jobcard_spareparts (jobcard_id, part_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parsedJobcardId, part_id, quantity, part.price, totalPrice]
    );
    
    // Update part quantity
    await client.query(
      `UPDATE parts 
       SET quantity = quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, part_id]
    );
    
    // Clear cache when parts are modified
    const cache = (await import('../utils/cache.js')).default;
    cache.delete('all_parts');
    cache.delete('low_stock_parts');
    
    // Update jobcard total cost
    await client.query(
      `UPDATE jobcards 
       SET total_cost = total_cost + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [totalPrice, parsedJobcardId]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Spare part added successfully',
      sparePart: sparePartResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add spare part error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const updateStatus = async (req, res) => {
  const client = await getClient();
  
  try {
    const { status } = req.body;
    const jobcardId = req.params.id;
    
    // Validate job card ID
    const parsedJobcardId = parseInt(jobcardId);
    if (isNaN(parsedJobcardId)) {
      return res.status(400).json({ 
        message: 'Invalid job card ID format' 
      });
    }
    
    // Check if job card exists
    const jobcardExists = await client.query(
      'SELECT id FROM jobcards WHERE id = $1',
      [parsedJobcardId]
    );
    
    if (jobcardExists.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // For mechanics, verify they own the job card before allowing updates
    if (req.user.role === 'mechanic') {
      const jobcardCheck = await client.query(
        'SELECT id FROM jobcards WHERE id = $1 AND mechanic_id = $2',
        [parsedJobcardId, req.user.id]
      );
      
      if (jobcardCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          message: 'Access denied. You can only update job cards assigned to you.' 
        });
      }
    }
    
    // Update job card status
    const result = await client.query(
      `UPDATE jobcards 
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
           ${status === 'completed' ? ', completed_at = CURRENT_TIMESTAMP' : ''}
           ${status === 'in_progress' ? ', started_at = CURRENT_TIMESTAMP' : ''}
       WHERE id = $2
       RETURNING *`,
      [status, parsedJobcardId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    // If job card is completed, create an invoice and update booking status
    if (status === 'completed') {
      try {
        // Calculate parts total
        const partsResult = await client.query(
          'SELECT SUM(total_price) as parts_total FROM jobcard_spareparts WHERE jobcard_id = $1',
          [parsedJobcardId]
        );
        
        const partsTotal = partsResult.rows[0].parts_total || 0;
        const laborTotal = result.rows[0].labor_cost || 0;
        const grandTotal = parseFloat(partsTotal) + parseFloat(laborTotal);
        
        console.log('Creating invoice with totals:', { partsTotal, laborTotal, grandTotal });
        
        // Create invoice with explicit created_at timestamp
        const invoiceResult = await client.query(
          `INSERT INTO invoices (jobcard_id, customer_id, parts_total, labor_total, grand_total, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'unpaid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            parsedJobcardId,
            result.rows[0].customer_id,
            partsTotal,
            laborTotal,
            grandTotal
          ]
        );
        
        console.log('Invoice created for completed job card:', invoiceResult.rows[0]);
        
        // Update the associated booking status to 'completed' if it exists
        if (result.rows[0].booking_id) {
          const bookingUpdateResult = await client.query(
            `UPDATE bookings 
             SET status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [result.rows[0].booking_id]
          );
          
          if (bookingUpdateResult.rows.length > 0) {
            console.log('Booking status updated to completed:', bookingUpdateResult.rows[0]);
          } else {
            console.log('No booking found for job card:', parsedJobcardId);
          }
        }
      } catch (invoiceError) {
        console.error('Error creating invoice for completed job card:', invoiceError);
        // Don't fail the status update if invoice creation fails
      }
    }
    
    res.json({
      message: 'Job card status updated successfully',
      jobcard: result.rows[0]
    });
  } catch (error) {
    console.error('Update job card status error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const getCompletedJobCards = async (req, res) => {
  try {
    const result = await query(
      `SELECT j.*, v.model, v.vin, u.name as customer_name, u.email as customer_email, m.name as mechanic_name
       FROM jobcards j
       JOIN vehicles v ON j.vehicle_id = v.id
       JOIN users u ON j.customer_id = u.id
       LEFT JOIN users m ON j.mechanic_id = m.id
       WHERE j.status = 'completed'
       ORDER BY j.completed_at DESC`
    );
    
    res.json({ jobcards: result.rows });
  } catch (error) {
    console.error('Get completed jobcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProgress = async (req, res) => {
  const client = await getClient();
  
  try {
    const { percentComplete, notes } = req.body;
    const jobcardId = req.params.id;
    
    // Validate job card ID
    const parsedJobcardId = parseInt(jobcardId);
    if (isNaN(parsedJobcardId)) {
      return res.status(400).json({ 
        message: 'Invalid job card ID format' 
      });
    }
    
    // Check if job card exists
    const jobcardExists = await client.query(
      'SELECT id FROM jobcards WHERE id = $1',
      [parsedJobcardId]
    );
    
    if (jobcardExists.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    // For mechanics, verify they own the job card before allowing updates
    if (req.user.role === 'mechanic') {
      const jobcardCheck = await client.query(
        'SELECT id FROM jobcards WHERE id = $1 AND mechanic_id = $2',
        [parsedJobcardId, req.user.id]
      );
      
      if (jobcardCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          message: 'Access denied. You can only update job cards assigned to you.' 
        });
      }
    }
    
    // Update job card progress
    const result = await client.query(
      `UPDATE jobcards 
       SET percent_complete = $1,
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [percentComplete, notes, parsedJobcardId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    res.json({
      message: 'Job card progress updated successfully',
      jobcard: result.rows[0]
    });
  } catch (error) {
    console.error('Update job card progress error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(404).json({ 
        message: 'Job card not found' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const getJobCardNotes = async (req, res) => {
  try {
    const result = await query(
      `SELECT progress_notes, created_at, updated_at
       FROM jobcards 
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    res.json({ notes: result.rows[0] });
  } catch (error) {
    console.error('Get job card notes error:', error);
    // Check if it's a column not found error
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      return res.status(400).json({ 
        message: 'Database schema error: Required columns missing. Please run database migrations.',
        error: 'MISSING_COLUMNS'
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get job cards by mechanic ID
export const getMechanicJobCards = async (req, res) => {
  try {
    const mechanicId = req.params.id;
    
    // First get the job cards
    const jobcardsResult = await query(
      `SELECT j.*, v.model, v.vin, v.year, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, b.service_type as service_type
       FROM jobcards j
       JOIN vehicles v ON j.vehicle_id = v.id
       JOIN users u ON j.customer_id = u.id
       LEFT JOIN bookings b ON j.booking_id = b.id
       WHERE j.mechanic_id = $1
       ORDER BY j.created_at DESC`,
      [mechanicId]
    );
    
    // Enhance each job card with tasks and parts data
    const jobcards = await Promise.all(jobcardsResult.rows.map(async (jobcard) => {
      // Get tasks for this job card
      const tasksResult = await query(
        'SELECT * FROM jobcard_tasks WHERE jobcard_id = $1',
        [jobcard.id]
      );
      
      // Get parts for this job card
      const partsResult = await query(
        `SELECT js.*, p.name as part_name
         FROM jobcard_spareparts js
         LEFT JOIN parts p ON js.part_id = p.id
         WHERE js.jobcard_id = $1`,
        [jobcard.id]
      );
      
      return {
        ...jobcard,
        tasks: tasksResult.rows,
        parts_used: partsResult.rows
      };
    }));
    
    res.json({ jobcards });
  } catch (error) {
    console.error('Get mechanic job cards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete job card (admin only)
export const deleteJobCard = async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const jobcardId = parseInt(req.params.id);
    if (isNaN(jobcardId)) {
      return res.status(400).json({ message: 'Invalid job card ID' });
    }
    
    // Delete related tasks
    await client.query(
      'DELETE FROM jobcard_tasks WHERE jobcard_id = $1',
      [jobcardId]
    );
    
    // Delete related spare parts
    await client.query(
      'DELETE FROM jobcard_spareparts WHERE jobcard_id = $1',
      [jobcardId]
    );
    
    // Delete the job card itself
    const result = await client.query(
      'DELETE FROM jobcards WHERE id = $1 RETURNING *',
      [jobcardId]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Job card not found' });
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Job card deleted successfully',
      jobcard: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete job card error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

