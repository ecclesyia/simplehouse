const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/areas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM areas ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/specialists', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM specialists ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  const { name, area_id, specialist_id } = req.query;

  let query = `
    SELECT d.id, d.name, a.name AS area, s.name AS specialist
    FROM doctors d
    LEFT JOIN areas a ON d.area_id = a.id
    LEFT JOIN specialists s ON d.specialist_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (name) {
    query += ' AND d.name LIKE ?';
    params.push(`%${name}%`);
  }
  if (area_id) {
    query += ' AND d.area_id = ?';
    params.push(area_id);
  }
  if (specialist_id) {
    query += ' AND d.specialist_id = ?';
    params.push(specialist_id);
  }

  try {
    const [doctors] = await db.query(query, params);
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/schedules', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, day, hour FROM schedules WHERE doctor_id = ? ORDER BY day, hour',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;