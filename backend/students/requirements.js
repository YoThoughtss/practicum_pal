// Import Firebase functions
import { app } from "../firebase";
import { getStorage, ref, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// Initialize Firebase services
const storage = getStorage(app);
const db = getFirestore(app);

// Get student info from local storage
const storedAuth = localStorage.getItem('firebaseUser');
const authData = JSON.parse(storedAuth);
const studentId = authData.studentId;
const lastName = authData.lastName;
const firstName = authData.firstName;

if (!studentId) {
    console.error('No student ID found in local storage');
    // Handle error - maybe redirect to login
}

// Document type mappings
const docTypeMappings = {
    'Memorandum of Agreement': 'MOA',
    'Notarized Parent\'s Consent': 'ParentConsent',
    'Medical Certificate': 'MedicalCertificate',
    'Mental Test Assessment': 'MentalTestAssessment'
};

// Reverse mappings for display
const docDisplayNames = {
    'MOA': 'Memorandum of Agreement',
    'ParentConsent': 'Notarized Parent\'s Consent',
    'MedicalCertificate': 'Medical Certificate',
    'MentalTestAssessment': 'Mental Test Assessment'
};

// Status colors and icons
const statusConfig = {
    'Verified': {
        color: 'bg-green-200 text-green-800',
        icon: 'check_circle',
        canUpload: false,
        canDelete: false,
        canView: true
    },
    'Pending': {
        color: 'bg-yellow-200 text-yellow-800',
        icon: 'schedule',
        canUpload: false,
        canDelete: true,
        canView: true
    },
    'Missing': {
        color: 'bg-red-200 text-red-800',
        icon: 'error_outline',
        canUpload: true,
        canDelete: false,
        canView: false
    },
    'Re-submit': {
        color: 'bg-gray-300 text-gray-800',
        icon: 'schedule',
        canUpload: true,
        canDelete: false,
        canView: true
    }
};

// Initialize the requirements page
async function initRequirements() {
    try {
        // Fetch requirements status from Firestore
        const statusDoc = await getDoc(doc(db, 'students', studentId, 'requirements', 'status'));
        const statusData = statusDoc.exists() ? statusDoc.data() : {};
        
        // Fetch requirements files from Storage
        const requirementsRef = ref(storage, `students/${studentId}/requirements`);
        let files = [];
        
        try {
            const res = await listAll(requirementsRef);
            files = res.items;
        } catch (error) {
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
            // Folder doesn't exist yet - that's okay
        }
        
        // Process all requirement types
        const requirements = [
            'Memorandum of Agreement',
            'Notarized Parent\'s Consent',
            'Medical Certificate',
            'Mental Test Assessment'
        ];
        
        // Update the UI for each requirement
        requirements.forEach(reqName => {
            updateRequirementUI(reqName, statusData, files);
        });
        
    } catch (error) {
        console.error('Error initializing requirements:', error);
        // Show error to user
    }
}

function updateRequirementUI(requirementName, statusData, storageFiles) {
    const docType = docTypeMappings[requirementName];
    const statusKey = `${docType}_status`;
    const status = statusData[statusKey] || 'Missing';
    
    const rows = document.querySelectorAll('.requirement-row');
    const row = Array.from(rows).find(r => 
        r.querySelector('.requirement-name').textContent === requirementName
    );
    
    if (!row) {
        console.error(`Row not found for requirement: ${requirementName}`);
        return;
    }
    
    const statusElement = row.querySelector('.requirement-status');
    const viewButton = row.querySelector('.view-button');
    const actionContainer = row.querySelector('.action-container');
    
    // Get the expected filename
    const expectedFilename = `${studentId}_${docType}.pdf`;
    const fileExists = storageFiles.some(file => file.name === expectedFilename);
    
    // Update status display
    updateStatusElement(statusElement, status);
    
    // Configure view button
    if (fileExists && statusConfig[status].canView) {
        viewButton.disabled = false;
        viewButton.classList.remove('opacity-50', 'cursor-not-allowed');
        viewButton.onclick = async () => {
            try {
                const fileRef = ref(storage, `students/${studentId}/requirements/${expectedFilename}`);
                const url = await getDownloadURL(fileRef);
                window.open(url, '_blank');
            } catch (error) {
                console.error('Error opening file:', error);
                showModal('Error', 'Could not open file. Please try again.');
            }
        };
    } else {
        viewButton.disabled = true;
        viewButton.classList.add('opacity-50', 'cursor-not-allowed');
        viewButton.onclick = null;
        if (!fileExists) {
            const attachmentDiv = viewButton.parentElement;
            attachmentDiv.textContent = '-';
            attachmentDiv.classList.add('text-gray-400');
        }
    }
    
    // Clear action container and add appropriate buttons
    actionContainer.innerHTML = '';
    
    if (statusConfig[status].canUpload) {
        // Add upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'openUploadModal upload-button px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-1 text-xs';
        uploadBtn.innerHTML = '<span class="material-icons" style="font-size: 0.875rem;">attach_file</span> Upload';
        uploadBtn.setAttribute('data-requirement', requirementName);
        
        // Add click handler that works with injectUploadModal.js
        uploadBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleUploadClick(event);
        });
        
        actionContainer.appendChild(uploadBtn);
    }
    
    if (statusConfig[status].canDelete) {
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-1 text-xs';
        deleteBtn.innerHTML = '<span class="material-icons" style="font-size: 0.875rem;">delete</span> Delete';
        deleteBtn.onclick = () => confirmDelete(requirementName, expectedFilename, docType, statusKey);
        actionContainer.appendChild(deleteBtn);
    }
}

