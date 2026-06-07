const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const { doctor_id, schedule_id, disease } = req.body;
  const user_id = req.user.id;

  if (!doctor_id || !schedule_id) {
    return res.status(400).json({ error: 'doctor_id and schedule_id are required' });
  }

  try {

    const [schedRows] = await db.query(
      'SELECT id FROM schedules WHERE id = ? AND doctor_id = ?',
      [schedule_id, doctor_id]
    );
    if (schedRows.length === 0) {
      return res.status(400).json({ error: 'Invalid doctor or schedule' });
    }

    const [result] = await db.query(
      'INSERT INTO queues (user_id, doctor_id, schedule_id, disease, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, doctor_id, schedule_id, disease || null, 'BOOKED']
    );

    return res.status(201).json({ message: 'Queue booked successfully', queueId: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }


    const [docInfo] = await db.query(
    `SELECT d.name AS doctor_name, sc.day, sc.hour, a.name AS area
    FROM doctors d
    JOIN schedules sc ON sc.id = ?
    JOIN areas a ON d.area_id = a.id
    WHERE d.id = ?`,
    [schedule_id, doctor_id]
    );
    if (docInfo.length > 0) {
    const info = docInfo[0];
    const notifMsg = `Queue booked! Dr. ${info.doctor_name} — ${info.day} at ${info.hour} (${info.area}). Your queue ID: #${String(result.insertId).padStart(4,'0')}`;
    await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [user_id, notifMsg]
    );
    }
});

router.get('/my', requireAuth, async (req, res) => {
  const user_id = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT q.id, q.disease, q.status, q.created_at,
              d.name AS doctor_name,
              a.name AS area,
              sc.day, sc.hour
       FROM queues q
       JOIN doctors d ON q.doctor_id = d.id
       JOIN areas a ON d.area_id = a.id
       JOIN schedules sc ON q.schedule_id = sc.id
       WHERE q.user_id = ? AND q.status IN ('BOOKED', 'WAITING')
       ORDER BY q.created_at DESC`,
      [user_id]
    );

    const formatted = rows.map((r, i) => ({
      no: i + 1,
      id: String(r.id).padStart(4, '0'),
      disease: r.disease || 'General',
      estimation: r.hour,
      status: r.status,
      doctor: r.doctor_name,
      area: r.area,
      day: r.day
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/log', requireAuth, async (req, res) => {
  const user_id = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT q.id, q.disease, q.status, q.created_at,
              d.name AS doctor_name,
              a.name AS area,
              sc.day, sc.hour
       FROM queues q
       JOIN doctors d ON q.doctor_id = d.id
       JOIN areas a ON d.area_id = a.id
       JOIN schedules sc ON q.schedule_id = sc.id
       WHERE q.user_id = ?
       ORDER BY q.created_at DESC`,
      [user_id]
    );

    const formatted = rows.map((r, i) => ({
      no: i + 1,
      date: new Date(r.created_at).toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '/'),
      disease: r.disease || 'General',
      doctor: r.doctor_name,
      area: r.area,
      status: r.status
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }

  
});

// PATCH /api/queues/:id/cancel — user cancels their own queue
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      'SELECT id, status FROM queues WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Queue not found' });
    }
    if (rows[0].status === 'DONE' || rows[0].status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled queue' });
    }

    await db.query('UPDATE queues SET status = ? WHERE id = ?', ['CANCELLED', id]);
    res.json({ message: 'Queue cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;