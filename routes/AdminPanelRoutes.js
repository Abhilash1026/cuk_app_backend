const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db'); // Ensure this points to your mysql2 connection
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use a strong secret key
const AUTH_KEY = process.env.AUTH_KEY || 'your_admin_auth_key';

// Admin Registration Route
router.post('/register', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('admin_id').notEmpty().withMessage('Employee ID is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('auth_key').equals(AUTH_KEY).withMessage('Invalid authorization key')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, email, phone, admin_id, password } = req.body;

  try {
    console.log('Connecting to database...');

    // Check if admin already exists
    const [existingAdmin] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    console.log('Existing admin:', existingAdmin);

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: 'Admin already registered' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);

    // Insert new admin
    // Insert new admin (including auth_key)
    const [result] = await db.query(
      'INSERT INTO admins (full_name, email, phone, admin_id, password, auth_key) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, admin_id, hashedPassword, AUTH_KEY]
    );

    console.log('Insert result:', result);

    // Generate JWT token
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'Admin registered successfully', token });
  } catch (err) {
    console.error('Registration Error:', err.message, err.stack); // Detailed logging
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Admin Login Route
router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if admin exists
    const [admin] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admin.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, admin[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ email: admin[0].email, admin_id: admin[0].admin_id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


module.exports = router;