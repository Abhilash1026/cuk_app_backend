const express = require('express');
const { db } = require('../db'); // MySQL connection
const admin = require('../config/firebase'); // Firebase Admin SDK
const router = express.Router();

// ✅ API to submit posts & auto-send notifications
router.post('/post', async (req, res) => {
    const { topic, heading, fileUri, info } = req.body;

    // ✅ Input Validation
    if (!topic || !heading || !fileUri || !info) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    // ✅ Define topic table mapping
    const topicTables = { news: 'news', events: 'events', achievements: 'achievements' };
    const topicTable = topicTables[topic];
    if (!topicTable) {
        return res.status(400).json({ message: 'Invalid topic provided' });
    }

    try {
        // ✅ Insert into `posts` table
        const postQuery = 'INSERT INTO posts (topic, heading, fileUri, info) VALUES (?, ?, ?, ?)';
        const [postResult] = await db.execute(postQuery, [topic, heading, fileUri, info]);
        const postId = postResult.insertId;

        // ✅ Insert into topic-specific table
        const topicQuery = `INSERT INTO ${topicTable} (post_id, heading, fileUri, info) VALUES (?, ?, ?, ?)`;
        await db.execute(topicQuery, [postId, heading, fileUri, info]);

        console.log("✅ Post successfully inserted!");

        // ✅ Fetch FCM Tokens from students & faculty tables
        const [students] = await db.execute("SELECT fcm_token FROM students WHERE fcm_token IS NOT NULL");
        const [faculty] = await db.execute("SELECT fcm_token FROM faculty WHERE fcm_token IS NOT NULL");

        // ✅ Filter and combine tokens
        const tokens = [
            ...students.map(s => s.fcm_token),
            ...faculty.map(f => f.fcm_token)
        ].filter(token => token && token.trim() !== ""); // Remove empty/null tokens

        if (tokens.length === 0) {
            console.log("⚠️ No valid FCM tokens found!");
            return res.json({ message: "Post created, but no users to notify." });
        }

        console.log("📲 Sending notifications to users...");

        // ✅ Notification payload
        const message = {
            notification: {
                title: `📢 New ${topic.charAt(0).toUpperCase() + topic.slice(1)} Posted`,
                body: heading
            },
            data: {
                title: `📢 New ${topic.charAt(0).toUpperCase() + topic.slice(1)} Posted`,
                body: heading,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            android: {
                priority: "high",
                notification: { sound: "default", channelId: "cuk_app_channel" },
            },
            apns: {
                payload: { aps: { sound: "default" } },
            }
        };

        // ✅ Send notifications
        const response = await admin.messaging().sendEachForMulticast({ tokens, ...message });

        console.log(`✅ Sent Successfully: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

        // ✅ Handle failed notifications
        if (response.failureCount > 0) {
            response.responses.forEach((resp, index) => {
                if (!resp.success) {
                    console.error(`❌ Failed notification to ${tokens[index]}: ${resp.error}`);
                }
            });
        }

        res.status(201).json({
            message: `${topic.charAt(0).toUpperCase() + topic.slice(1)} post submitted successfully!`,
            notificationResponse: response
        });

    } catch (error) {
        console.error("❌ Database or FCM error:", error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

// ✅ Fetch posts by topic
router.get('/posts/:topic', async (req, res) => {
    const { topic } = req.params;

    if (!['news', 'events', 'achievements'].includes(topic)) {
        return res.status(400).json({ message: 'Invalid topic. Choose from "news", "events", "achievements".' });
    }

    try {
        const query = `SELECT * FROM ${topic} ORDER BY created_at DESC`;
        const [posts] = await db.execute(query);

        if (posts.length === 0) {
            return res.status(404).json({ message: `No ${topic} posts found.` });
        }

        res.status(200).json({ posts });

    } catch (error) {
        console.error(`❌ Error fetching posts:`, error);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
