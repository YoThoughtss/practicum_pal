(function() {
  // DOM Elements
  const modal = document.getElementById('changeEmailModal');
  const closeBtn = document.getElementById('closeChangeEmailModal');
  const form = document.getElementById('changeEmailForm');
  const currentEmailDisplay = document.getElementById('currentEmailDisplay');
  const newEmailInput = document.getElementById('newEmail');
  const passwordInput = document.getElementById('password');
  const submitBtn = form?.querySelector('button[type="submit"]');
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');

  // Safety check - return early if elements are missing
  if (!modal || !closeBtn || !form || !currentEmailDisplay || !newEmailInput || !passwordInput || !submitBtn) {
      console.error('Modal elements missing!');
      return;
  }

  // ===== STATE MANAGEMENT =====
  let isInitialized = false;
  const eventListeners = [];

  // ===== HELPER FUNCTIONS =====
  function addEventListener(element, type, handler) {
      element.addEventListener(type, handler);
      eventListeners.push({ element, type, handler });
  }

  function removeEventListeners() {
      eventListeners.forEach(({ element, type, handler }) => {
          element.removeEventListener(type, handler);
      });
      eventListeners.length = 0;
  }

  function clearErrors() {
      [emailError, passwordError].forEach(el => el?.classList.add('hidden'));
      [newEmailInput, passwordInput].forEach(el => el?.classList.remove('border-red-500'));
  }

  // ===== PASSWORD TOGGLE =====
  if (passwordToggleBtn) {
      addEventListener(passwordToggleBtn, 'click', function() {
          const icon = this.querySelector('.material-icons-outlined');
          if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              icon.textContent = 'visibility';
              this.classList.add('text-gray-600');
          } else {
              passwordInput.type = 'password';
              icon.textContent = 'visibility_off';
              this.classList.remove('text-gray-600');
          }
      });
  }

  // ===== VALIDATION FUNCTIONS =====
  function isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
  }

  function createErrorElement(input) {
      const existingError = input.parentNode.querySelector('.error-message');
      if (existingError) return existingError;

      const errorElement = document.createElement('p');
      errorElement.className = 'error-message text-red-500 text-xs mt-1 hidden';
      input.parentNode.appendChild(errorElement);
      return errorElement;
  }

  const emailError = createErrorElement(newEmailInput);
  const passwordError = createErrorElement(passwordInput);

  function validateEmail() {
      const value = newEmailInput.value.trim();
      if (!value) {
          emailError.textContent = 'Email is required';
          emailError.classList.remove('hidden');
          newEmailInput.classList.add('border-red-500');
          return false;
      }
      if (!isValidEmail(value)) {
          emailError.textContent = 'Please enter a valid email address';
          emailError.classList.remove('hidden');
          newEmailInput.classList.add('border-red-500');
          return false;
      }
      if (value === currentEmailDisplay.textContent.trim()) {
          emailError.textContent = 'New email must be different from current email';
          emailError.classList.remove('hidden');
          newEmailInput.classList.add('border-red-500');
          return false;
      }
      emailError.classList.add('hidden');
      newEmailInput.classList.remove('border-red-500');
      return true;
  }

  function validatePassword() {
      const value = passwordInput.value.trim();
      if (!value) {
          passwordError.textContent = 'Password is required';
          passwordError.classList.remove('hidden');
          passwordInput.classList.add('border-red-500');
          return false;
      }
      if (value.length < 8) {
          passwordError.textContent = 'Password must be at least 8 characters';
          passwordError.classList.remove('hidden');
          passwordInput.classList.add('border-red-500');
          return false;
      }
      passwordError.classList.add('hidden');
      passwordInput.classList.remove('border-red-500');
      return true;
  }

  // ===== LOADING STATE =====
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
          : 'Change';
  }

  // ===== TOAST NOTIFICATION =====
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

          setTimeout(() => {
              toast.classList.remove('translate-y-4', 'opacity-0');
              toast.classList.add('translate-y-0', 'opacity-100');
          }, 10);

          const progressBar = toast.querySelector('.toast-progress');
          progressBar.style.width = '100%';
          progressBar.style.transition = 'width 3s linear';
          setTimeout(() => progressBar.style.width = '0%', 10);

          setTimeout(() => {
              toast.classList.add('translate-y-4', 'opacity-0');
              setTimeout(() => toast.remove(), 300);
          }, 3000);
      }
  }

  // ===== MODAL CONTROLS =====
  function closeModal() {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      form.reset();
      clearErrors();
      removeEventListeners();
  }

  function openModal() {
      if (isInitialized) return;
      isInitialized = true;

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      newEmailInput.focus();

      // Add event listeners
      addEventListener(closeBtn, 'click', closeModal);
      addEventListener(modal, 'click', (e) => e.target === modal && closeModal());
      addEventListener(document, 'keydown', (e) => e.key === 'Escape' && !modal.classList.contains('hidden') && closeModal());
      addEventListener(newEmailInput, 'blur', validateEmail);
      addEventListener(passwordInput, 'blur', validatePassword);
      addEventListener(form, 'submit', handleSubmit);
  }

  // ===== FORM SUBMISSION =====
  async function handleSubmit(e) {
      e.preventDefault();

      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      if (!isEmailValid || !isPasswordValid) return;

      setLoading(true);

      try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const newEmail = newEmailInput.value.trim();
          currentEmailDisplay.textContent = newEmail;
          closeModal();
          showSuccessToast('Email updated successfully!');
      } catch (error) {
          console.error('Update failed:', error);
          passwordError.textContent = 'Incorrect password. Please try again.';
          passwordError.classList.remove('hidden');
          passwordInput.classList.add('border-red-500');
      } finally {
          setLoading(false);
      }
  }

  // Initialize modal
  openModal();
})();