import { query } from '../config/database.js';

/**
 * Process a payment (simulated)
 * In a real application, this would integrate with a payment gateway
 */
export const processPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, cardNumber, expiryDate, cvv } = req.body;
    
    // Validate required fields
    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ 
        message: 'Invoice ID, amount, and payment method are required' 
      });
    }
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than zero' 
      });
    }
    
    // Check if invoice exists and get its details
    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Invoice not found' 
      });
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return res.status(400).json({ 
        message: 'Invoice is already paid' 
      });
    }
    
    // In a real application, we would process the payment with a payment gateway here
    // For simulation, we'll just mark it as successful
    
    // Update invoice payment status
    const updateResult = await query(
      `UPDATE invoices 
       SET status = 'paid', 
           payment_method = $1, 
           paid_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [method, invoiceId]
    );
    
    res.json({
      message: 'Payment processed successfully',
      payment: {
        id: Date.now(), // Simulated payment ID
        invoice_id: invoiceId,
        amount: parseFloat(amount),
        method: method,
        status: 'completed',
        processed_at: new Date().toISOString()
      },
      invoice: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error during payment processing' });
  }
};

/**
 * Get payment history for an invoice
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // In a real application, we would query a payments table
    // For simulation, we'll return the invoice payment information
    const result = await query(
      `SELECT id, status, payment_method, paid_at, grand_total 
       FROM invoices 
       WHERE id = $1`,
      [invoiceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Invoice not found' 
      });
    }
    
    const invoice = result.rows[0];
    
    // Format response to simulate payment history
    const paymentHistory = invoice.paid_at ? [{
      id: `pay_${invoice.id}`,
      invoice_id: invoice.id,
      amount: parseFloat(invoice.grand_total),
      method: invoice.payment_method,
      status: invoice.status === 'paid' ? 'completed' : 'pending',
      processed_at: invoice.paid_at
    }] : [];
    
    res.json({ paymentHistory });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    
    // Extract invoice ID from payment ID (simulated)
    const invoiceId = paymentId.replace('pay_', '');
    
    // Update invoice status to refunded
    const result = await query(
      `UPDATE invoices 
       SET status = 'refunded', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [invoiceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Payment not found' 
      });
    }
    
    res.json({
      message: 'Payment refunded successfully',
      refund: {
        id: `refund_${paymentId}`,
        payment_id: paymentId,
        amount: parseFloat(result.rows[0].grand_total),
        reason: reason || 'Customer request',
        status: 'completed',
        refunded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Server error during refund processing' });
  }
};