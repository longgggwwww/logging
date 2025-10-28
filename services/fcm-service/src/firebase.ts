import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// FIREBASE ADMIN SETUP
// ============================================
try {
  const serviceAccountPath =
    process.env.SERVICE_ACCOUNT_PATH ||
    path.resolve(__dirname, '..', '..', 'service-account.json');
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error(
    '❌ Failed to initialize Firebase Admin:',
    (error as Error).message
  );
  process.exit(1);
}

export { admin };
