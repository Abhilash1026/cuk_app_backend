const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');  // Your MySQL connection setup
require('dotenv').config();

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

// ✅ Register a New Student
router.post('/register', async (req, res) => {
    try {
        console.log("📥 Received registration data:", req.body); // ✅ Debugging log

        const { full_name, email, phone, enrollment_number, department, year, course, password } = req.body;

        // 🔹 Check for missing fields
        let missingFields = [];
        if (!full_name) missingFields.push("full_name");
        if (!email) missingFields.push("email");
        if (!phone) missingFields.push("phone");
        if (!enrollment_number) missingFields.push("enrollment_number");
        if (!department) missingFields.push("department");
        if (!year) missingFields.push("year");
        if (!course) missingFields.push("course");
        if (!password) missingFields.push("password");

        if (missingFields.length > 0) {
            console.log("❌ Missing fields:", missingFields); // ✅ Debugging log
            return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
        }

        // 🔹 Validate year format
        const validYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        if (!validYears.includes(year)) {
            return res.status(400).json({ error: "Invalid year! Use '1st Year', '2nd Year', '3rd Year', or '4th Year'." });
        }

        // 🔹 Check if student already exists
        const [existingUser] = await db.execute(
            'SELECT * FROM students WHERE email = ? OR phone = ? OR enrollment_number = ?',
            [email, phone, enrollment_number]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email, phone, or enrollment number already exists!' });
        }

        // 🔹 Hash the password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Insert student data into the database
        await db.execute(
            'INSERT INTO students (full_name, email, phone, enrollment_number, department, year, course, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, enrollment_number, department, year, course, hashedPassword]
        );

        res.status(201).json({ message: '✅ Student registered successfully!' });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/loginStudent', async (req, res) => {
    try {
        console.log("📥 Login request received:", req.body); // ✅ Debugging log

        const { email, password, fcmToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required!' });
        }

        // 🔹 Find student by email
        const [students] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

        if (students.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password!' });
        }

        const student = students[0];

        // 🔹 Compare hashed password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password!' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT secret key is missing!' });
        }

        // 🔹 Generate JWT token
        const token = jwt.sign(
            { id: student.id, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log("📲 Received FCM Token:", fcmToken || 'None'); // ✅ Log FCM Token

        // ✅ If FCM Token is provided and it's not already stored, update it
        if (fcmToken) {
            if (!student.fcm_token || student.fcm_token !== fcmToken) {
                const [updateResult] = await db.execute(
                    'UPDATE students SET fcm_token = ? WHERE id = ?',
                    [fcmToken, student.id]
                );
                console.log("✅ FCM Token updated successfully:", updateResult);
            } else {
                console.log("ℹ️ FCM Token is already up-to-date.");
            }
        } else {
            console.log("⚠️ No FCM Token received.");
        }

        res.json({ message: '✅ Student login successful!', token });

    } catch (error) {
        console.error('❌ Student login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// ✅ Protected Route: Student Profile
router.get('/studentProfile', verifyToken, async (req, res) => {
    try {
        const [student] = await db.execute(
            'SELECT full_name, email, department, year, course FROM students WHERE id = ?',
            [req.user.id]
        );

        res.json({ profile: student[0] });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
