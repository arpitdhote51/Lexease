import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, Firestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDcFJTJnGLI-uVStqI8uuQVcQMY34ilMJg",
    authDomain: "studio-7376954909-7abc4.firebaseapp.com",
    projectId: "studio-7376954909-7abc4",
    storageBucket: "studio-7376954909-7abc4.firebasestorage.app",
    messagingSenderId: "131083878984",
    appId: "1:131083878984:web:4504e29ddc8d7b405e4e7d",
    measurementId: ""
};

// Singleton instances
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({})
      });
    } else {
      app = getApp();
      auth = getAuth(app);
      db = initializeFirestore(app, {
        localCache: memoryLocalCache({})
      });
    }
  }
}

// Initialize on script load
initializeFirebase();

// Export the instances. They can be undefined on the server-side.
export { app, auth, db };
