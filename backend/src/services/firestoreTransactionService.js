import admin from 'firebase-admin';
import env from '../config/env.js';

let firestoreDb = null;
let initializationAttempted = false;

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
      console.warn('[Firestore] Unified transaction logging skipped: Firebase Admin credentials are not configured.');
      return null;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    firestoreDb = admin.firestore();
    console.log('[Firestore] Unified transaction logging enabled.');
    return firestoreDb;
  } catch (error) {
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

  await transactionRef.set(transactionRecord, { merge: true });
  console.log('[Firestore] Unified transaction logged:', {
    transactionId,
    appId: env.APP_ID,
    amount: payment.amount,
    currency: payment.currency,
  });

  return { logged: true, transactionId };
}

export default {
  saveUnifiedTransaction,
};
