import { db } from '../../../firebase';
import { doc, updateDoc } from "firebase/firestore";

(function() {
  // DOM Elements
  const modal = document.getElementById('editNameModal');
  const closeBtn = document.getElementById('closeEditNameModal');
  const form = document.getElementById('editNameForm');
  const currentNameDisplay = document.getElementById('currentNameDisplay');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Error/Success Modal elements
  const errorModal = document.getElementById('error-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const closeModalBtn = document.getElementById('close-modal');
  const confirmActionBtn = document.getElementById('confirm-action');

  // Safety check
  if (!modal || !closeBtn || !form || !currentNameDisplay || !firstNameInput || !lastNameInput) {
    console.error('Modal elements missing!');
    return;
  }

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
  firstNameInput.value = currentFirstName;
  lastNameInput.value = currentLastName;

  // ===== 1. AUTO-CAPITALIZATION ===== //
  function capitalizeName(str) {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  function handleNameInput(e) {
    const cursorPos = e.target.selectionStart;
    e.target.value = e.target.value
      .replace(/[^a-zA-Z' -]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart();
    
    // Capitalize while preserving cursor position
    if (e.target.value.length > 0) {
      e.target.value = capitalizeName(e.target.value);
      e.target.setSelectionRange(cursorPos, cursorPos);
    }
  }

  // ===== 2. LOADING SPINNER ===== //
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading
      ? `<div class="inline-flex items-center">
           <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
             <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           Updating...
         </div>`
      : 'Update';
  }

  // ===== 3. FANCY TOAST ===== //
  function showSuccessToast(message) {
    const toastId = 'success-toast';
    let toast = document.getElementById(toastId);
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'fixed bottom-4 right-4 w-80 bg-green-500 text-white rounded-lg shadow-xl overflow-hidden z-50 transform transition-all duration-300 translate-y-4 opacity-0';
      toast.innerHTML = `
        <div class="flex items-start p-4">
          <svg class="h-6 w-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div class="flex-1">
            <p class="font-medium">${message}</p>
            <div class="h-1 bg-green-400 mt-2">
              <div class="toast-progress h-full bg-green-700"></div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      }, 10);
      
      // Animate progress bar
      const progressBar = toast.querySelector('.toast-progress');
      progressBar.style.width = '100%';
      progressBar.style.transition = 'width 3s linear';
      setTimeout(() => progressBar.style.width = '0%', 10);
      
      // Remove after animation
      setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // ===== CORE VALIDATION ===== //
  function createErrorElement(input) {
    const errorElement = document.createElement('p');
    errorElement.className = 'error-message text-red-500 text-xs mt-1 hidden';
    input.parentNode.appendChild(errorElement);
    return errorElement;
  }

  const firstNameError = createErrorElement(firstNameInput);
  const lastNameError = createErrorElement(lastNameInput);

  function validateField(input, errorElement) {
    const value = input.value.trim();
    if (!value) {
      errorElement.textContent = `This field is required`;
      errorElement.classList.remove('hidden');
      input.classList.add('border-red-500');
      return false;
    }
    errorElement.classList.add('hidden');
    input.classList.remove('border-red-500');
    return true;
  }

  // ===== MODAL CONTROLS ===== //
  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    [firstNameError, lastNameError].forEach(el => el.classList.add('hidden'));
    [firstNameInput, lastNameInput].forEach(el => el.classList.remove('border-red-500'));
  }

  function openModal() {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    firstNameInput.focus();
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

  // ===== EVENT LISTENERS ===== //
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

  // Input handling
  [firstNameInput, lastNameInput].forEach(input => {
    const errorElement = input === firstNameInput ? firstNameError : lastNameError;
    
    input.addEventListener('keydown', (e) => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', ' ', '-', "'"];
      if ((e.key >= '0' && e.key <= '9') || (!/^[a-zA-Z'-]$/.test(e.key) && !allowedKeys.includes(e.key))) {
        e.preventDefault();
      }
    });
    
    input.addEventListener('input', handleNameInput);
    input.addEventListener('blur', () => validateField(input, errorElement));
  });

  // Form submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate
    const isFirstNameValid = validateField(firstNameInput, firstNameError);
    const isLastNameValid = validateField(lastNameInput, lastNameError);
    if (!isFirstNameValid || !isLastNameValid) return;

    const firstName = capitalizeName(firstNameInput.value.trim());
    const lastName = capitalizeName(lastNameInput.value.trim());

    // Show loading
    setLoading(true);

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
      showSuccessToast('Name updated successfully!');
      showFeedbackModal('Success', 'Name updated successfully!');

    } catch (error) {
      console.error('Error updating name:', error);
      showFeedbackModal('Error', 'Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Initialize
  openModal();
})();