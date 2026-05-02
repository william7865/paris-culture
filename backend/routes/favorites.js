const express = require('express');
const { pool } = require('../src/db');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT event_id, event_data, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows.map(r => ({ ...r.event_data, id: r.event_id })));
  } catch (err) {
    console.error('[favorites/get]', err.message);
    res.status(500).json({ error: 'Impossible de récupérer les favoris.' });
  }
});

router.post('/:eventId', async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID invalide.' });

  const eventData = req.body;
  if (!eventData?.title) return res.status(400).json({ error: 'Données de l\'événement manquantes.' });

  try {
    await pool.query(
      'INSERT INTO favorites (user_id, event_id, event_data) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.user.id, eventId, eventData]
    );
    res.status(201).json({ message: 'Ajouté aux favoris.' });
  } catch (err) {
    console.error('[favorites/post]', err.message);
    res.status(500).json({ error: 'Impossible d\'ajouter le favori.' });
  }
});

router.delete('/:eventId', async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) return res.status(400).json({ error: 'ID invalide.' });

  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );
    res.json({ message: 'Retiré des favoris.' });
  } catch (err) {
    console.error('[favorites/delete]', err.message);
    res.status(500).json({ error: 'Impossible de supprimer le favori.' });
  }
});

module.exports = router;
