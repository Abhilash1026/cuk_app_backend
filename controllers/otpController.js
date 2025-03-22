exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Your OTP generation logic here
    const otp = Math.floor(100000 + Math.random() * 900000);

    res.status(200).json({ message: 'OTP sent successfully', otp });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};
