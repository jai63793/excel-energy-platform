import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseAdminApp = null;
let isFirebaseMock = true;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : null;

if (projectId && clientEmail && privateKey && projectId !== 'your_project_id_here') {
  try {
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    isFirebaseMock = false;
    console.log('[Firebase-Admin] Initialized Firebase Admin SDK successfully.');
  } catch (error) {
    console.error('[Firebase-Admin] Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  console.log('[Firebase-Admin] Credentials missing or default. Running in Mock verification mode.');
}

export {
  admin,
  isFirebaseMock
};
