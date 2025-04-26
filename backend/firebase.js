import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore, persistentLocalCache, persistentMultipleTabManager, initializeFirestore, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBVizCJDaJm7pqPuSUvDjzIczmega60FP4",
    authDomain: "practicumpal.firebaseapp.com",
    databaseURL: "https://practicumpal-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "practicumpal",
    storageBucket: "practicumpal.firebasestorage.app",
    messagingSenderId: "349349419164",
    appId: "1:349349419164:web:34f2d365b472cbfe26b559",
    measurementId: "G-BZKSB8YC12"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Configure auth persistence
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Failed to set persistence:", error);
    // Fallback to in-memory persistence
    setPersistence(auth, inMemoryPersistence);
  });

// Initialize Firestore with persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});


export { app, auth, db, storage };