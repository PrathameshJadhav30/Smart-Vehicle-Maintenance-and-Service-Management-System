import { query } from '../config/database.js';

export const getUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Validate role
    if (!['customer', 'mechanic', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const result = await query(
      `UPDATE users 
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, role`,
      [role, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting the current admin user
    if (userId == req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Check if user exists
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete related records first (cascade delete)
    // Delete user's vehicles
    await query('DELETE FROM vehicles WHERE customer_id = $1', [userId]);
    
    // Delete user's bookings
    await query('DELETE FROM bookings WHERE customer_id = $1', [userId]);
    
    // Delete user's invoices
    await query('DELETE FROM invoices WHERE customer_id = $1', [userId]);
    
    // Delete user's job cards (if any)
    await query('DELETE FROM jobcards WHERE customer_id = $1', [userId]);
    
    // Finally delete the user
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all mechanics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMechanics = async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, email, phone, address, created_at FROM users WHERE role = 'mechanic' ORDER BY created_at DESC"
    );
    
    res.json({ mechanics: result.rows });
  } catch (error) {
    console.error('Get mechanics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};