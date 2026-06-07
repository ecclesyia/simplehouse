const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/my', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, message, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count: rows[0].c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/mark-read', requireAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Marked read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;