const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();
const { admin } = require('../config/firebase');

// ✅ Temporary in-memory store for OTPs (for email and mobile)
const otpStore = new Map();
const resendCount = new Map();
const blocklist = new Map(); // Track blocked users for 24 hours

// ✅ Function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Email transporter setup using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ✅ MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY; // MSG91 Auth Key
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID; // MSG91 Sender ID
const MSG91_ROUTE = process.env.MSG91_ROUTE; // MSG91 Route
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID; // MSG91 Template ID
const MSG91_OTP_URL = 'https://api.msg91.com/api/v5/otp'; // MSG91 OTP API endpoint
const MSG91_OTP_VERIFY_URL = 'https://api.msg91.com/api/v5/otp/verify'; // MSG91 OTP Verify API endpoint

// ✅ Route to send OTP to email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (blocklist.has(email)) {
      return res.status(400).json({ error: 'Resend limit reached. Try again after 24 hours.' });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // OTP valid for 10 minutes
    resendCount.set(email, 0); // Reset resend count

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is: ${otp}. This OTP is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ✅ Route to resend OTP to email (limit 2 times)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const count = resendCount.get(email) || 0;
    if (count >= 2) {
      blocklist.set(email, Date.now() + 24 * 60 * 60 * 1000); // Block for 24 hours
      return res.status(400).json({ error: 'Resend limit reached. Please try again after 24 hours.' });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // OTP valid for 10 minutes
    resendCount.set(email, count + 1);

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP for Registration (Resent)',
      text: `Your new OTP is: ${otp}. This OTP is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP resent successfully!' });
  } catch (error) {
    console.error('Error resending email OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ✅ Route to verify OTP
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    const { otp: storedOTP, expiresAt } = storedData;

    if (Date.now() > expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedOTP === otp) {
      otpStore.delete(email);
      resendCount.delete(email);
      blocklist.delete(email);
      return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ✅ Route to send OTP to mobile using MSG91
router.post('/send-mobile-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const otp = generateOTP(); // Generate a 6-digit OTP
    otpStore.set(phoneNumber, { otp, expiresAt: Date.now() + 15 * 60 * 1000 }); // OTP valid for 15 minutes

    // MSG91 API request to send OTP
    const response = await axios.post(
      MSG91_OTP_URL,
      {
        template_id: MSG91_TEMPLATE_ID, // Template ID from .env
        mobile: `91${phoneNumber}`, // Add country code (91 for India)
        otp: otp, // The OTP to send
      },
      {
        headers: {
          'Content-Type': 'application/json',
          authkey: MSG91_AUTH_KEY, // Auth key from .env
        },
      }
    );

    // Check if OTP was sent successfully
    if (response.data.type === 'success') {
      res.status(200).json({ message: 'OTP sent successfully!' });
    } else {
      throw new Error('Failed to send OTP via MSG91');
    }
  } catch (error) {
    console.error('Error sending mobile OTP:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ✅ Route to verify mobile OTP using MSG91
router.post('/verify-mobile-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // MSG91 API request to verify OTP
    const response = await axios.post(
      MSG91_OTP_VERIFY_URL,
      {
        mobile: `91${phoneNumber}`, // Add country code (91 for India)
        otp: otp, // The OTP entered by the user
      },
      {
        headers: {
          'Content-Type': 'application/json',
          authkey: MSG91_AUTH_KEY, // Auth key from .env
        },
      }
    );

    // Check if OTP was verified successfully
    if (response.data.type === 'success') {
      otpStore.delete(phoneNumber); // Clear OTP from memory after successful verification
      res.status(200).json({ message: 'Mobile OTP verified successfully!' });
    } else {
      throw new Error('Invalid OTP');
    }
  } catch (error) {
    console.error('Error verifying mobile OTP:', error.response?.data || error.message);
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

module.exports = router;