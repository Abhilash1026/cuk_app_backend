// models/Event.js
const db = require('../db');

class Event {
    static createEvent({ title, details, date, time }, callback) {
        const query = `INSERT INTO events (title, details, date, time) VALUES (?, ?, ?, ?)`;
        db.query(query, [title, details, date, time], callback);
    }

    static getAllEvents(callback) {
        const query = `SELECT * FROM events ORDER BY date, time`;
        db.query(query, callback);
    }

    // You can add other methods like `updateEvent`, `deleteEvent`, etc.
}

module.exports = Event;
