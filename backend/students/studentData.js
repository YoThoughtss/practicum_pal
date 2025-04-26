// backend/students/studentData.js
import { db } from '../firebase'; // Adjust path to your Firebase config
import { doc, getDoc } from 'firebase/firestore';

/**
 * Fetches student data from Firestore
 * @param {string} studentId - The student's UID or document ID
 * @returns {Promise<Object|null>} - Student data object or null if not found
 */
export const getStudentData = async (studentId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      return studentSnap.data();
    } else {
      console.log('No such student document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    throw error;
  }
};