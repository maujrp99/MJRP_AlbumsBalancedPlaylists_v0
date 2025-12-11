import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Initialize Firebase
const firebaseConfig = window.__firebase_config || {
    // Fallback if window config is missing (should be injected by server/build)
    apiKey: "API_KEY_PLACEHOLDER",
    authDomain: "mjrp-albums.firebaseapp.com",
    projectId: "mjrp-albums",
    storageBucket: "mjrp-albums.appspot.com",
    messagingSenderId: "SENDER_ID_PLACEHOLDER",
    appId: "APP_ID_PLACEHOLDER"
}

// Initialize the App (NPM SDK)
const app = initializeApp(firebaseConfig)

// Get Auth and Firestore instances
const auth = getAuth(app)
const db = getFirestore(app)

console.log('🔥 Firebase Initialized (NPM SDK)')

export { app, auth, db }
