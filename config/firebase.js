const admin = require("firebase-admin");

// Ensure Firebase is initialized only once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Export the existing initialized instance
module.exports = admin;
