// Import Firebase functions
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from '../../firebase';

// Initialize Firebase Storage
const storage = getStorage();

async function loadStudentProfile() {
  try {
    const storedAuth = localStorage.getItem('firebaseUser');
    const authData = JSON.parse(storedAuth);
    const studentId = authData.studentId;
    if (!studentId) {
      console.error('No student ID found in localStorage');
      return;
    }

    // Get reference to the student document
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      
      // Update profile image with cache busting
      const profileImage = document.getElementById('profile-image');
      if (studentData.profileImage) {
        profileImage.src = `${studentData.profileImage}&t=${Date.now()}`;
      }

      // Update all fields using IDs
      document.getElementById('student-id').textContent = studentData.studentId || '[Not provided]';
      document.getElementById('student-name').textContent = 
        `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || '[Not provided]';
      document.getElementById('student-gender').textContent = studentData.gender || '[Not provided]';
      document.getElementById('student-program').textContent = studentData.program || '[Not provided]';
      document.getElementById('student-block').textContent = studentData.block || '[Not provided]';
      document.getElementById('student-email').textContent = studentData.email || '[Not provided]';
      document.getElementById('student-contact').textContent = studentData.contactNumber || '[Not provided]';
      document.getElementById('company-name').textContent = studentData.companyName || '[Not assigned]';
      document.getElementById('company-address').textContent = studentData.companyAddress || '[Not assigned]';
    } else {
      console.error('No student data found for ID:', studentId);
    }
  } catch (error) {
    console.error('Error loading student profile:', error);
  }
}

// Profile picture upload handler with resized image support
document.getElementById('profile-picture-container')?.addEventListener('click', function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Get student ID from localStorage
      const storedAuth = localStorage.getItem('firebaseUser');
      const authData = JSON.parse(storedAuth);
      const studentId = authData.studentId;
      
      if (!studentId) {
        showMessage('error', 'No student ID found for upload');
        return;
      }

      // Show loading indicator
      const profileImageContainer = document.getElementById('profile-picture-container');
      const profileImage = document.getElementById('profile-image');
      
      // Create and show loading spinner
      const spinner = document.createElement('div');
      spinner.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full';
      spinner.innerHTML = `
        <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `;
      profileImageContainer.appendChild(spinner);
      profileImage.classList.add('opacity-50');

      // File naming and path setup
      const originalFileName = "profileImage.jpeg";
      const resizedFileName = "profileImage_1024x1024.jpeg";
      const encodedStudentId = studentId.replace("-", "%2D");
      
      // Upload original image
      const storageRef = ref(storage, `students/${studentId}/${originalFileName}`);
      await uploadBytes(storageRef, file);
      
      // Wait for resized image to be available
      const bucketName = "practicumpal.firebasestorage.app";
      const permanentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/students%2F${encodedStudentId}%2F${resizedFileName}?alt=media`;
      
      let resizedImageAvailable = false;
      let attempts = 0;
      const maxAttempts = 10; // 10 seconds max wait time
      
      while (!resizedImageAvailable && attempts < maxAttempts) {
        attempts++;
        try {
          await getDownloadURL(ref(storage, `students/${studentId}/${resizedFileName}`));
          resizedImageAvailable = true;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      if (!resizedImageAvailable) {
        throw new Error('Resized image not available after waiting');
      }

      // Update Firestore with resized image URL
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        profileImage: permanentUrl
      });
      
      // Update profile image with cache busting
      profileImage.src = `${permanentUrl}&t=${Date.now()}`;
      
      // Clean up loading state
      profileImage.classList.remove('opacity-50');
      profileImageContainer.removeChild(spinner);
      
      showMessage('success', 'Profile picture updated successfully!');
      
      // Refresh after delay to ensure complete update
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error uploading profile image:', error);
      const profileImage = document.getElementById('profile-image');
      const profileImageContainer = document.getElementById('profile-picture-container');
      profileImage.classList.remove('opacity-50');
      const spinner = profileImageContainer.querySelector('.absolute');
      if (spinner) profileImageContainer.removeChild(spinner);
      showMessage('error', 'Failed to update profile picture. Please try again.');
    }
  };
  
  input.click();
});

// Helper function to show user messages with Tailwind
function showMessage(type, text) {
  // Remove any existing messages first
  const existingMessage = document.getElementById('upload-message');
  if (existingMessage) existingMessage.remove();

  const messageDiv = document.createElement('div');
  messageDiv.id = 'upload-message';
  messageDiv.className = `fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } animate-fade-in`;
  
  messageDiv.textContent = text;
  document.body.appendChild(messageDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.classList.remove('animate-fade-in');
    messageDiv.classList.add('animate-fade-out');
    setTimeout(() => {
      messageDiv.remove();
    }, 300);
  }, 5000);
}

// Load the profile data when the page loads
document.addEventListener('DOMContentLoaded', loadStudentProfile);