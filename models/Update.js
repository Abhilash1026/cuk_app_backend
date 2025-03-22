// models/Update.js
const db = require('../db');

class Update {
    static createUpdate({ title, details, image_path }, callback) {
        const query = `INSERT INTO updates (title, details, image_path) VALUES (?, ?, ?)`;
        db.query(query, [title, details, image_path], callback);
    }

    static getAllUpdates(callback) {
        const query = `SELECT * FROM updates ORDER BY created_at DESC`;
        db.query(query, callback);
    }

    // You can add other methods like `updateUpdate`, `deleteUpdate`, etc.
}

module.exports = Update;
