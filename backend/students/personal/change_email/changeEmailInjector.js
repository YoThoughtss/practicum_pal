const CHANGE_EMAIL_SELECTORS = {
  editButton: '#openChangeEmailModal',
  modalContainer: '#modals-container',
  modalElement: '#changeEmailModal'
};

const CHANGE_EMAIL_PATHS = {
  modalHTML: '/components/students/personal/changeEmailModal.html',
  modalJS: '/backend/students/personal/change_email/changeEmailModal.js'
};

function initChangeEmailModal() {
  const button = document.querySelector(CHANGE_EMAIL_SELECTORS.editButton);
  if (button) {
    button.addEventListener('click', handleChangeEmailClick);
    button.style.cursor = 'pointer';
  }
}

async function handleChangeEmailClick(e) {
  e.preventDefault();
  
  try {
    // Remove existing modal if present
    const existingModal = document.querySelector(CHANGE_EMAIL_SELECTORS.modalElement);
    if (existingModal) {
      existingModal.remove();
    }
    
    await injectChangeEmailModal();
  } catch (err) {
    console.error('Email modal load failed:', err);
    alert('Failed to open email change modal. Please try again.');
  }
}

async function injectChangeEmailModal() {
  const container = document.querySelector(CHANGE_EMAIL_SELECTORS.modalContainer);
  if (!container) throw new Error('Modal container not found');

  // Load HTML
  const htmlResponse = await fetch(CHANGE_EMAIL_PATHS.modalHTML);
  if (!htmlResponse.ok) throw new Error('Failed to fetch modal HTML');
  container.insertAdjacentHTML('beforeend', await htmlResponse.text());

  // Load JS
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHANGE_EMAIL_PATHS.modalJS;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Initialize
if (document.readyState === 'complete') {
  initChangeEmailModal();
} else {
  document.addEventListener('DOMContentLoaded', initChangeEmailModal);
}