import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";

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

// Initialize Firebase on the client side
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
            localCache: persistentLocalCache({})
        });
    }
}

// Export the initialized instances
export { app, auth, db };
