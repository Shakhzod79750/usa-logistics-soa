const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();
const VALID_ROLES = ['admin', 'dispatcher', 'driver', 'customer'];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password || !role) {
      throw new ApiError(400, 'full_name, email, password, and role are required');
    }
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `role must be one of: ${VALID_ROLES.join(', ')}`);
    }
    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) throw new ApiError(409, 'Email is already registered');

    const password_hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(full_name, email, password_hash, role);

    logger.info(`User registered: ${email} (${role})`);
    res.status(201).json({ id: info.lastInsertRowid, full_name, email, role });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 */
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'email and password are required');

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // NOTE: sub MUST be a string per RFC 7519 (StringOrURI) — python-jose in the
    // Python services strictly rejects a numeric sub claim. See ADR / README notes.
    const token = jwt.sign(
      { sub: String(user.id), email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logger.info(`User logged in: ${email}`);
    res.json({ access_token: token, token_type: 'Bearer', role: user.role, user_id: user.id, full_name: user.full_name });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify a JWT
 *     tags: [Auth]
 */
router.get('/verify', authenticate, (req, res) => {
  res.json({ valid: true, user: req.user });
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 */
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const users = db.prepare('SELECT id, full_name, email, role, created_at FROM users').all();
  res.json(users);
});

/**
 * @swagger
 * /auth/users/{id}:
 *   get:
 *     summary: Get a single user
 *     tags: [Users]
 */
router.get('/users/:id', authenticate, (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && String(req.user.sub) !== String(id)) {
      throw new ApiError(403, 'You may only access your own profile');
    }
    const user = db.prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?').get(id);
    if (!user) throw new ApiError(404, 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 */
router.put('/users/:id', authenticate, authorize('admin'), (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (role && !VALID_ROLES.includes(role)) throw new ApiError(400, 'Invalid role');
    if (password && password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters long');

    const password_hash = password ? bcrypt.hashSync(password, 10) : null;

    db.prepare(
      `UPDATE users SET
         full_name = COALESCE(?, full_name),
         role = COALESCE(?, role),
         password_hash = COALESCE(?, password_hash),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(full_name, role, password_hash, id);

    logger.info(`User updated: ${id}${password ? ' (password reset)' : ''}`);
    res.json(db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(id));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 */
router.delete('/users/:id', authenticate, authorize('admin'), (req, res, next) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) throw new ApiError(404, 'User not found');
    logger.info(`User deleted: ${id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
