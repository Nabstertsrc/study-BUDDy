import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadString } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCMg1bMmkZ38lUgl5Ec4moUIKwwjYxNMfE",
    authDomain: "queueafrica-eb107.firebaseapp.com",
    databaseURL: "https://queueafrica-eb107.firebaseio.com",
    projectId: "queueafrica-eb107",
    storageBucket: "queueafrica-eb107.firebasestorage.app",
    messagingSenderId: "311336122689",
    appId: "1:311336122689:web:564f0e8b930e8c5b7ac9c0"
};

async function testFirebase() {
    try {
        console.log("Initializing Firebase for queueafrica-eb107...");
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        
        console.log("Attempting to sign in or create test user...");
        let userCred;
        try {
            userCred = await signInWithEmailAndPassword(auth, "testuser@studybuddy.ai", "password123");
        } catch (e) {
            userCred = await createUserWithEmailAndPassword(auth, "testuser@studybuddy.ai", "password123");
        }
        
        const uid = userCred.user.uid;
        console.log("Signed in with UID:", uid);

        const db = getFirestore(app);
        console.log("Testing Firestore write...");
        const testDocRef = doc(db, 'users', uid, 'test_collection', 'test_doc');
        await setDoc(testDocRef, { test: "success", timestamp: new Date().toISOString() });
        console.log("✅ Firestore write successful!");

        const storage = getStorage(app);
        console.log("Testing Storage write...");
        const testStorageRef = ref(storage, `uploads/${uid}/test.txt`);
        await uploadString(testStorageRef, "Hello World test upload");
        console.log("✅ Storage write successful!");

        console.log("All systems GO!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Firebase Test Failed:", e);
        process.exit(1);
    }
}

testFirebase();
