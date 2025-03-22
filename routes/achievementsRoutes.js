const express = require('express');
const router = express.Router();
const { db } = require('../db'); // MySQL connection setup

// Fetch all achievements
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT post_id, heading, fileUri, info, created_at FROM achievements ORDER BY created_at DESC';
        const [results] = await db.execute(query);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No achievements found' });
        }

        res.status(200).json(results);
    } catch (err) {
        console.error('❌ Error fetching achievements:', err);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

module.exports = router;
