document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const appTitle = document.getElementById("app-title");

    let isCollapsed = false;

    toggleBtn?.addEventListener("click", () => {
      isCollapsed = !isCollapsed;

      if (isCollapsed) {
        sidebar.classList.replace("w-64", "w-20");
        sidebar.classList.add("overflow-x-hidden");
        appTitle?.classList.add("hidden");

        document.querySelectorAll(".menu-label").forEach(el => el.classList.add("hidden"));
      } else {
        sidebar.classList.replace("w-20", "w-64");
        sidebar.classList.remove("overflow-x-hidden");
        appTitle?.classList.remove("hidden");

        document.querySelectorAll(".menu-label").forEach(el => el.classList.remove("hidden"));
      }
    });

    // 🔥 Highlight Active Link
    const currentPath = window.location.pathname;
    console.log("Current path:", currentPath);

    document.querySelectorAll("#sidebar a").forEach(link => {
      const linkHref = link.getAttribute("href");
      console.log("Checking link:", linkHref);

      if (linkHref && currentPath.includes(linkHref)) {
        console.log("Active link:", linkHref);
        link.classList.add("text-[#FD697F]", "bg-[#FFE4E8]", "border-[#FD697F]", "font-semibold");
      } else {
        link.classList.remove("text-[#FD697F]", "bg-[#FFE4E8]", "border-[#FD697F]", "font-semibold");
      }
    });
  }, 0); // or use 100ms delay if needed
});