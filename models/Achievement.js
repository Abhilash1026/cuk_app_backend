// models/Achievement.js
const db = require('../db');

class Achievement {
    static createAchievement({ title, details, image_path }, callback) {
        const query = `INSERT INTO achievements (title, details, image_path) VALUES (?, ?, ?)`;
        db.query(query, [title, details, image_path], callback);
    }

    static getAllAchievements(callback) {
        const query = `SELECT * FROM achievements ORDER BY created_at DESC`;
        db.query(query, callback);
    }

    // You can add other methods like `updateAchievement`, `deleteAchievement`, etc.
}

module.exports = Achievement;
