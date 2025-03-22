const db = require('../db');

// Create an achievement post
const createAchievement = (req, res) => {
    const { heading, fileUri, info } = req.body;
    const sql = 'INSERT INTO achievements (heading, fileUri, info) VALUES (?, ?, ?)';
    db.query(sql, [heading, fileUri, info], (err, result) => {
        if (err) {
            console.error('Error creating achievement:', err);
            return res.status(500).json({ message: 'Error creating achievement', error: err });
        }
        res.status(201).json({ message: 'Achievement created successfully' });
    });
};

// Get all achievement posts
const getAchievements = (req, res) => {
    const sql = 'SELECT * FROM achievements ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving achievements:', err);
            return res.status(500).json({ message: 'Error retrieving achievements', error: err });
        }
        res.status(200).json(results);
    });
};

module.exports = { createAchievement, getAchievements };
