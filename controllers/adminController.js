const registerAdmin = (req, res) => {
  const { username, password, employeeID, authKey } = req.body;

  if (authKey !== 'secureAdminKey') {
    return res.status(401).json({ message: 'Invalid authorization key' });
  }

  if (password !== req.body.confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Logic to register the admin (e.g., inserting data into database)
  return res.status(200).json({ message: 'Registration successful' });
};

module.exports = { registerAdmin };
