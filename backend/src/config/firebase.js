import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : null;

let firebaseInitialized = false;

if (!projectId || !clientEmail || !privateKey) {
  console.warn('[Firebase-Admin] Warning: Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing in environment variables. Firebase features will run in mock mode only.');
} else {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    firebaseInitialized = true;
    console.log('[Firebase-Admin] Initialized Firebase Admin SDK successfully.');
  } catch (error) {
    console.error('[Firebase-Admin] Failed to initialize Firebase Admin SDK:', error.message);
  }
}

export {
  admin,
  firebaseInitialized
};
