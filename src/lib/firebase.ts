"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore, serverTimestamp } from "firebase/firestore";

type FirebaseWebAppConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

const envConfig: FirebaseWebAppConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getFirebaseConfig = (): FirebaseWebAppConfig => {
  if (
    envConfig.apiKey &&
    envConfig.authDomain &&
    envConfig.projectId &&
    envConfig.appId
  ) {
    return envConfig;
  }

  const rawConfig = process.env.FIREBASE_WEBAPP_CONFIG;
  if (rawConfig) {
    try {
      const parsed = JSON.parse(rawConfig) as FirebaseWebAppConfig;
      const mappedConfig = {
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket,
        messagingSenderId: parsed.messagingSenderId,
        appId: parsed.appId,
        measurementId: parsed.measurementId,
      };

      if (
        mappedConfig.apiKey &&
        mappedConfig.authDomain &&
        mappedConfig.projectId &&
        mappedConfig.appId
      ) {
        return mappedConfig;
      }
    } catch {
      throw new Error(
        "Failed to parse FIREBASE_WEBAPP_CONFIG. Provide valid JSON or set NEXT_PUBLIC_FIREBASE_* env vars.",
      );
    }
  }

  throw new Error(
    "Missing Firebase config. Set NEXT_PUBLIC_FIREBASE_* env vars or provide FIREBASE_WEBAPP_CONFIG.",
  );
};

const firebaseConfig = getFirebaseConfig();
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth | null =
  typeof window !== "undefined" ? getAuth(app) : null;

export const getAuthClient = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth is only available in the browser.");
  }
  return auth ?? getAuth(app);
};
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
export { serverTimestamp };
