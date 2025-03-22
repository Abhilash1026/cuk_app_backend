const express = require('express');
const admin = require('../config/firebase'); // Firebase Admin SDK
const { db } = require('../db'); // MySQL connection
const router = express.Router();

/**
 * ✅ Manual API to send push notifications (For Debugging & Testing)
 */
router.post('/send', async (req, res) => {
    const { title, body, tokens } = req.body;

    console.log("📩 Incoming Notification Request:", req.body);

    // ✅ Input validation
    if (!title || !body || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ error: 'Title, body, and valid tokens are required' });
    }

    // ✅ Create FCM message
    const message = {
        notification: { title, body },
        data: { title, body, click_action: 'FLUTTER_NOTIFICATION_CLICK' }, // Required for background state
        android: { priority: "high", notification: { sound: "default", channelId: "cuk_app_channel" } },
        apns: { payload: { aps: { sound: "default" } } }
    };

    try {
        console.log('📲 Sending notifications to:', tokens);
        const response = await admin.messaging().sendEachForMulticast({ tokens, ...message });

        console.log(`✅ Sent Successfully: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

        res.json({
            success: true,
            message: 'Notification sent successfully',
            response
        });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
});

/**
 * ✅ API to Send Push Notification After Admin Posts News/Events
 */
router.post('/send-post-notification', async (req, res) => {
    const { title, body } = req.body;

    console.log("📰 New Post Notification Request:", req.body);

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        // ✅ Fetch FCM tokens of registered users (students & faculty)
        const [students] = await pool.query("SELECT fcm_token FROM students WHERE fcm_token IS NOT NULL");
        const [faculty] = await pool.query("SELECT fcm_token FROM faculty WHERE fcm_token IS NOT NULL");

        const studentTokens = students.map(row => row.fcm_token);
        const facultyTokens = faculty.map(row => row.fcm_token);

        const allTokens = [...studentTokens, ...facultyTokens];

        if (allTokens.length === 0) {
            console.log("⚠️ No registered users have FCM tokens.");
            return res.status(400).json({ error: 'No registered users have FCM tokens' });
        }

        console.log(`📲 Sending notification to ${allTokens.length} users...`);

        // ✅ Create notification payload
        const message = {
            notification: { title, body },
            data: { title, body, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
            android: { priority: "high", notification: { sound: "default", channelId: "cuk_app_channel" } },
            apns: { payload: { aps: { sound: "default" } } }
        };

        // ✅ Send push notifications
        const response = await admin.messaging().sendEachForMulticast({ tokens: allTokens, ...message });

        console.log(`✅ Sent: ${response.successCount}, ❌ Failed: ${response.failureCount}`);

        res.json({
            success: true,
            message: `Notification sent to ${allTokens.length} users`,
            response
        });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
});

module.exports = router;
