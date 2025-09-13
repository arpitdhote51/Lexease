import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDcFJTJnGLI-uVStqI8uuQVcQMY34ilMJg",
    authDomain: "studio-7376954909-7abc4.firebaseapp.com",
    projectId: "studio-7376954909-7abc4",
    storageBucket: "studio-7376954909-7abc4.firebasestorage.app",
    messagingSenderId: "131083878984",
    appId: "1:131083878984:web:4504e29ddc8d7b405e4e7d",
    measurementId: ""
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({})
    });
}

// These exports can be undefined on the server-side,
// so ensure they are only used in client components.
export { app, auth, db };