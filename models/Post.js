// models/Post.js
const db = require('../db');

// Model method to create a news post
exports.createNewsPost = (data, callback) => {
    const { title, details, image_path } = data;
    const query = 'INSERT INTO news (title, details, image_path) VALUES (?, ?, ?)';
    db.query(query, [title, details, image_path], callback);
};

// Model method to get all news posts
exports.getAllNews = (callback) => {
    const query = 'SELECT * FROM news ORDER BY created_at DESC';
    db.query(query, callback);
};
