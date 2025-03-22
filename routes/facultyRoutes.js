const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
require('dotenv').config(); // ✅ Load environment variables

const router = express.Router();

// ✅ Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token!' });
    }
};

// ✅ Faculty Registration Route
router.post('/registerFaculty', async (req, res) => {
    try {
        const { fullName, email, phone, facultyID, department, designation, password } = req.body;

        if (!fullName || !email || !phone || !facultyID || !department || !designation || !password) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // 🔹 Check if faculty already exists
        const [existingFaculty] = await db.execute(
            'SELECT * FROM faculty WHERE email = ? OR phone = ? OR faculty_id = ?',
            [email, phone, facultyID]
        );

        if (existingFaculty.length > 0) {
            return res.status(400).json({ error: 'Email, phone, or faculty ID already exists!' });
        }

        // 🔹 Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Insert into faculty table
        await db.execute(
            'INSERT INTO faculty (full_name, email, phone, faculty_id, department, designation, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, email, phone, facultyID, department, designation, hashedPassword]
        );

        res.status(201).json({ message: '✅ Faculty registered successfully!' });

    } catch (error) {
        console.error('❌ Faculty registration error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Faculty Login Route
router.post('/loginFaculty', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required!' });
        }

        // 🔹 Find faculty by email
        const [faculty] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);

        if (faculty.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password!' });
        }

        const facultyMember = faculty[0];

        // 🔹 Compare hashed password
        const isMatch = await bcrypt.compare(password, facultyMember.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password!' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT secret key is missing!' });
        }

        // 🔹 Generate JWT token
        const token = jwt.sign(
            { id: facultyMember.id, role: 'faculty' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ message: '✅ Faculty login successful!', token });

    } catch (error) {
        console.error('❌ Faculty login error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ✅ Protected Route: Faculty Profile
router.get('/facultyProfile', verifyToken, async (req, res) => {
    try {
        const [faculty] = await db.execute(
            'SELECT full_name, email, department, designation FROM faculty WHERE id = ?',
            [req.user.id]
        );

        res.json({ profile: faculty[0] });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
