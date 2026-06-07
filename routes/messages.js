const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/conversations', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT u.id, u.fullname, u.email,
        (SELECT body FROM messages 
         WHERE (sender_id = u.id OR receiver_id = u.id)
         ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages 
         WHERE (sender_id = u.id OR receiver_id = u.id)
         ORDER BY created_at DESC LIMIT 1) AS last_time,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id IS NULL AND is_read = 0) AS unread
       FROM users u
       WHERE u.role = 'user'
       AND u.id IN (
         SELECT DISTINCT sender_id FROM messages WHERE receiver_id IS NULL
       )
       ORDER BY last_time DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/thread/:userId', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const { userId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT m.id, m.body, m.created_at, m.sender_id, m.is_read,
              u.fullname AS sender_name, u.role AS sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id IS NULL)
          OR (m.sender_id IN (SELECT id FROM users WHERE role='admin') AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [userId, userId]
    );
    await db.query(
      `UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id IS NULL`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my', requireAuth, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'User only' });
  }
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT m.id, m.body, m.created_at, m.sender_id, m.is_read,
              u.fullname AS sender_name, u.role AS sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id IS NULL)
          OR (m.receiver_id = ? AND u.role = 'admin')
       ORDER BY m.created_at ASC`,
      [userId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/send', requireAuth, async (req, res) => {
  const { body, receiver_id } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Message body required' });
  }

  try {
    if (req.user.role === 'user') {
      await db.query(
        'INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, NULL, ?)',
        [req.user.id, body.trim()]
      );
    } else if (req.user.role === 'admin') {
      // Admin sends to a specific user
      if (!receiver_id) return res.status(400).json({ error: 'receiver_id required for admin' });
      await db.query(
        'INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)',
        [req.user.id, receiver_id, body.trim()]
      );
    }
    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    let count = 0;
    if (req.user.role === 'user') {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS c FROM messages 
         WHERE receiver_id = ? AND is_read = 0`,
        [req.user.id]
      );
      count = rows[0].c;
    } else {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS c FROM messages 
         WHERE receiver_id IS NULL AND is_read = 0`
      );
      count = rows[0].c;
    }
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;