

const { pool } = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const { user_type, is_active } = req.query;

    let query = 'SELECT id, email, full_name, user_type, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [users] = await pool.query(query, params);

    res.json({
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user
    const [users] = await pool.query(
      'SELECT id, email, full_name, user_type, is_active, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get profile based on user type
    let profile = null;
    if (user.user_type === 'enterprise') {
      const [entProfiles] = await pool.query(
        'SELECT * FROM enterprise_profiles WHERE user_id = ?',
        [id]
      );
      profile = entProfiles[0] || null;
    } else if (user.user_type === 'student') {
      const [stuProfiles] = await pool.query(
        'SELECT * FROM student_profiles WHERE user_id = ?',
        [id]
      );
      profile = stuProfiles[0] || null;
    }

    res.json({
      user: user,
      profile: profile
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details', details: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const admin_id = req.user.user_id;

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active field required' });
    }

    const [result] = await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action_type, description, target_table, target_id) VALUES (?, ?, ?, ?, ?)',
      [admin_id, 'USER_STATUS_CHANGED', `User ${is_active ? 'activated' : 'deactivated'}`, 'users', id]
    );

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user_id: id,
      is_active: is_active
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status', details: error.message });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const { status, enterprise_id } = req.query;

    let query = `SELECT io.id, io.title, io.enterprise_id, ep.company_name, io.required_diploma,
                        io.status, io.application_deadline, io.created_at
                 FROM internship_offers io
                 JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND io.status = ?';
      params.push(status);
    }

    if (enterprise_id) {
      query += ' AND io.enterprise_id = ?';
      params.push(enterprise_id);
    }

    query += ' ORDER BY io.created_at DESC LIMIT 100';

    const [offers] = await pool.query(query, params);

    res.json({
      count: offers.length,
      offers: offers
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers', details: error.message });
  }
};

exports.getOfferDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get offer
    const [offers] = await pool.query(
      `SELECT io.*, ep.company_name
       FROM internship_offers io
       JOIN enterprise_profiles ep ON io.enterprise_id = ep.id
       WHERE io.id = ?`,
      [id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = offers[0];

    // Get skills
    const [skills] = await pool.query(
      'SELECT skill_name, skill_weight FROM offer_skills_detailed WHERE offer_id = ?',
      [id]
    );

    // Get applications
    const [applications] = await pool.query(
      `SELECT a.id, a.student_id, sp.user_id, u.full_name, u.email, a.status, a.total_score, a.created_at
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE a.offer_id = ?
       ORDER BY a.total_score DESC`,
      [id]
    );

    res.json({
      offer: offer,
      skills: skills,
      applications: applications
    });

  } catch (error) {
    console.error('Get offer details error:', error);
    res.status(500).json({ error: 'Failed to fetch offer details', details: error.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const { status, student_id, offer_id } = req.query;

    let query = `SELECT a.id, a.student_id, a.offer_id, u.full_name, u.email,
                        io.title as offer_title, a.status, a.total_score, a.created_at
                 FROM applications a
                 JOIN student_profiles sp ON a.student_id = sp.id
                 JOIN users u ON sp.user_id = u.id
                 JOIN internship_offers io ON a.offer_id = io.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    if (offer_id) {
      query += ' AND a.offer_id = ?';
      params.push(offer_id);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 100';

    const [applications] = await pool.query(query, params);

    res.json({
      count: applications.length,
      applications: applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

exports.getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [applications] = await pool.query(
      `SELECT a.*, sp.user_id as student_user_id, u.full_name, u.email,
              io.title as offer_title, io.enterprise_id
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       JOIN internship_offers io ON a.offer_id = io.id
       WHERE a.id = ?`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = applications[0];

    // Get score breakdown
    const [scoreBreakdown] = await pool.query(
      `SELECT skills_score, diploma_score, location_score, total_score
       FROM applications WHERE id = ?`,
      [id]
    );

    res.json({
      application: app,
      score_breakdown: scoreBreakdown[0] || null
    });

  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ error: 'Failed to fetch application details', details: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { action_type, limit = 50 } = req.query;

    let query = 'SELECT id, admin_id, action_type, description, target_table, target_id, created_at FROM admin_logs WHERE 1=1';
    const params = [];

    if (action_type) {
      query += ' AND action_type = ?';
      params.push(action_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [logs] = await pool.query(query, params);

    res.json({
      count: logs.length,
      logs: logs
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    // Count users by type
    const [userStats] = await pool.query(
      `SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type`
    );

    // Count offers by status
    const [offerStats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM internship_offers GROUP BY status`
    );

    // Count applications by status
    const [appStats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM applications GROUP BY status`
    );

    // Get total filled offers (success rate)
    const [filledOffers] = await pool.query(
      `SELECT COUNT(*) as filled FROM internship_offers WHERE status = 'filled'`
    );

    // Get average application score
    const [avgScore] = await pool.query(
      `SELECT AVG(total_score) as average_score FROM applications`
    );

    res.json({
      users: userStats,
      offers: offerStats,
      applications: appStats,
      platform_stats: {
        filled_offers: filledOffers[0].filled,
        average_application_score: avgScore[0].average_score || 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
};

