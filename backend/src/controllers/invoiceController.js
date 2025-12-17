import { query } from '../config/database.js';

export const createInvoice = async (req, res) => {
  try {
    const { jobcard_id, customer_id, parts_total, labor_total, grand_total } = req.body;
    
    const result = await query(
      `INSERT INTO invoices (jobcard_id, customer_id, parts_total, labor_total, grand_total, status)
       VALUES ($1, $2, $3, $4, $5, 'unpaid')
       RETURNING *`,
      [jobcard_id, customer_id, parts_total, labor_total, grand_total]
    );
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
              v.model, v.vin, j.completed_at
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       JOIN jobcards j ON i.jobcard_id = j.id
       JOIN vehicles v ON j.vehicle_id = v.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Get parts used in the jobcard
    const partsResult = await query(
      `SELECT js.*, p.name as part_name, p.part_number
       FROM jobcard_spareparts js
       JOIN parts p ON js.part_id = p.id
       WHERE js.jobcard_id = (SELECT jobcard_id FROM invoices WHERE id = $1)`,
      [req.params.id]
    );
    
    // Get tasks from the jobcard
    const tasksResult = await query(
      `SELECT * FROM jobcard_tasks 
       WHERE jobcard_id = (SELECT jobcard_id FROM invoices WHERE id = $1)`,
      [req.params.id]
    );
    
    res.json({
      invoice: result.rows[0],
      parts: partsResult.rows,
      tasks: tasksResult.rows
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoiceByBookingId = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    console.log('Retrieving invoice for booking ID:', bookingId);
    
    const result = await query(
      `SELECT i.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
              v.model, v.vin, j.completed_at
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       JOIN jobcards j ON i.jobcard_id = j.id
       JOIN vehicles v ON j.vehicle_id = v.id
       WHERE j.booking_id = $1`,
      [bookingId]
    );
    
    console.log('Invoice query result:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No invoice found for booking ID:', bookingId);
      return res.status(404).json({ message: 'Invoice not found for this booking' });
    }
    
    // Get parts used in the jobcard
    const partsResult = await query(
      `SELECT js.*, p.name as part_name, p.part_number
       FROM jobcard_spareparts js
       JOIN parts p ON js.part_id = p.id
       WHERE js.jobcard_id = (SELECT id FROM jobcards WHERE booking_id = $1)`,
      [bookingId]
    );
    
    // Get tasks from the jobcard
    const tasksResult = await query(
      `SELECT * FROM jobcard_tasks 
       WHERE jobcard_id = (SELECT id FROM jobcards WHERE booking_id = $1)`,
      [bookingId]
    );
    
    res.json({
      invoice: result.rows[0],
      parts: partsResult.rows,
      tasks: tasksResult.rows
    });
  } catch (error) {
    console.error('Get invoice by booking ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomerInvoices = async (req, res) => {
  try {
    const customerId = req.params.id || req.user.id;
    const status = req.query.status;
    
    let queryText = `
      SELECT i.*, v.model, v.vin
      FROM invoices i
      JOIN jobcards j ON i.jobcard_id = j.id
      JOIN vehicles v ON j.vehicle_id = v.id
      WHERE i.customer_id = $1 AND j.customer_id = $1
    `;
    
    const params = [customerId];
    
    // Add status filter if provided
    if (status) {
      queryText += ` AND i.status = $2`;
      params.push(status);
    }
    
    queryText += ` ORDER BY i.created_at DESC`;
    
    const result = await query(queryText, params);
    
    res.json({ invoices: result.rows });
  } catch (error) {
    console.error('Get customer invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.name as customer_name, v.model, v.vin
       FROM invoices i
       JOIN users u ON i.customer_id = u.id
       JOIN jobcards j ON i.jobcard_id = j.id
       JOIN vehicles v ON j.vehicle_id = v.id
       ORDER BY i.created_at DESC`
    );
    
    res.json({ invoices: result.rows });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, payment_method } = req.body;
    
    let updateQuery = `
      UPDATE invoices 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [status];
    
    if (payment_method) {
      updateQuery += ', payment_method = $2';
      params.push(payment_method);
    }
    
    if (status === 'paid') {
      updateQuery += payment_method ? ', paid_at = CURRENT_TIMESTAMP' : ', paid_at = CURRENT_TIMESTAMP, payment_method = $2';
      if (!payment_method) {
        params.push('cash');
      }
    }
    
    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(req.params.id);
    
    const result = await query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({
      message: 'Payment status updated successfully',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const mockPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method } = req.body;
    
    // Get invoice details
    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Simulate payment processing
    // In a real application, this would connect to a payment gateway
    
    // Update invoice payment status
    const result = await query(
      `UPDATE invoices 
       SET status = 'paid', payment_method = $1, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [method, invoiceId]
    );
    
    res.json({
      message: 'Payment processed successfully',
      success: true,
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ message: 'Server error during payment processing' });
  }
};
