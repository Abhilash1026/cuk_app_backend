const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');

// Load environment variables from .env
dotenv.config();
if (!process.env.PORT) {
    console.error('❌ PORT is not defined in the .env file!');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' })); // Allow cross-origin requests from all origins
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const newsRoutes = require('./routes/newsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const achievementsRoutes = require('./routes/achievementsRoutes');
const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminPanelRoutes = require('./routes/AdminPanelRoutes');
const otpRoutes = require('./routes/otpRoutes');
const notificationRoutes = require("./routes/notificationRoutes");



// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminPanelRoutes);
app.use('/api/otp', otpRoutes);
app.use("/api/notifications", notificationRoutes);


// Root Route (Health Check)
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the CUK Updates API!',
        status: 'Running',
        version: '1.0.0',
    });
});

// Database Connection Health Check
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.stack);
        process.exit(1); // Exit the application if the database is not connected
    } else {
        console.log('✅ Connected to the MySQL database.');
        connection.release(); // Release the connection back to the pool
    }
});

// 404 Handler (Route Not Found)
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Internal Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred!',
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});