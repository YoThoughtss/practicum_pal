// File selection logic
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    console.log('File selected:', file);
    const uploadContainer = document.getElementById('upload-container');
    const filePreview = document.getElementById('file-preview-modal');
    const fileName = document.getElementById('file-name-modal');
    const fileSize = document.getElementById('file-size-modal');
    const actionButtons = document.getElementById('action-buttons-modal');
    const uploadButton = document.querySelector('#action-buttons-modal button[type="submit"]');
    const viewButton = document.getElementById('view-file-button');

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    filePreview.classList.remove('hidden');
    actionButtons.classList.remove('hidden');
    uploadContainer.classList.add('file-selected');

    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);
    
    // Store only necessary file metadata for upload
    uploadContainer.dataset.currentFile = JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      requirementType: document.querySelector('.modal-title').textContent.trim(),
      fileUrl: fileUrl  // For preview purposes
    });

    // Store the actual file object separately
    uploadContainer.currentFileObject = file;

    // Set up view button
    if (viewButton) {
      viewButton.onclick = () => {
        window.open(fileUrl, '_blank');
      };
    }

    // Update upload button text
    uploadButton.textContent = 'Upload';
  }
}

// Show modal function
function showModal(title, message, isSuccess = false) {
  const modal = document.getElementById('error-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const confirmButton = document.getElementById('confirm-action');

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Change button color based on success/error
  if (isSuccess) {
    confirmButton.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600';
  } else {
    confirmButton.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
  }

  modal.classList.remove('hidden');

  // Set up event listeners for modal
  document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');
  confirmButton.onclick = () => modal.classList.add('hidden');
}

// Upload file to Firebase Storage
async function uploadFile() {
  const uploadContainer = document.getElementById('upload-container');
  if (!uploadContainer.dataset.currentFile || !uploadContainer.currentFileObject) {
    showModal('Error', 'No file selected');
    return;
  }

  const file = uploadContainer.currentFileObject;
  
  // Double-check file type
  if (file.type !== 'application/pdf') {
    showModal('Error', 'Only PDF files are allowed');
    return;
  }

  const { requirementType } = JSON.parse(uploadContainer.dataset.currentFile);
  const uploadButton = document.querySelector('#action-buttons-modal button[type="submit"]');
  
  try {
    // Get student info from localStorage
    const storedAuth = localStorage.getItem('firebaseUser');
    if (!storedAuth) throw new Error('User not authenticated');
    
    const authData = JSON.parse(storedAuth);
    const studentId = authData.studentId;
    const lastName = authData.lastName;
    const firstName = authData.firstName;

    if (!studentId || !lastName || !firstName) {
      throw new Error('Missing student information');
    }

    // Map requirement names to document types and status fields
    const docTypeMap = {
      'Memorandum of Agreement': {
        docType: 'MOA',
        statusField: 'MOA_status'
      },
      'Notarized Parent\'s Consent': {
        docType: 'ParentConsent',
        statusField: 'ParentConsent_status'
      },
      'Medical Certificate': {
        docType: 'MedicalCertificate',
        statusField: 'MedicalCertificate_status'
      },
      'Mental Test Assessment': {
        docType: 'MentalTestAssessment',
        statusField: 'MentalTestAssessment_status'
      }
    };

    const requirementInfo = docTypeMap[requirementType];
    if (!requirementInfo) throw new Error('Invalid requirement type');

    // Create new filename
    const fileExtension = 'pdf'; // Since we're only accepting PDFs
    const newFileName = `${studentId}_${requirementInfo.docType}.${fileExtension}`;

    // Show uploading state
    uploadButton.disabled = true;
    uploadButton.innerHTML = `
      <span id="upload-button-text">Uploading</span>
      <span id="upload-spinner" class="animate-spin ml-2">
        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
    `;

    // Import Firebase modules
    const { storage, db } = await import('../../firebase.js');
    const { ref, uploadBytes } = await import('firebase/storage');
    const { doc, setDoc, updateDoc } = await import('firebase/firestore');

    // Upload to Firebase Storage
    const storageRef = ref(storage, `students/${studentId}/requirements/${newFileName}`);
    await uploadBytes(storageRef, file);

    // Update Firestore status
    const requirementsRef = doc(db, `students/${studentId}/requirements/status`);
    
    try {
      await setDoc(requirementsRef, {
        [requirementInfo.statusField]: "Pending",
        lastUpdated: new Date()
      }, { merge: true });
      
      console.log('Status updated to Pending');
    } catch (firestoreError) {
      console.error('Error updating status:', firestoreError);
      // Don't fail the whole upload if status update fails
    }

    console.log('File uploaded successfully');
    showModal('Success', 'File uploaded successfully!', true);

    setTimeout(() => {
      closeModal();

    // Refresh the requirements list
    window.location.reload();
  }, 3000);

    
    
  } catch (error) {
    console.error('Upload failed:', error);
    showModal('Upload Failed', error.message);
    uploadButton.disabled = false;
    uploadButton.innerHTML = '<span id="upload-button-text">Upload</span>';
  }
}

// Reset upload state
function cancelUpload() {
  console.log('Upload cancelled');
  const uploadContainer = document.getElementById('upload-container');
  const fileInput = document.getElementById('file-upload-modal');
  const filePreview = document.getElementById('file-preview-modal');
  const actionButtons = document.getElementById('action-buttons-modal');

  // Clean up object URL if it exists
  if (uploadContainer.dataset.currentFile) {
    const { fileUrl } = JSON.parse(uploadContainer.dataset.currentFile);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  }

  fileInput.value = '';
  filePreview.classList.add('hidden');
  actionButtons.classList.add('hidden');
  uploadContainer.classList.remove('file-selected', 'drop-zone-active');
  delete uploadContainer.dataset.currentFile;
  delete uploadContainer.currentFileObject;
}

// Close modal
function closeModal() {
  const modal = document.getElementById('uploadRedModal');
  if (modal) {
    console.log('Modal closed');
    modal.classList.add('hidden');
  }
  document.body.classList.remove('overflow-hidden');
  cancelUpload();
}

// Drag and Drop Handlers
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('Dragging file over');
  document.getElementById('upload-container')?.classList.add('drop-zone-active');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('Drag left');
  document.getElementById('upload-container')?.classList.remove('drop-zone-active');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('File dropped');
  const container = document.getElementById('upload-container');
  container.classList.remove('drop-zone-active');

  const files = e.dataTransfer.files;
  if (files.length) {
    // Check if dropped file is PDF
    if (files[0].type !== 'application/pdf') {
      showModal('Error', 'Only PDF files can be dropped');
      return;
    }
    
    const fileInput = document.getElementById('file-upload-modal');
    fileInput.files = files;
    handleFileSelect({ target: fileInput });
  }
}

// Event handlers
function setupEventListeners() {
  console.log('Setting up event listeners');

  // Handle ESC key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      console.log('ESC key pressed');
      closeModal();
    }
  });

  // Handle close button via delegation
  document.addEventListener('click', (event) => {
    if (event.target.closest('#close-upload-modal')) {
      console.log('Close button clicked');
      closeModal();
    }
    
    if (event.target.closest('#action-buttons-modal button[type="submit"]')) {
      console.log('Upload button clicked');
      uploadFile();
    }
  });

  // File input change
  const fileUpload = document.getElementById('file-upload-modal');
  if (fileUpload) {
    fileUpload.addEventListener('change', handleFileSelect);
  }

  // Drag & drop listeners
  const uploadContainer = document.getElementById('upload-container');
  if (uploadContainer) {
    uploadContainer.addEventListener('dragover', handleDragOver);
    uploadContainer.addEventListener('dragleave', handleDragLeave);
    uploadContainer.addEventListener('drop', handleDrop);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  setupEventListeners();
}