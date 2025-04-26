import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


function validatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    requirements: {
      minLength: hasMinLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      number: hasNumber,
      specialChar: hasSpecialChar
    }
  };
}



// Add this function to update the UI
function updatePasswordRequirements(requirements) {
  const requirementElements = {
    minLength: document.querySelector('.req-length'),
    upperCase: document.querySelector('.req-upper'),
    lowerCase: document.querySelector('.req-lower'),
    number: document.querySelector('.req-number'),
    specialChar: document.querySelector('.req-special')
  };

  // Update each requirement with checkmark or x
  for (const [key, element] of Object.entries(requirementElements)) {
    if (element) {
      element.classList.toggle('valid', requirements[key]);
      element.classList.toggle('invalid', !requirements[key]);
    }
  }
}





document.addEventListener('DOMContentLoaded', async () => {
  const programSelect = document.getElementById('program');
  const blockSectionSelect = document.getElementById('block-section');
  const errorPopup = document.getElementById('error-popup');
  const popupMessage = document.getElementById('popup-message');
  const popupTitle = document.getElementById('popup-title');
  const closePopup = document.querySelector('.close-popup');
  
  // Initially disable block/section dropdown
  blockSectionSelect.disabled = true;
  
  try {
    // Get the programs document from Firestore
    const programsDocRef = doc(db, 'Cas', 'program');
    const programsDocSnap = await getDoc(programsDocRef);
    
    if (programsDocSnap.exists()) {
      const programsData = programsDocSnap.data();
      
      // Clear existing options except the first one
      while (programSelect.options.length > 1) {
        programSelect.remove(1);
      }
      
      // Populate program dropdown
      Object.keys(programsData).sort().forEach(programName => {
        const option = document.createElement('option');
        option.value = programName;
        option.textContent = programName;
        programSelect.appendChild(option);
      });
    } else {
      console.log('No programs found in Firestore');
    }
  } catch (error) {
    console.error('Error loading programs:', error);
  }
  
  function validateContactNumber(contact) {
    // Remove all non-digit characters
    const cleaned = contact.replace(/\D/g, '');
    
    // Check if it starts with 09 and has exactly 11 digits
    return /^09\d{9}$/.test(cleaned);
  }


  // Add event listener to program dropdown to update block/section options
  programSelect.addEventListener('change', async (e) => {
    const selectedProgram = e.target.value;
    
    // Reset block/section dropdown
    while (blockSectionSelect.options.length > 1) {
      blockSectionSelect.remove(1);
    }
    
    // Add default option
    blockSectionSelect.innerHTML = '<option value="">Select Section</option>';
    blockSectionSelect.disabled = !selectedProgram;
    
    if (!selectedProgram) {
      return;
    }
    
    try {
      // Get the programs document again
      const programsDocRef = doc(db, 'Cas', 'program');
      const programsDocSnap = await getDoc(programsDocRef);
      
      if (programsDocSnap.exists()) {
        const programsData = programsDocSnap.data();
        const sections = programsData[selectedProgram];
        
        // Populate block/section dropdown if sections exist
        if (sections && sections.length > 0) {
          sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            blockSectionSelect.appendChild(option);
          });
        } else {
          console.log('No sections found for selected program');
        }
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  });
  
  // Password toggle functionality
  const togglePassword = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');

  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const validation = validatePassword(password);
      updatePasswordRequirements(validation.requirements);
    });
  }
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }

  // Close popup handlers
  if (closePopup) {
    closePopup.addEventListener('click', () => {
        errorPopup.classList.remove('show');
    });
    
    errorPopup.addEventListener('click', (e) => {
        if (e.target === errorPopup) {
            errorPopup.classList.remove('show');
        }
    });
}

function showErrorPopup(title, message, autoClose = true) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    errorPopup.classList.add('show');
    
    if (autoClose) {
        setTimeout(() => {
            errorPopup.classList.remove('show');
        }, 5000);
    }
}

  
  
  const contactInput = document.getElementById('contact');
  if (contactInput) {
    contactInput.addEventListener('input', (e) => {
      // Remove all non-digit characters
      let value = e.target.value.replace(/\D/g, '');
      
      // Limit to 9 characters (after 09 prefix)
      if (value.length > 9) {
        value = value.substring(0, 9);
      }
      
      // Update the input value
      e.target.value = value;
    });
    
    
  }




