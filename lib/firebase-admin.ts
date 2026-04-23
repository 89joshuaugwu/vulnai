import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // If environment variables are available, use them. Otherwise fallback for local dev if needed.
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handling multiline private keys from environment variables safely
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
