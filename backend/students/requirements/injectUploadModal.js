// Constants
const SELECTORS = {
  uploadButtons: '.openUploadModal', // Class selector for multiple buttons
  modalContainer: '#modals-container',
  modalElement: '#uploadRedModal',
};

const PATHS = {
  modalHTML: '/backend/students/requirements/uploadReqModal.html',
  modalJS: '/backend/students/requirements/uploadReqModal.js',
};

// Make this function available globally
window.handleUploadClick = async function(event) {
  removeExistingModal(); // Always remove any previously injected modal

  try {
    await injectModal();
    
    // Get the requirement name from the data attribute or closest row
    const requirementName = event.target.getAttribute('data-requirement') || 
                          event.target.closest('.grid')?.querySelector('div:first-child')?.textContent?.trim();
    
    if (!requirementName) {
      throw new Error('Could not determine requirement name');
    }
    
    // Set the requirement name in the modal
    const modal = document.querySelector(SELECTORS.modalElement);
    const titleElement = modal.querySelector('.text-center h2');
    titleElement.classList.add('modal-title');
    titleElement.textContent = requirementName;
    
    showExistingModal();
  } catch (error) {
    handleInjectionError(error);
  }
};

// Rest of your existing functions...
function removeExistingModal() {
  const oldModal = document.querySelector(SELECTORS.modalElement);
  if (oldModal) {
    oldModal.remove();
  }

  const oldScript = document.querySelector('script[data-upload-modal]');
  if (oldScript) {
    oldScript.remove();
  }
}

async function injectModal() {
  const container = document.querySelector(SELECTORS.modalContainer);
  if (!container) throw new Error('Modal container not found');

  const response = await fetch(PATHS.modalHTML);
  if (!response.ok) throw new Error('Failed to load modal HTML');
  container.insertAdjacentHTML('beforeend', await response.text());

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PATHS.modalJS;
    script.dataset.uploadModal = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${PATHS.modalJS}`));
    document.body.appendChild(script);
  });
}

function showExistingModal() {
  const modal = document.querySelector(SELECTORS.modalElement);
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function handleInjectionError(error) {
  console.error('Modal injection failed:', error);
  alert('Failed to load upload modal. Please try again later.');
}

// Initialize for buttons that exist at load time
function initUploadModals() {
  document.querySelectorAll(SELECTORS.uploadButtons).forEach(button => {
    button.addEventListener('click', handleUploadClick);
  });
}

document.addEventListener('DOMContentLoaded', initUploadModals);