const db = require('./db'); // Ensure this imports your db.js

db.query('SELECT * FROM news', (err, results) => {
    if (err) {
        console.error('Database query error:', err);
        process.exit(1);
    }
    console.log('Query results:', results);
    process.exit(0);
});
