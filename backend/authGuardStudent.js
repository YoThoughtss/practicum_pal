// authGuard.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { app } from "./firebase"; // adjust if your firebase app is exported differently

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // No user is signed in, redirect to login page
    window.location.href = "../pages/student-login.html";
  }

  console.log("There are Currently Logged In ");
});
