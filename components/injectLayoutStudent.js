// Inject Favicons into <head>
fetch("/assets/favicons.html")
  .then(res => res.text())
  .then(html => {
    document.head.insertAdjacentHTML("beforeend", html);
    console.log("Favicons injected!");
  })
  .catch(err => {
    console.error("Failed to inject favicons:", err);
  });

// Add this new function
async function setupAuthorization(sidebarContainer) {
  try {
    const storedAuth = localStorage.getItem('firebaseUser');
    const authData = JSON.parse(storedAuth);
    const studentId = authData.studentId;
    if (!studentId) {
      console.error("No student ID found");
      return;
    }

    // Fetch fresh authorization status from Firestore
    const { isAuthorized } = await fetchAuthorizationStatus(studentId);
    
    // Apply UI changes based on Firestore status
    const protectedItems = sidebarContainer.querySelectorAll('[data-auth-required="true"]');
    protectedItems.forEach(item => {
      if (!isAuthorized) {
        // Disable items if not authorized
        item.classList.add(
          'opacity-50',
          'cursor-not-allowed',
          'pointer-events-none',
          'hover:border-transparent'
        );
        
        const icon = item.querySelector('.material-icons-outlined');
        if (icon) {
          item.dataset.originalIcon = icon.textContent;
          icon.textContent = 'lock';
          icon.classList.remove('text-gray-500');
          icon.classList.add('text-gray-400');
        }
      } else {
        // Ensure items are enabled if authorized
        item.classList.remove(
          'opacity-50',
          'cursor-not-allowed',
          'pointer-events-none',
          'hover:border-transparent'
        );
        
        const icon = item.querySelector('.material-icons-outlined');
        if (icon && item.dataset.originalIcon) {
          icon.textContent = item.dataset.originalIcon;
          icon.classList.add('text-gray-500');
          icon.classList.remove('text-gray-400');
        }
      }
    });
  } catch (error) {
    console.error("Authorization setup failed:", error);
  }
}

// Fetch only the authorization status from Firestore
async function fetchAuthorizationStatus(studentId) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../backend/firebase.js');
    
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      return {
        isAuthorized: studentSnap.data().isAuthorized || false
      };
    }
    return { isAuthorized: false };
  } catch (error) {
    console.error("Error fetching authorization status:", error);
    return { isAuthorized: false };
  }
}
  
// Main function to inject layout components
async function injectComponents() {
  try {
    const storedAuth = localStorage.getItem('firebaseUser');
    const authData = JSON.parse(storedAuth);
    const studentId = authData.studentId;
    console.log("Current student ID:", studentId);

    // Fetch all layout components
    const [headerHTML, studentSidebarHTML, rightbarHTML] = await Promise.all([
      fetch("/components/header.html").then(res => res.text()),
      fetch("/components/student_sidebar.html").then(res => res.text()),
      fetch("/components/rightbar.html").then(res => res.text())
    ]);

    // Inject components
    document.getElementById("header-container").innerHTML = headerHTML;
    const sidebarContainer = document.getElementById("sidebar-container");
    document.getElementById("sidebar-container").innerHTML = studentSidebarHTML;
    document.getElementById("rightbar-container").innerHTML = rightbarHTML;

    // Fetch fresh student data from Firestore (including isAuthorized)
    const studentData = studentId ? await fetchStudentData(studentId) : null;
    
    // Setup authorization based on Firestore data
    await setupAuthorization(sidebarContainer);
    
    // Update profile with fresh data
    if (studentData) {
      await updateSidebarProfile(studentData);
    }

    // Load component scripts
    await Promise.all([
      loadScript("/components/header.js"),
      loadScript("/components/student_sidebar.js"),
      loadScript("/components/rightbar.js")
    ]);

  } catch (error) {
    console.error("Failed to inject components:", error);
  }
}

// Helper function to fetch student data
async function fetchStudentData(studentId) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../backend/firebase.js');
    
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        studentId: studentId,
        firstName: data.firstName,
        lastName: data.lastName,
        program: data.program,
        profileImage: data.profileImage || null,
        isAuthorized: data.isAuthorized || false
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching student data:', error);
    return null;
  }
}

async function updateSidebarProfile(studentData) {
  console.log('Updating sidebar with:', studentData);
  
  // Update name and program
  const profileName = document.querySelector('#sidebar .profile-name');
  const profileProgram = document.querySelector('#sidebar .profile-program');
  
  if (profileName && studentData?.firstName && studentData?.lastName) {
    profileName.textContent = `${studentData.firstName} ${studentData.lastName}`;
  }
  
  if (profileProgram && studentData?.program) {
    profileProgram.textContent = studentData.program;
  }

  // Update profile image with cache busting
  const profileImage = document.getElementById('sidebar-profile-image');
  const loader = document.getElementById('profile-image-loader');
  
  if (!profileImage) {
    console.error('Profile image element not found!');
    return;
  }

  if (loader) loader.classList.remove('hidden');

  try {
    // Use cached image if available (with cache busting)
    const storedAuth = localStorage.getItem('firebaseUser');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      if (authData.profileImage) {
        profileImage.src = `${authData.profileImage}&t=${Date.now()}`;
        if (loader) loader.classList.add('hidden');
        return;
      }
    }

    // Fetch fresh image from Firestore if we have studentId
    if (studentData?.studentId) {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../backend/firebase.js');
      
      const studentRef = doc(db, 'students', studentData.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists() && studentSnap.data().profileImage) {
        const imageUrl = studentSnap.data().profileImage;
        
        // Preload image to prevent flickering
        const img = new Image();
        img.src = `${imageUrl}&t=${Date.now()}`;
        img.onload = () => {
          profileImage.src = img.src;
          if (loader) loader.classList.add('hidden');
          
          // Update cache
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            authData.profileImage = imageUrl;
            localStorage.setItem('firebaseUser', JSON.stringify(authData));
          }
        };
        img.onerror = () => {
          if (loader) loader.classList.add('hidden');
          console.error('Failed to load profile image');
        };
      } else {
        if (loader) loader.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error loading profile image:', error);
    if (loader) loader.classList.add('hidden');
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Call the injectComponents function on page load
document.addEventListener('DOMContentLoaded', injectComponents);