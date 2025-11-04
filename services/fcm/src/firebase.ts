import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// FIREBASE ADMIN SETUP
// ============================================
let isFirebaseInitialized = false;

try {
  const serviceAccountPath =
    process.env.SERVICE_ACCOUNT_PATH ||
    path.resolve(__dirname, '..', '..', 'service-account.json');

  // Check if file exists
  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(
      '⚠️  Firebase service account file not found. FCM notifications will be disabled.'
    );
    console.warn(`   Expected path: ${serviceAccountPath}`);
    console.warn(
      '   Set SERVICE_ACCOUNT_PATH environment variable or place service-account.json in the root directory.'
    );
  } else {
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error(
    '❌ Failed to initialize Firebase Admin:',
    (error as Error).message
  );
  console.warn('⚠️  FCM notifications will be disabled.');
}

export { admin };
export const isFirebaseReady = (): boolean => isFirebaseInitialized;
