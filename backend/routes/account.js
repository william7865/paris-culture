const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.created_at,
              (SELECT COUNT(*) FROM favorites WHERE user_id = u.id) AS favorites_count
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Compte introuvable.' });
    const { password_hash, ...user } = rows[0];
    res.json(user);
  } catch (err) {
    console.error('[account/me]', err.message);
    res.status(500).json({ error: 'Impossible de récupérer le compte.' });
  }
});

router.put('/email', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis pour confirmer.' });
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email.toLowerCase().trim(), req.user.id]);
    res.json({ message: 'Email mis à jour.' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé.' });
    console.error('[account/email]', err.message);
    res.status(500).json({ error: 'Impossible de modifier l\'email.' });
  }
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Nouveau mot de passe trop court (8 caractères min).' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent.' });
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    console.error('[account/password]', err.message);
    res.status(500).json({ error: 'Impossible de modifier le mot de passe.' });
  }
});

router.delete('/', async (req, res) => {
  const { password } = req.body ?? {};
  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis pour supprimer le compte.' });
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Compte supprimé.' });
  } catch (err) {
    console.error('[account/delete]', err.message);
    res.status(500).json({ error: 'Impossible de supprimer le compte.' });
  }
});

module.exports = router;
