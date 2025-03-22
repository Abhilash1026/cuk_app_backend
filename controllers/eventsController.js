// controllers/eventsController.js
const db = require('../db');

// Create an event post
const createEvent = (req, res) => {
    const { topic, heading, fileUri, info } = req.body;
    const sql = 'INSERT INTO events (topic, title, details, image_path) VALUES (?, ?, ?, ?)';
    db.query(sql, [topic, heading, info, fileUri], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error creating event', error: err });
        }
        res.status(201).json({ message: 'Event created successfully' });
    });
};

// Get all event posts
const getEvents = (req, res) => {
    const sql = 'SELECT * FROM events';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving events', error: err });
        }
        res.status(200).json({ data: results });
    });
};

module.exports = { createEvent, getEvents };
