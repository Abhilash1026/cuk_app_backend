const express = require('express');
const db = require('../db'); // Import your database connection
const router = express.Router();

// Route to fetch all news
router.get('/', (req, res) => {
    const query = `
        SELECT
            post_id AS id,
            heading,
            fileUri,
            info,
            created_at
        FROM news
        ORDER BY created_at DESC
    `;

    // Execute the query to fetch data from the database
    db.query(query, (err, results) => {
        if (err) {
            // Log the error message and the error object for debugging
            console.error('Error fetching news:', err.message);
            console.error(err);  // Log the full error object
            return res.status(500).json({ message: 'Database error while fetching news' });
        }

        // Check if no results were found
        if (results.length === 0) {
            return res.status(404).json({ message: 'No news posts found' });
        }

        // Return the results as a JSON response
        res.status(200).json({ posts: results });
    });
});

// Export the route so it can be used in the main app.js
module.exports = router;
