import { auth } from "../backend/firebase";
import { signOut } from "firebase/auth";

export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    console.log("Successfully logged out");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
