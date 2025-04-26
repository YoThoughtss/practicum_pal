  import { auth, db } from "../firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { doc, getDoc } from "firebase/firestore";

  export const studentLogin = async (studentId, password) => {
      try {
        // Check internet connection
        if (!navigator.onLine) {
          throw new Error("No internet connection. Please check your network and try again.");
        }
    
        // Validate inputs
        if (!studentId || !password) {
          throw new Error("Please enter both student ID and password.");
        }
    
        // Validate student ID format (example: 1234-5678)
        const studentIdRegex = /^\d{4}-\d{4}$/;
        if (!studentIdRegex.test(studentId)) {
          throw new Error("Please enter a valid student ID in the format XXXX-XXXX");
        }
    
        // Check if student exists in Firestore
        const studentDocRef = doc(db, "students", studentId);
        const studentDoc = await getDoc(studentDocRef);
        
        if (!studentDoc.exists()) {
          throw new Error("Student ID not found. Please check your ID or contact support.");
        }
        
        // Get the email associated with the studentId
        const studentData = studentDoc.data();
        const studentEmail = studentData.email;
        
        if (!studentEmail) {
          throw new Error("Account configuration error. Please contact support.");
        }
        
        // Proceed with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
          auth,
          studentEmail,
          password
        );
        
        return {
          firebaseUser: userCredential.user,
          studentData: studentDoc.data() // Return all student data
      };

      
      } catch (error) {
        // Convert Firebase errors to user-friendly messages
        let errorMessage = "Login failed. Please try again.";
        
        switch (error.code) {
          case "auth/invalid-credential":
            errorMessage = "Invalid Student Id or Password. Please try again.";
            break;
          case "auth/user-not-found":
            errorMessage = "Account not found. Please check your credentials.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Please try again or reset your password.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later.";
            break;
          case "unavailable":
            errorMessage = "Network error. Please check your internet connection.";
            break;
          case "firestore/unavailable":
            errorMessage = "Database unavailable. Please try again later.";
            break;
          default:
            if (error.message) {
              errorMessage = error.message;
            }
        }
        
        throw new Error(errorMessage);
      }
    };


    export const checkAuthState = () => {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });
    };
    
    export const storeAuthLocally = (user) => {
      if (user) {
        localStorage.setItem('firebaseUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          studentId: user.studentId,
          isAuthorized: user.isAuthorized,
          firstName: user.firstName,
          lastName: user.lastName,
          program: user.program
        }));
      }
    };
    
    export const getLocalAuth = () => {
      const userData = localStorage.getItem('firebaseUser');
      return userData ? JSON.parse(userData) : null;
    };