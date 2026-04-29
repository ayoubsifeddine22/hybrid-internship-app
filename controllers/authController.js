const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, user_type, phone, company_location, company_description } = req.body;

    // Validation
    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['enterprise', 'student', 'admin'].includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user_type' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, user_type, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, user_type, phone || null]
    );

    const user_id = result.insertId;

    // Auto-create profile based on user type
    if (user_type === 'enterprise') {
      await pool.query(
        'INSERT INTO enterprise_profiles (user_id, company_name, company_location, company_description) VALUES (?, ?, ?, ?)',
        [user_id, full_name, company_location || 'To be added', company_description || null]
      );
    } else if (user_type === 'student') {
      await pool.query(
        'INSERT INTO student_profiles (user_id, diploma_level) VALUES (?, ?)',
        [user_id, 'high_school']
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user_id, email: email, name: full_name, role: user_type, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: token,
      user: {
        id: user_id,
        email: email,
        user_type: user_type
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const [users] = await pool.query('SELECT id, email, password_hash, user_type, full_name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, email: user.email, name: user.full_name, role: user.user_type, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { current_password, new_password, currentPassword, newPassword } = req.body;

    const currentPasswordValue = current_password || currentPassword;
    const newPasswordValue = new_password || newPassword;

    if (!currentPasswordValue || !newPasswordValue) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPasswordValue.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPasswordValue, users[0].password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHashedPassword = await bcrypt.hash(newPasswordValue, 10);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHashedPassword, user_id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
};

