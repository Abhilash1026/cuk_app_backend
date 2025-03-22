const express = require('express');
const { getConnection } = require('../db'); // ✅ Correct way to import DB connection
const router = express.Router();

// Route to fetch all news
router.get('/', async (req, res) => {
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

    try {
        const connection = await getConnection(); // ✅ Get a DB connection
        const [results] = await connection.query(query); // ✅ Use the connection to run the query
        connection.release(); // ✅ Always release connection after usage

        if (results.length === 0) {
            return res.status(404).json({ message: 'No news posts found' });
        }

        res.status(200).json({ posts: results });
    } catch (err) {
        console.error('❌ Error fetching news:', err.message);
        res.status(500).json({
            message: 'Database error while fetching news',
            error: err.message,
        });
    }
});

module.exports = router;
