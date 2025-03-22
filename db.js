const mysql = require('mysql2/promise'); // Use promise for async/await support
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT ,DB_CHARSET} = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
    console.error('❌ Missing required database environment variables!');
    process.exit(1);
}

// ✅ Create a connection pool for MySQL database
const db = mysql.createPool({
    connectionLimit: 10,  // Max number of connections in the pool
    host: DB_HOST,        // Database host
    user: DB_USER,        // Database user
    password: DB_PASSWORD, // Database password
    database: DB_NAME,    // Database name
    port: DB_PORT,        // Database port (default: 3306)
    charset: DB_CHARSET || 'utf8mb4',
    waitForConnections: true,
    queueLimit: 0,
    maxIdle: 10,          // Maximum idle connections
    idleTimeout: 60000,   // 1-minute timeout for idle connections
});

// ✅ Function to get a database connection
async function getConnection() {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connection acquired.');
        return connection;
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        throw err;
    }
}

// ✅ Test database connection only when this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            const connection = await getConnection();
            console.log('✅ Successfully connected to MySQL database.');
            connection.release(); // Release back to pool
        } catch (err) {
            console.error('❌ Database connection failed:', err.message);
            process.exit(1);
        }
    })();
}

// ✅ Export database connection and function
module.exports = { db, getConnection };