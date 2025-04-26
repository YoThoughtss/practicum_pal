(function() {
  // DOM Elements
  const modal = document.getElementById('changePhoneNumberModal');
  const closeBtn = document.getElementById('closeChangePhoneNumberModal');
  const form = document.getElementById('changePhoneNumberForm');
  const currentPhoneDisplay = document.getElementById('currentPhoneDisplay');
  const newPhoneInput = document.getElementById('newPhoneNumber');
  const passwordInput = document.getElementById('password');
  const submitBtn = form.querySelector('button[type="submit"]');
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');

  // Safety check
  if (!modal || !closeBtn || !form || !currentPhoneDisplay || !newPhoneInput || !passwordInput) {
    console.error('Modal elements missing!');
    return;
  }

  // ===== 1. PHONE NUMBER VALIDATION ===== //
  function isValidPhoneNumber(phone) {
    return /^09\d{9}$/.test(phone);
  }

  // Prevent non-numeric input
  newPhoneInput.addEventListener('keydown', (e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) || 
        (e.keyCode === 65 && e.ctrlKey === true) || // Ctrl+A
        (e.keyCode >= 35 && e.keyCode <= 39)) { // Home, End, Left, Right
      return;
    }
    // Prevent if not a number
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57))) {
      e.preventDefault();
    }
  });

  // Format phone number as user types
  newPhoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    e.target.value = value;
  });

  // ===== 2. PASSWORD TOGGLE ===== /
  if (passwordToggleBtn) {
    passwordToggleBtn.addEventListener('click', function() {
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

  // ===== 3. LOADING SPINNER ===== //
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

  // ===== 4. ERROR HANDLING ===== //
  function createErrorElement(input) {
    // Check if error element already exists
    const existingError = input.parentNode.querySelector('.error-message');
    if (existingError) return existingError;

    const errorElement = document.createElement('p');
    errorElement.className = 'error-message text-red-500 text-xs mt-1 hidden';
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    return errorElement;
  }

  const phoneError = createErrorElement(newPhoneInput);
  const passwordError = createErrorElement(passwordInput);

  function validatePhone() {
    const value = newPhoneInput.value.trim();
    if (!value) {
      phoneError.textContent = 'Phone number is required';
      phoneError.classList.remove('hidden');
      newPhoneInput.classList.add('border-red-500');
      return false;
    }
    if (!isValidPhoneNumber(value)) {
      phoneError.textContent = 'Must be 11 digits starting with 09';
      phoneError.classList.remove('hidden');
      newPhoneInput.classList.add('border-red-500');
      return false;
    }
    if (value === currentPhoneDisplay.textContent.trim()) {
      phoneError.textContent = 'New number must be different';
      phoneError.classList.remove('hidden');
      newPhoneInput.classList.add('border-red-500');
      return false;
    }
    phoneError.classList.add('hidden');
    newPhoneInput.classList.remove('border-red-500');
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
      passwordError.textContent = 'Must be at least 8 characters';
      passwordError.classList.remove('hidden');
      passwordInput.classList.add('border-red-500');
      return false;
    }
    passwordError.classList.add('hidden');
    passwordInput.classList.remove('border-red-500');
    return true;
  }

  // ===== 5. MODAL CONTROLS ===== //
  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    form.reset();
    [phoneError, passwordError].forEach(el => el.classList.add('hidden'));
    [newPhoneInput, passwordInput].forEach(el => el.classList.remove('border-red-500'));
  }

  function openModal() {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    newPhoneInput.focus();
  }

  // ===== 6. EVENT LISTENERS ===== //
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => e.target === modal && closeModal());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && !modal.classList.contains('hidden') && closeModal());

  newPhoneInput.addEventListener('blur', validatePhone);
  passwordInput.addEventListener('blur', validatePassword);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isPhoneValid = validatePhone();
    const isPasswordValid = validatePassword();
    if (!isPhoneValid || !isPasswordValid) return;

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newPhone = newPhoneInput.value.trim();
      currentPhoneDisplay.textContent = newPhone;
      closeModal();
      showSuccessToast('Phone number updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      passwordError.textContent = 'Incorrect password';
      passwordError.classList.remove('hidden');
      passwordInput.classList.add('border-red-500');
    } finally {
      setLoading(false);
    }
  });

  // ===== 7. TOAST NOTIFICATION ===== //
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

  // Initialize
  openModal();
})();