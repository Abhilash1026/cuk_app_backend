// testDbConnection.js

const { db } = require('./db');  // Import your db connection

// Use async/await to handle the promise-based query
async function testConnection() {
    try {
        // Run a simple test query to check if the connection is working
        const [rows, fields] = await db.query('SELECT 1');
        console.log('✅ Database connected successfully:', rows);
    } catch (err) {
        console.error('❌ Database Connection Error:', err.message);
    }
}

// Call the function to test the connection
testConnection();
