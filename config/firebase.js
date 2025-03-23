const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin; // ✅ Export admin directly instead of { admin }
const admin = require("firebase-admin");

// Check if FIREBASE_CONFIG environment variable is set
if (!process.env.FIREBASE_CONFIG) {
  throw new Error("FIREBASE_CONFIG environment variable is not set!");
}

// Parse Firebase credentials from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin; // ✅ Export the initialized admin instance
