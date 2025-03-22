const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Make sure JWT is imported
const db = require('../db'); // Database connection
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validate password strength
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

// Faculty Registration
router.post('/register', [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('faculty_id').notEmpty().withMessage('Faculty ID is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('password').custom((value) => {
    if (!validatePassword(value)) {
      throw new Error('Password must be at least 8 characters long, contain at least one letter, one number, and one special character');
    }
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, email, phone, faculty_id, department, designation, password } = req.body;

  try {
    // Check if the email or faculty ID already exists
    const checkQuery = 'SELECT * FROM faculty WHERE email = ? OR faculty_id = ?';
    db.query(checkQuery, [email, faculty_id], async (err, result) => {
      if (err) {
        console.error('Database error during email/faculty ID check:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.length > 0) {
        return res.status(400).json({ error: 'Email or Faculty ID is already registered' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert faculty into the database
      const insertFacultyQuery = `
        INSERT INTO faculty (full_name, email, phone, faculty_id, department, designation, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertFacultyQuery, [full_name, email, phone, faculty_id, department, designation, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting faculty:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Faculty registration successful' });
      });
    });
  } catch (err) {
    console.error('Error during faculty registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Faculty Login
router.post('/loginFaculty', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if the faculty exists in the database
    const query = 'SELECT * FROM faculty WHERE email = ?';
    db.query(query, [email], async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: 'Faculty not found' }); // Fixed the status code here
      }

      // Compare the provided password with the stored hash
      const faculty = result[0];
      const match = await bcrypt.compare(password, faculty.password_hash);

      if (!match) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
       const token = jwt.sign(
         { email: faculty.email, role: 'faculty' },
          'your_jwt_secret',
           { expiresIn: '1h' }
            );

      // Send success response with the JWT token
      res.status(200).json({
        message: 'Login successful',
        token,
      });
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