// Form submission handling
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        document.getElementById('gender-error').style.display = 'none';
        
        try {
            // Validate program and block selection
            const program = document.getElementById('program').value;
            const blockSection = document.getElementById('block-section').value;
            
            if (!program || !blockSection) {
                showErrorPopup('Missing Information', 'Please select both a program and a block/section', false);
                return;
            }
            
            // Get other form values
            const studentId = document.getElementById('student-id').value.trim();
            const email = document.getElementById('email').value.trim();
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const contact = '09' + document.getElementById('contact').value.trim();
            const password = document.getElementById('password').value;

            const genderSelect = document.getElementById('gender');
            const nameRegex = /^[A-Za-z]+$/;

            // Validate required fields
            if (!studentId || !email || !firstName || !lastName || !program || !blockSection || !contact || !password || !gender) {
              showErrorPopup('Missing Information', 'Please fill in all required fields', false);
              return;
          }

          // Validate student ID format
          if (!validateStudentId(studentId)) {
              showErrorPopup('Invalid Student ID', 'Student ID must be in the format 0000-0000 (numbers only)', false);
              return;
          }

          // Validate names (using the HTML5 pattern attribute as backup
          if (!nameRegex.test(firstName)) {
              showErrorPopup('Invalid First Name', 'First name should contain only letters, spaces, apostrophes, or hyphens.', false);
              return;
          }

          if (!nameRegex.test(lastName)) {
              showErrorPopup('Invalid Last Name', 'Last name should contain only letters, spaces, apostrophes, or hyphens.', false);
              return;
          }



            const gender = document.getElementById('gender').value;
            if (!gender) {
                document.getElementById('gender-error').style.display = 'block';
                showErrorPopup('Missing Information', 'Please select your gender', false);
                return;
            }

            if (genderSelect) {
              genderSelect.addEventListener('change', (e) => {
                  if (e.target.value) {
                      document.getElementById('gender-error').style.display = 'none';
                  }
              });
          }
            
            // Validate contact number
            if (!validateContactNumber(contact)) {
                showErrorPopup('Invalid Contact', 'Contact number must start with 09 and be 11 digits long', false);
                return;
            }
            
            // Validate password
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                showErrorPopup('Weak Password', 'Password does not meet all requirements', false);
                return;
            }
            
            // 1. Create authentication user
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const uid = user.uid;
            
            // 2. Send email verification
            await sendEmailVerification(user);
            
            // 3. Prepare student data for Firestore
            const studentData = {
                block: blockSection,
                contactNumber: contact,
                email: email,
                firstName: firstName,
                lastName: lastName,
                program: program,
                studentId: studentId,
                isAuthorized: false,
                uid: uid,
                profileImage: getDefaultProfileImageUrl(studentId),
                emailVerified: false, // Track email verification status
                gender: gender,
                companyName: null,
                companyAddress: null
            };
            
            // 4. Save to Firestore
            await setDoc(doc(db, 'students', studentId), studentData);

            // 5. Create requirements subcollection and documents
            const requirementsRef = collection(db, 'students', studentId, 'requirements');

            // Add placeholder document
            await setDoc(doc(requirementsRef, 'placeholder'), {
              isExists: true
            });

            // Add status document
            await setDoc(doc(requirementsRef, 'status'), {
              MOA_status: "Missing",
              MedicalCertificate_status: "Missing",
              MentalTestAssessment_status: "Missing",
              ParentConsent_status: "Missing"
            });

            
            // 6. Show success message and redirect
            showErrorPopup('Success', 'Registration successful! A verification email has been sent to your email address. Please verify your email and wait for admin approval.', false);
            
            // Redirect after popup is closed
            const closeButton = document.querySelector('.close-popup');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    window.location.href = '/pages/student-login.html';
                }, { once: true });
            }
            
            // Also redirect if clicked outside popup
            const errorPopup = document.getElementById('error-popup');
            if (errorPopup) {
                errorPopup.addEventListener('click', (e) => {
                    if (e.target === errorPopup) {
                        window.location.href = '/pages/student-login.html';
                    }
                }, { once: true });
            }
            
        } catch (error) {
            console.error('Error during registration:', error);
            let errorMessage = 'Registration failed. ';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak (min 8 characters with mix of letters, numbers and symbols).';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else {
                errorMessage = error.message || 'Please try again later.';
            }
            
            showErrorPopup('Registration Error', errorMessage, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    });
}
});

// Helper function to generate default profile image URL
function getDefaultProfileImageUrl(studentId) {
  const bucketName = "practicumpal.firebasestorage.app"; // Change if your bucket name is different
  const encodedStudentId = studentId.replace("-", "%2D");
  const resizedFileName = "ic_user_1024x1024.jpeg";
  
  return "https://firebasestorage.googleapis.com/v0/b/" + bucketName +
         "/o/students%2F" + resizedFileName + "?alt=media";
}