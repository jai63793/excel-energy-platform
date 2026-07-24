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
let isMock = true;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here') {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
    isMock = false;
    console.log('[Firebase] Live Auth Service initialized successfully.');
  } catch (error) {
    console.error('[Firebase] Failed to initialize live Firebase:', error.message);
  }
} else {
  console.log('[Firebase-MOCK] Initializing in mock mode.');
}

// Expose standard functions that route to either Real or Mock depending on config
export const initRecaptcha = (containerId) => {
  if (isMock) {
    console.log('[Firebase-MOCK] Initializing mock RecaptchaVerifier on:', containerId);
    return {
      verify: () => Promise.resolve('mock_recaptcha_token'),
      clear: () => {}
    };
  }
  return new RealRecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible'
  });
};

export const sendOTPWithFirebase = async (phoneNumber, appVerifier) => {
  if (isMock) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Firebase-MOCK] Dispatching mock OTP for ${phoneNumber}: ${code}`);
    return {
      isMock: true,
      otp: code,
      confirm: async (enteredCode) => {
        if (enteredCode === code || enteredCode === '123456') {
          console.log('[Firebase-MOCK] Mock OTP code confirmed.');
          return {
            user: {
              uid: 'mock_firebase_uid_' + phoneNumber.replace(/\D/g, ''),
              phoneNumber: phoneNumber,
              getIdToken: () => Promise.resolve(`mock_firebase_token_${phoneNumber.replace(/\D/g, '')}`)
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
