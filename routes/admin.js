const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/queues', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.id, q.disease, q.status, q.created_at,
              u.fullname AS patient_name,
              d.name AS doctor_name,
              a.name AS area,
              sc.day, sc.hour
       FROM queues q
       JOIN users u ON q.user_id = u.id
       JOIN doctors d ON q.doctor_id = d.id
       JOIN areas a ON d.area_id = a.id
       JOIN schedules sc ON q.schedule_id = sc.id
       WHERE q.status IN ('BOOKED', 'WAITING', 'CONSULTING')
       ORDER BY q.created_at ASC`
    );

    // const formatted = rows.map((r, i) => ({
    //   no: i + 1,
    //   id: String(r.id).padStart(4, '0'),
    //   raw_id: r.id,
    //   disease: r.disease || 'General',
    //   patient_name: r.patient_name,
    //   doctor: r.doctor_name,
    //   area: r.area,
    //   day: r.day,
    //   hour: r.hour,
    //   status: r.status
    // }));

    const formatted = rows.map((r, i) => ({
    no: i + 1,
    id: String(r.id).padStart(4, '0'),
    raw_id: r.id,          // ← plain number, used by the Next button
    disease: r.disease || 'General',
    patient_name: r.patient_name,
    doctor: r.doctor_name,
    area: r.area,
    day: r.day,
    hour: r.hour,
    status: r.status
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/queues/count', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM queues WHERE DATE(created_at) = CURDATE()`
    );
    res.json({ count: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/queues/:id/next', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT id, status FROM queues WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const current = rows[0];

    if (current.status === 'BOOKED' || current.status === 'WAITING') {
      // First click: move to CONSULTING
      await db.query('UPDATE queues SET status = ? WHERE id = ?', ['CONSULTING', id]);
      return res.json({ message: 'Now consulting', status: 'CONSULTING' });

    } else if (current.status === 'CONSULTING') {
      // Second click: mark COMPLETED, then promote next BOOKED to WAITING
      await db.query('UPDATE queues SET status = ? WHERE id = ?', ['COMPLETED', id]);

      const [next] = await db.query(
        `SELECT id FROM queues WHERE status = 'BOOKED' ORDER BY created_at ASC LIMIT 1`
      );
      if (next.length > 0) {
        await db.query('UPDATE queues SET status = ? WHERE id = ?', ['WAITING', next[0].id]);
      }

      return res.json({ message: 'Completed', status: 'COMPLETED', nextQueueId: next[0]?.id || null });

    } else {
      return res.status(400).json({ error: 'Queue is already completed or cancelled' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/queues/:id/cancel', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE queues SET status = ? WHERE id = ?', ['CANCELLED', id]);
    res.json({ message: 'Queue cancelled by admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;