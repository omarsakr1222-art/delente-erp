// setAdmin.js
// Usage:
// 1. Download service account key JSON from Firebase Console (Project Settings → Service accounts → Generate new private key)
// 2. Save that file as `serviceAccountKey.json` alongside this script.
// 3. Run in PowerShell from project folder:
//    npm install firebase-admin
//    node setAdmin.js
// 4. The script will set custom claim { admin: true } for the UID below.

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'UaaXtreN4DW9Rq9rXnNOzZd2uj82'; // replace UID if needed

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Custom claim set for', uid);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error setting claim:', err);
    process.exit(1);
  });
