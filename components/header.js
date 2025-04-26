document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const appTitle = document.getElementById("app-title");
  
    let isCollapsed = false;
  
    toggleBtn?.addEventListener("click", () => {
      isCollapsed = !isCollapsed;
  
      if (isCollapsed) {
        sidebar.classList.replace("w-64", "w-20");
        sidebar.classList.add("overflow-x-hidden");
        appTitle.classList.add("hidden");
  
        document.querySelectorAll(".menu-label").forEach(el => el.classList.add("hidden"));
      } else {
        sidebar.classList.replace("w-20", "w-64");
        sidebar.classList.remove("overflow-x-hidden");
        appTitle.classList.remove("hidden");
  
        document.querySelectorAll(".menu-label").forEach(el => el.classList.remove("hidden"));
      }
    });
  });
  