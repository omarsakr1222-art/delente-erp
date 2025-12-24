// writeRole.js
// Usage:
// 1. From Firebase Console -> Project Settings -> Service accounts -> Generate private key
//    and save the JSON as `serviceAccountKey.json` next to this file.
// 2. Install dependency: `npm install firebase-admin`
// 3. Run: `node writeRole.js <UID>`  (or edit the UID below)

const admin = require('firebase-admin');
const fs = require('fs');

const SERVICE_KEY = './serviceAccountKey.json';
if (!fs.existsSync(SERVICE_KEY)) {
  console.error('serviceAccountKey.json not found. Download it from Firebase Console -> Project Settings -> Service accounts.');
  process.exit(1);
}

const serviceAccount = require(SERVICE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uidArg = process.argv[2];
if (!uidArg) {
  console.error('Usage: node writeRole.js <UID>');
  process.exit(1);
}

const uid = uidArg;

async function writeRole() {
  try {
    const db = admin.firestore();
    await db.collection('roles').doc(uid).set({ role: 'admin' }, { merge: true });
    console.log('Wrote roles/' + uid + ' { role: "admin" }');
    process.exit(0);
  } catch (e) {
    console.error('Failed to write role document:', e);
    process.exit(1);
  }
}

writeRole();