function openUploadModal(requirementName) {
    // Get the modal element from the injected modal
    const uploadModal = document.getElementById('upload-modal');
    
    if (!uploadModal) {
        console.error('Upload modal not found');
        showModal('Error', 'Upload system not available. Please try again later.');
        return;
    }
    
    // Set the requirement name in the modal
    const requirementTitle = uploadModal.querySelector('#upload-requirement-title');
    if (requirementTitle) {
        requirementTitle.textContent = requirementName;
    }
    
    // Set the requirement type in a hidden field (if needed)
    const requirementInput = uploadModal.querySelector('input[name="requirementType"]');
    if (requirementInput) {
        requirementInput.value = docTypeMappings[requirementName];
    }
    
    // Show the modal
    uploadModal.classList.remove('hidden');
}



// Modified confirmDelete function to use the modal
async function confirmDelete(requirementName, filename, docType, statusKey) {
    showModal(
        'Confirm Delete',
        `Are you sure you want to delete your ${requirementName}? This action cannot be undone.`,
        true,
        async () => {
            try {
                // Delete file from Storage
                const fileRef = ref(storage, `students/${studentId}/requirements/${filename}`);
                await deleteObject(fileRef);
                
                // Update status in Firestore to 'Missing'
                const statusRef = doc(db, 'students', studentId, 'requirements', 'status');
                await updateDoc(statusRef, {
                    [statusKey]: 'Missing'
                });
                
                // Refresh the UI
                initRequirements();
                
                // Show success message
                showModal('Success', `${requirementName} deleted successfully!`);
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                
            } catch (error) {
                console.error('Error deleting file:', error);
                showModal('Error', 'Failed to delete file. Please try again.');
            }
        }
    );
}


function showModal(title, message, isConfirm = false, confirmCallback = null) {
    const modal = document.getElementById('error-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmButton = document.getElementById('confirm-action');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');
    
    // Set up confirm button based on modal type
    if (isConfirm) {
        confirmButton.textContent = 'Confirm';
        confirmButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        confirmButton.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
        confirmButton.textContent = 'OK';
        confirmButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        confirmButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }
    
    // Clear previous event listeners
    const newConfirm = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirm, confirmButton);
    
    const newClose = document.getElementById('close-modal').cloneNode(true);
    document.getElementById('close-modal').parentNode.replaceChild(newClose, document.getElementById('close-modal'));
    
    // Set up new event listeners
    newConfirm.onclick = () => {
        modal.classList.add('hidden');
        if (isConfirm && confirmCallback) {
            confirmCallback();
        }
    };
    
    newClose.onclick = () => {
        modal.classList.add('hidden');
    };
}


// Update a status element with new status
function updateStatusElement(element, status) {
    const config = statusConfig[status];
    
    // Clear existing classes
    element.className = 'w-32 py-0.5 rounded-full text-xs font-medium flex items-center gap-1';
    
    // Add status-specific classes
    element.classList.add(...config.color.split(' '));
    
    // Update icon
    const icon = element.querySelector('.material-icons-outlined');
    if (icon) {
        icon.textContent = config.icon;
    } else {
        // Create icon if it doesn't exist
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons-outlined transform scale-75';
        iconSpan.textContent = config.icon;
        element.prepend(iconSpan);
    }
    
    // Update text
    const textNode = Array.from(element.childNodes).find(node => 
        node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    
    if (textNode) {
        textNode.textContent = ` ${status}`;
    } else {
        element.appendChild(document.createTextNode(` ${status}`));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initRequirements);