// editNameModal.js
import { db } from '../../firebase';
import { doc, updateDoc } from "firebase/firestore";

(function() {
  const modal = document.getElementById('editNameModal');
  const closeBtn = document.getElementById('closeEditNameModal');
  const form = document.getElementById('editNameForm');
  const currentNameDisplay = document.getElementById('currentNameDisplay');

  // Error/Success Modal elements
  const errorModal = document.getElementById('error-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const closeModalBtn = document.getElementById('close-modal');
  const confirmActionBtn = document.getElementById('confirm-action');

  if (!modal || !closeBtn || !form) return;

  // Get user data from localStorage
  const storedAuth = localStorage.getItem('firebaseUser');
  const authData = JSON.parse(storedAuth);
  const studentId = authData.studentId;
  const currentFirstName = authData.firstName;
  const currentLastName = authData.lastName;

  if (!studentId) {
    showFeedbackModal('Error', 'No student ID found in localStorage');
    return;
  }

  // Set current name display
  currentNameDisplay.textContent = `${currentFirstName} ${currentLastName}`;

  // Pre-fill form with current values
  document.getElementById('firstName').value = currentFirstName;
  document.getElementById('lastName').value = currentLastName;

  // Close modal function
  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  // Show feedback modal function
  function showFeedbackModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    errorModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => {
      window.location.reload();
  }, 2000);
    
  }

  // Close feedback modal function
  function closeFeedbackModal() {
    errorModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  // Attach event listeners
  closeBtn.addEventListener('click', closeModal);
  closeModalBtn.addEventListener('click', closeFeedbackModal);
  confirmActionBtn.addEventListener('click', closeFeedbackModal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  errorModal.addEventListener('click', function(e) {
    if (e.target === errorModal) closeFeedbackModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (!errorModal.classList.contains('hidden')) {
        closeFeedbackModal();
      } else {
        closeModal();
      }
    }
  });

  // Form submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();

    if (!firstName || !lastName) {
      showFeedbackModal('Error', 'Please fill in both first and last names');
      return;
    }

    try {
      // Update Firestore
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, {
        firstName: firstName,
        lastName: lastName
      });

      // Update localStorage
      authData.firstName = firstName;
      authData.lastName = lastName;
      localStorage.setItem('firebaseUser', JSON.stringify(authData));

      // Update UI
      currentNameDisplay.textContent = `${firstName} ${lastName}`;
      
      // Close modal
      closeModal();
      
      // Show success message
      showFeedbackModal('Success', 'Name updated successfully!');



    } catch (error) {
      console.error('Error updating name:', error);
      showFeedbackModal('Error', 'Failed to update name. Please try again.');
    }
  });

  // Show the modal after injection
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
})();