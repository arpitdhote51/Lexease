import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDcFJTJnGLI-uVStqI8uuQVcQMY34ilMJg",
    authDomain: "studio-7376954909-7abc4.firebaseapp.com",
    projectId: "studio-7376954909-7abc4",
    storageBucket: "studio-7376954909-7abc4.firebasestorage.app",
    messagingSenderId: "131083878984",
    appId: "1:131083878984:web:4504e29ddc8d7b405e4e7d",
    measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Use initializeFirestore to enable offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

export { app, auth, db };
