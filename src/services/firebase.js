import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier as RealRecaptchaVerifier, signInWithPhoneNumber as realSignInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let firebaseApp = null;
let firebaseAuth = null;
let isMockMode = false;

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your_api_key')) {
  console.warn('[Firebase] No API key detected. Using Mock Authentication mode.');
  isMockMode = true;
} else {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
  } catch (error) {
    console.error('[Firebase] Failed to initialize real Firebase, using Mock Authentication mode:', error);
    isMockMode = true;
  }
}

// Expose standard functions for Real Firebase setup
export const initRecaptcha = (containerId) => {
  if (isMockMode) {
    return {
      render: async () => 0,
      clear: () => {}
    };
  }
  return new RealRecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible'
  });
};

export const sendOTPWithFirebase = async (phoneNumber, appVerifier) => {
  if (isMockMode) {
    console.log(`[Mock Firebase] Sending OTP to ${phoneNumber}`);
    return {
      isMock: true,
      otp: '123456',
      confirm: async (enteredCode) => {
        if (enteredCode === '123456') {
          return {
            user: {
              phoneNumber,
              getIdToken: async () => `mock-token-${phoneNumber}`
            }
          };
        } else {
          throw new Error('Invalid verification code.');
        }
      }
    };
  }

  // Real Firebase call
  const confirmationResult = await realSignInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
  return {
    isMock: false,
    confirm: async (enteredCode) => {
      const userCredential = await confirmationResult.confirm(enteredCode);
      return userCredential;
    }
  };
};


