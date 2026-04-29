const { pool } = require('../config/database');

exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { unread } = req.query;

    let query = `
      SELECT
        id,
        user_id,
        type,
        message,
        related_offer_id,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ?
    `;

    const params = [user_id];

    // Filter by unread if requested
    if (unread === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC`;

    const [notifications] = await pool.query(query, params);

    res.json({
      count: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;
    const user_id = req.user.user_id;

    // Verify notification belongs to this user
    const [notifications] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Update is_read status
    await pool.query(
      'UPDATE notifications SET is_read = ? WHERE id = ?',
      [is_read ? true : false, id]
    );

    res.json({
      message: 'Notification updated',
      is_read: is_read ? true : false
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to update notification', details: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;

    // Verify notification belongs to this user
    const [notifications] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Delete notification
    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification', details: error.message });
  }
};

exports.createNotification = async (connection, user_id, type, message, offer_id = null, related_user_id = null) => {
  try {
    await connection.query(
      `INSERT INTO notifications
       (user_id, type, message, related_offer_id, is_read, created_at)
       VALUES (?, ?, ?, ?, false, NOW())`,
      [user_id, type, message, offer_id]
    );
  } catch (error) {
    console.error('Create notification error:', error);
    // Don't throw - notifications shouldn't break the application
  }
};

