// injectSettings.js
// Constants
const SELECTORS = {
  editButton: '#openEditNameModal',
  modalContainer: '#modals-container',
  modalElement: '#editNameModal'
};

const PATHS = {
  modalHTML: '/components/students/personal/editNameModal.html',
  modalJS: '/backend/students/personal/edit_name/editNameModal.js'
};

// Main initialization
function initEditNameModal() {
  const editButton = document.querySelector(SELECTORS.editButton);
  editButton?.addEventListener('click', handleEditNameClick);
}

// Click handler
async function handleEditNameClick() {
  if (isModalAlreadyInjected()) {
    return showExistingModal();
  }

  try {
    await injectModal();
    // Show immediately after injection
    showExistingModal();
  } catch (error) {
    handleInjectionError(error);
  }
}

// Modal injection
async function injectModal() {
  const container = getModalContainer();
  await injectModalHTML(container);
  await injectModalJS();
}

// Helper functions
function isModalAlreadyInjected() {
  return document.querySelector(SELECTORS.modalElement) !== null;
}

function showExistingModal() {
  const modal = document.querySelector(SELECTORS.modalElement);
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function getModalContainer() {
  const container = document.querySelector(SELECTORS.modalContainer);
  if (!container) throw new Error('Modal container not found');
  return container;
}

async function injectModalHTML(container) {
  const response = await fetch(PATHS.modalHTML);
  if (!response.ok) throw new Error('Failed to load modal HTML');
  container.insertAdjacentHTML('beforeend', await response.text());
}

async function injectModalJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PATHS.modalJS;
    script.type = "module"; // Add this line to support ES modules
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${PATHS.modalJS}`));
    document.body.appendChild(script);
  });
}

function handleInjectionError(error) {
  console.error('Modal injection failed:', error);
  // Optional: Show user-friendly error message
  alert('Failed to load editor. Please try again later.');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initEditNameModal);