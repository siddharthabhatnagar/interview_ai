import admin from 'firebase-admin';
import env from '../config/env.js';

let firestoreDb = null;
let initializationAttempted = false;
let lastInitError = null;
let lastLoggedTransactionAt = null;
let lastWriteError = null;

function normalizePrivateKey(value) {
  return value?.replace(/\\n/g, '\n');
}

function getServiceAccountFromEnv() {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return {
      projectId: parsed.project_id || parsed.projectId,
      clientEmail: parsed.client_email || parsed.clientEmail,
      privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey),
    };
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
}

function getFirestoreDb() {
  if (!env.FIRESTORE_TRANSACTIONS_ENABLED) {
    return null;
  }

  if (firestoreDb) {
    return firestoreDb;
  }

  if (initializationAttempted) {
    return null;
  }

  initializationAttempted = true;

  try {
    const serviceAccount = getServiceAccountFromEnv();
    if (!serviceAccount) {
      lastInitError = 'Firebase Admin credentials are not configured';
      console.warn('[Firestore] Unified transaction logging skipped: Firebase Admin credentials are not configured.');
      return null;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    firestoreDb = admin.firestore();
    lastInitError = null;
    console.log('[Firestore] Unified transaction logging enabled.');
    return firestoreDb;
  } catch (error) {
    lastInitError = error.message;
    console.error('[Firestore] Failed to initialize Firebase Admin:', error.message);
    return null;
  }
}

export async function saveUnifiedTransaction({
  user,
  payment,
  planDetails,
  gateway = 'razorpay',
}) {
  const db = getFirestoreDb();
  if (!db) {
    return { logged: false, reason: 'firestore_not_configured' };
  }

  const transactionId = payment.razorpayPaymentId || payment.razorpayOrderId || payment._id.toString();
  const transactionRef = db
    .collection(env.FIRESTORE_TRANSACTIONS_COLLECTION)
    .doc(transactionId);

  const transactionRecord = {
    app_id: env.APP_ID,
    user_id: user._id.toString(),
    user_email: user.email,
    transaction_id: transactionId,
    local_payment_id: payment._id.toString(),
    gateway,
    gateway_order_id: payment.razorpayOrderId,
    gateway_payment_id: payment.razorpayPaymentId,
    amount: payment.amount,
    currency: payment.currency,
    status: 'SUCCESS',
    plan_purchased: payment.subscriptionPlan,
    plan_name: planDetails?.name || payment.subscriptionPlan,
    credits_added: planDetails?.credits || 0,
    source_database: 'mongodb',
    environment: env.NODE_ENV,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await transactionRef.set(transactionRecord, { merge: true });
  } catch (error) {
    lastWriteError = error.message;
    throw error;
  }

  lastWriteError = null;
  lastLoggedTransactionAt = new Date().toISOString();
  console.log('[Firestore] Unified transaction logged:', {
    transactionId,
    appId: env.APP_ID,
    amount: payment.amount,
    currency: payment.currency,
  });

  return { logged: true, transactionId };
}

export function getFirestoreTransactionStatus() {
  return {
    enabled: env.FIRESTORE_TRANSACTIONS_ENABLED,
    initialized: Boolean(firestoreDb),
    initializationAttempted,
    hasServiceAccountJson: Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON),
    hasSplitCredentials: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
    projectIdConfigured: Boolean(env.FIREBASE_PROJECT_ID || env.FIREBASE_SERVICE_ACCOUNT_JSON),
    collection: env.FIRESTORE_TRANSACTIONS_COLLECTION,
    appId: env.APP_ID,
    lastInitError,
    lastWriteError,
    lastLoggedTransactionAt,
  };
}

export default {
  saveUnifiedTransaction,
  getFirestoreTransactionStatus,
};
