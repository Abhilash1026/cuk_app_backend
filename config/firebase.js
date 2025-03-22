const admin = require("firebase-admin");
const serviceAccount = require("../collegeapp-a5c18-firebase-adminsdk-fbsvc-a77bee1c12.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin; // ✅ Export admin directly instead of { admin }
