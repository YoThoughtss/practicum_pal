// changePhoneNumberInjector.js

const CHANGE_PHONE_SELECTORS = {
    editButton: '#openChangePhoneNumberModal',
    modalContainer: '#modals-container',
    modalElement: '#changePhoneNumberModal'
  };
  
  const CHANGE_PHONE_PATHS = {
    modalHTML: '/components/students/personal/changePhoneNumberModal.html',
    modalJS: '/backend/students/personal/change_phone/changePhoneNumberModal.js'
  };
  
  function initChangePhoneModal() {
    const button = document.querySelector(CHANGE_PHONE_SELECTORS.editButton);
    button?.addEventListener('click', handleChangePhoneClick);
  }
  
  async function handleChangePhoneClick() {
    if (document.querySelector(CHANGE_PHONE_SELECTORS.modalElement)) {
      return showModal();
    }
  
    try {
      await injectChangePhoneModal();
      showModal();
    } catch (err) {
      handleInjectionError(err);
    }
  }
  
  async function injectChangePhoneModal() {
    const container = document.querySelector(CHANGE_PHONE_SELECTORS.modalContainer);
    if (!container) throw new Error('Modal container not found');
  
    const htmlResponse = await fetch(CHANGE_PHONE_PATHS.modalHTML);
    if (!htmlResponse.ok) throw new Error('Failed to fetch modal HTML');
    container.insertAdjacentHTML('beforeend', await htmlResponse.text());
  
    const script = document.createElement('script');
    script.src = CHANGE_PHONE_PATHS.modalJS;
    script.onload = () => {
      // Initialize any phone-specific logic after load if needed
    };
    script.onerror = () => console.error('Failed to load phone modal script');
    document.body.appendChild(script);
  }
  
  function showModal() {
    const modal = document.querySelector(CHANGE_PHONE_SELECTORS.modalElement);
    modal?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
  
  function handleInjectionError(err) {
    console.error('Phone modal load failed:', err);
    alert('Failed to open change phone number modal. Please try again.');
  }
  
  // Initialize on DOM ready
  if (document.readyState !== 'loading') {
    initChangePhoneModal();
  } else {
    document.addEventListener('DOMContentLoaded', initChangePhoneModal);
  }