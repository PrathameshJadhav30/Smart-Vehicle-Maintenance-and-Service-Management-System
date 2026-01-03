import { query } from '../config/database.js';

//  Vehicle Analytics 
export const getVehicleAnalytics = async (req, res) => {
  try {
    // Top serviced vehicles
    const topVehiclesResult = await query(
      `SELECT v.model, v.vin, COUNT(j.id) AS service_count, COALESCE(SUM(i.grand_total),0) AS total_revenue
       FROM vehicles v
       LEFT JOIN jobcards j ON v.id = j.vehicle_id
       LEFT JOIN invoices i ON j.id = i.jobcard_id
       GROUP BY v.id, v.model, v.vin
       ORDER BY service_count DESC
       LIMIT 10`
    );

    // Services by vehicle model
    const servicesByModelResult = await query(
      `SELECT v.model, COUNT(j.id) AS count
       FROM vehicles v
       LEFT JOIN jobcards j ON v.id = j.vehicle_id
       GROUP BY v.model
       ORDER BY count DESC`
    );

    res.json({
      topVehicles: topVehiclesResult.rows || [],
      servicesByModel: servicesByModelResult.rows || []
    });
  } catch (error) {
    console.error('Get vehicle analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//  Parts Usage 
export const getPartsUsage = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.name, p.part_number, COALESCE(SUM(js.quantity),0) AS total_used, 
              COALESCE(SUM(js.total_price),0) AS total_revenue
       FROM parts p
       LEFT JOIN jobcard_spareparts js ON p.id = js.part_id
       GROUP BY p.id, p.name, p.part_number
       ORDER BY total_used DESC NULLS LAST
       LIMIT 20`
    );

    res.json({ partsUsage: result.rows || [] });
  } catch (error) {
    console.error('Get parts usage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//  Revenue Analytics 
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const params = [];
    let dateFilter = '';

    if (startDate && endDate) {
      dateFilter = 'WHERE i.created_at >= $1 AND i.created_at <= $2';
      params.push(startDate, endDate);
    }

    console.log('Revenue Analytics Request:', { startDate, endDate, dateFilter, params });

    // Total revenue
    const totalRevenueResult = await query(
      `SELECT COALESCE(SUM(grand_total),0) AS total_revenue,
              COALESCE(SUM(parts_total),0) AS parts_revenue,
              COALESCE(SUM(labor_total),0) AS labor_revenue,
              COUNT(*) AS invoice_count
       FROM invoices i
       ${dateFilter}`,
      params
    );

    // Revenue by month (last 12 months)
    const monthlyRevenueResult = await query(
      `SELECT DATE_TRUNC('month', i.created_at) AS month,
              COALESCE(SUM(i.grand_total),0) AS revenue,
              COUNT(*) AS invoice_count
       FROM invoices i
       ${dateFilter}
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      params
    );

    // Revenue by day (last 30 days)
    const dailyRevenueResult = await query(
      `SELECT DATE(i.created_at) AS date,
              COALESCE(SUM(i.grand_total),0) AS revenue,
              COUNT(*) AS invoice_count
       FROM invoices i
       WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY date
       ORDER BY date DESC`
    );

    // Log the results for debugging
    console.log('Total Revenue Result:', totalRevenueResult.rows);
    console.log('Monthly Revenue Result:', monthlyRevenueResult.rows);
    console.log('Daily Revenue Result:', dailyRevenueResult.rows);

    res.json({
      totalRevenue: totalRevenueResult.rows[0] || {},
      monthlyRevenue: monthlyRevenueResult.rows || [],
      dailyRevenue: dailyRevenueResult.rows || []
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//  Dashboard Stats 
export const getDashboardStats = async (req, res) => {
  try {
    // Add debug logging
    console.log('Fetching dashboard stats at:', new Date());
    
    const [users, customers, vehicles, pendingBookings, activeJobcards, lowStock, monthlyRevenue, totalRevenue, mechanics, allInvoices, allJobCards] =
      await Promise.all([
        query("SELECT COUNT(*) AS count FROM users"),
        query("SELECT COUNT(*) AS count FROM users WHERE role='customer'"),
        query("SELECT COUNT(*) AS count FROM vehicles"),
        query("SELECT COUNT(*) AS count FROM bookings WHERE status='pending'"),
        query("SELECT COUNT(*) AS count FROM jobcards WHERE status IN ('pending','in_progress')"),
        query("SELECT COUNT(*) AS count FROM parts WHERE quantity <= reorder_level"),
        query("SELECT COALESCE(SUM(grand_total),0) AS total FROM invoices WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)"),
        query("SELECT COALESCE(SUM(grand_total),0) AS total FROM invoices WHERE status='paid'"),
        query("SELECT COUNT(*) AS count FROM users WHERE role='mechanic'"),
        query("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 10"), // Get recent invoices for debugging
        query("SELECT * FROM jobcards WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 10") // Get recent completed job cards for debugging
      ]);
    
    // Log the results for debugging
    console.log('Monthly revenue query result:', monthlyRevenue.rows[0]);
    console.log('Total revenue query result:', totalRevenue.rows[0]);
    console.log('Recent invoices:', allInvoices.rows);
    console.log('Recent completed job cards:', allJobCards.rows);
    
    res.json({
      totalUsers: parseInt(users.rows[0].count || 0),
      totalCustomers: parseInt(customers.rows[0].count || 0),
      totalVehicles: parseInt(vehicles.rows[0].count || 0),
      pendingBookings: parseInt(pendingBookings.rows[0].count || 0),
      activeJobs: parseInt(activeJobcards.rows[0].count || 0),
      lowStockParts: parseInt(lowStock.rows[0].count || 0),
      monthlyRevenue: parseFloat(monthlyRevenue.rows[0].total || 0),
      totalRevenue: parseFloat(totalRevenue.rows[0].total || 0),
      mechanics: parseInt(mechanics.rows[0].count || 0)
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mechanic Performance 
export const getMechanicPerformance = async (req, res) => {
  try {
    const { from, to, mechanicId } = req.query;
    const params = [];
    let paramIndex = 1;

    const conditions = ["u.role = 'mechanic'"];

    // If user is a mechanic, only show their own performance unless mechanicId is specified
    if (req.user.role === 'mechanic' && !mechanicId) {
      conditions.push(`u.id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
    }

    if (from) {
      conditions.push(`j.created_at >= $${paramIndex}`);
      params.push(from);
      paramIndex++;
    }

    if (to) {
      conditions.push(`j.created_at <= $${paramIndex}`);
      params.push(to);
      paramIndex++;
    }

    if (mechanicId) {
      conditions.push(`u.id = $${paramIndex}`);
      params.push(mechanicId);
      paramIndex++;
    }

    // For the join condition, we only want to filter job cards by status when we have date filters
    // Otherwise, we want ALL mechanics, even those with 0 completed jobs
    const joinCondition = (from || to || (req.user.role === 'mechanic' && !mechanicId) || mechanicId) 
      ? `AND j.status = 'completed'` 
      : '';

    const queryText = `
      SELECT u.id, u.name,
             COALESCE(COUNT(j.id),0) AS jobs_completed,
             COALESCE(SUM(j.total_cost),0) AS total_revenue
      FROM users u
      LEFT JOIN jobcards j ON u.id = j.mechanic_id ${joinCondition}
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      GROUP BY u.id, u.name
      ORDER BY jobs_completed DESC, total_revenue DESC
    `;

    const result = await query(queryText, params);
    
    // Add debug logging
    console.log('Mechanic performance query result:', result.rows);

    // If this is for a specific mechanic (the mechanic themselves), return detailed performance data
    if (req.user.role === 'mechanic' && !mechanicId) {
      const mechanicData = result.rows[0] || {};
      
      // For mechanics, we'll return a more detailed performance object
      const detailedPerformance = {
        jobs_completed: parseInt(mechanicData.jobs_completed || 0),
        revenue_generated: parseFloat(mechanicData.total_revenue || 0),
        average_rating: 4.5, // Placeholder - would need actual rating system
        on_time_completion_rate: 92.5 // Placeholder - would need actual tracking
      };
      
      return res.json({ performance: detailedPerformance });
    }

    // For admin, return list of all mechanics
    const mechanicPerformance = (result.rows || []).map(m => ({
      id: m.id,
      name: m.name || 'Unknown',
      jobs_completed: parseInt(m.jobs_completed || 0),
      total_revenue: parseFloat(m.total_revenue || 0)
    }));

    res.json({ mechanicPerformance });
  } catch (error) {
    console.error('Get mechanic performance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
